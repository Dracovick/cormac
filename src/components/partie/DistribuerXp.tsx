'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { distribuerXp, getGroupeXp, type PersonnageXp } from '@/app/actions/journal'
import { XP_PAR_NIVEAU } from '@/lib/dnd35/rules'

// Distribution d'XP depuis la vue du MJ : le total de la rencontre est réparti
// également entre les personnages cochés (pénalité multi-classes déduite), puis
// chaque part reste ajustable à la main avant de confirmer.
export function DistribuerXp({ jour }: { jour: string }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [persos, setPersos] = useState<PersonnageXp[] | null>(null)
  const [total, setTotal] = useState('')
  const [coches, setCoches] = useState<Set<number>>(new Set())
  const [ajoutes, setAjoutes] = useState<number[]>([])
  const [montants, setMontants] = useState<Record<number, string>>({})
  const [isPending, startTransition] = useTransition()

  function ouvrir() {
    setOuvert(true)
    setPersos(null)
    setTotal('')
    setAjoutes([])
    setMontants({})
    startTransition(async () => {
      const liste = await getGroupeXp(jour)
      setPersos(liste)
      setCoches(new Set(liste.filter(p => p.actif).map(p => p.id)))
    })
  }

  // Répartition égale du total entre les cochés, pénalité multi-classes déduite.
  // Recalculée à chaque changement du total ou des coches (écrase les ajustements).
  function repartir(totalStr: string, cochesSet: Set<number>, liste: PersonnageXp[]) {
    const t = parseInt(totalStr, 10)
    const n = cochesSet.size
    const prochains: Record<number, string> = {}
    if (Number.isInteger(t) && t > 0 && n > 0) {
      const part = Math.floor(t / n)
      for (const p of liste) {
        if (cochesSet.has(p.id)) prochains[p.id] = String(Math.floor(part * (100 - p.penalite) / 100))
      }
    }
    setMontants(prochains)
  }

  function changerTotal(v: string) {
    setTotal(v)
    if (persos) repartir(v, coches, persos)
  }

  function basculer(id: number) {
    const s = new Set(coches)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setCoches(s)
    if (persos) repartir(total, s, persos)
  }

  function ajouterPersonnage(id: number) {
    if (!id) return
    setAjoutes(prev => [...prev, id])
    const s = new Set(coches)
    s.add(id)
    setCoches(s)
    if (persos) repartir(total, s, persos)
  }

  function confirmer() {
    if (!persos) return
    const parts = persos
      .filter(p => coches.has(p.id))
      .map(p => ({ personnageId: p.id, montant: parseInt(montants[p.id] ?? '', 10) }))
      .filter(p => Number.isInteger(p.montant) && p.montant > 0)
    if (parts.length === 0) return
    startTransition(async () => {
      await distribuerXp(parts)
      setOuvert(false)
      router.refresh()
    })
  }

  const visibles = persos?.filter(p => p.actif || ajoutes.includes(p.id)) ?? []
  const restants = persos?.filter(p => !p.actif && !ajoutes.includes(p.id)) ?? []
  const nbValides = visibles.filter(p => coches.has(p.id) && parseInt(montants[p.id] ?? '', 10) > 0).length

  if (!ouvert) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-stone-600 text-xs uppercase tracking-wide">Récompense :</span>
        <button
          onClick={ouvrir}
          className="text-xs bg-yellow-900/30 hover:bg-yellow-800/50 text-yellow-400 hover:text-yellow-300 rounded px-2 py-1 transition-colors"
          title="Distribuer les points d'expérience de la rencontre au groupe"
        >⭐ Distribuer l&apos;XP</button>
      </div>
    )
  }

  return (
    <div className="mb-3 bg-stone-900/80 border border-yellow-900/50 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-yellow-300 text-sm font-semibold">⭐ Distribution d&apos;XP</span>
        <button
          onClick={() => setOuvert(false)}
          className="text-stone-500 hover:text-stone-300 text-sm px-2 min-h-[32px] transition-colors"
          title="Fermer sans distribuer"
        >✕</button>
      </div>

      {!persos ? (
        <div className="text-stone-500 text-sm py-2">Chargement du groupe…</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="text-stone-400 text-sm" htmlFor="xp-total">XP de la rencontre :</label>
            <input
              id="xp-total"
              type="number"
              min={1}
              inputMode="numeric"
              value={total}
              onChange={e => changerTotal(e.target.value)}
              placeholder="ex. 1800"
              className="w-28 bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-stone-200 text-base sm:text-sm placeholder:text-stone-600 focus:outline-none focus:border-yellow-600"
              autoFocus
            />
            <span className="text-stone-600 text-xs">réparti également entre les cochés — ajustez ensuite chaque part au besoin</span>
          </div>

          <div className="space-y-1.5 mb-3">
            {visibles.map(p => {
              const montant = parseInt(montants[p.id] ?? '', 10)
              const apres = Number.isInteger(montant) && montant > 0 ? p.xp + montant : null
              // Aperçu du 🎉 : plus haut seuil (≤ 20) que cette part fait franchir
              let franchi: number | null = null
              if (apres != null) {
                for (let n = Math.max(p.niveauTotal + 1, 2); n <= 20; n++) {
                  const seuil = XP_PAR_NIVEAU[n]
                  if (apres >= seuil && p.xp < seuil) franchi = n
                }
              }
              return (
                <div key={p.id} className={`flex flex-wrap items-center gap-2 rounded px-2 py-1.5 ${coches.has(p.id) ? 'bg-stone-950/70' : 'bg-stone-950/30 opacity-60'}`}>
                  <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer min-h-[28px]">
                    <input
                      type="checkbox"
                      checked={coches.has(p.id)}
                      onChange={() => basculer(p.id)}
                      className="accent-yellow-600 shrink-0"
                    />
                    <span className="text-stone-200 text-sm truncate">{p.nom}</span>
                    <span className="text-stone-600 text-xs shrink-0">niv. {p.niveauTotal}</span>
                    {p.penalite > 0 && (
                      <span
                        className="text-red-400/90 text-[10px] border border-red-900/60 rounded px-1 shrink-0"
                        title={`Pénalité d'XP multi-classes de ${p.penalite} % (classes déséquilibrées) — déjà déduite de la part proposée`}
                      >−{p.penalite} %</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={montants[p.id] ?? ''}
                    onChange={e => setMontants(prev => ({ ...prev, [p.id]: e.target.value }))}
                    disabled={!coches.has(p.id)}
                    placeholder="0"
                    className="w-24 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-yellow-200 text-base sm:text-sm text-right font-mono focus:outline-none focus:border-yellow-600 disabled:opacity-40"
                  />
                  <span className="text-stone-500 text-xs font-mono shrink-0 w-28 text-right">
                    {p.xp.toLocaleString('fr-CA')}{apres != null && <> → <span className="text-stone-300">{apres.toLocaleString('fr-CA')}</span></>}
                  </span>
                  {franchi && (
                    <span className="text-yellow-300 text-xs shrink-0" title={`Le total franchit le seuil du niveau ${franchi} (${XP_PAR_NIVEAU[franchi].toLocaleString('fr-CA')} XP)`}>
                      🎉 niv. {franchi} !
                    </span>
                  )}
                </div>
              )
            })}
            {visibles.length === 0 && (
              <div className="text-stone-600 text-sm italic py-1">Aucun personnage actif ce jour-là — ajoutez-les ci-dessous.</div>
            )}
          </div>

          {restants.length > 0 && (
            <div className="mb-3">
              <select
                value=""
                onChange={e => ajouterPersonnage(parseInt(e.target.value, 10))}
                className="bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-stone-400 text-base sm:text-sm focus:outline-none focus:border-yellow-600 max-w-full"
              >
                <option value="">+ Ajouter un personnage absent de la chronique…</option>
                {restants.map(p => (
                  <option key={p.id} value={p.id}>{p.nom} (niv. {p.niveauTotal})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={confirmer}
              disabled={isPending || nbValides === 0}
              className="text-sm bg-yellow-900/40 hover:bg-yellow-800/60 disabled:opacity-40 border border-yellow-800/50 text-yellow-300 rounded px-3 py-1.5 min-h-[36px] transition-colors"
            >
              ⭐ Distribuer{nbValides > 0 ? ` à ${nbValides} personnage${nbValides > 1 ? 's' : ''}` : ''}
            </button>
            <span className="text-stone-600 text-xs">L&apos;XP s&apos;ajoute aux fiches et s&apos;inscrit dans la chronique.</span>
          </div>
        </>
      )}
    </div>
  )
}

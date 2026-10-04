'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ajouterCombattant, demarrerCombat, deplacerCombattant, getPersonnagesInitiative,
  retirerCombattant, terminerCombat, tourSuivant,
  type CombatActif, type EntrantCombat, type PersonnageInitiative,
} from '@/app/actions/combat'

type Props = { combat: CombatActif | null; jour: string }

type LigneAdversaire = { nom: string; mod: string; jet: string }

const signe = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

// Ordre d'initiative de la table : les joueurs lancent leur vrai d20, le MJ entre
// les résultats bruts — l'app ajoute le modificateur de chaque fiche et tient l'ordre.
export function CombatTracker({ combat, jour }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Préparation ──
  const [prepOuverte, setPrepOuverte] = useState(false)
  const [persos, setPersos] = useState<PersonnageInitiative[] | null>(null)
  const [jets, setJets] = useState<Record<number, string>>({})
  const [montrerTous, setMontrerTous] = useState(false)
  const [adversaires, setAdversaires] = useState<LigneAdversaire[]>([])

  // ── Renfort en plein combat ──
  const [renfortOuvert, setRenfortOuvert] = useState(false)
  const [renfort, setRenfort] = useState<LigneAdversaire>({ nom: '', mod: '', jet: '' })
  const [renfortPersoId, setRenfortPersoId] = useState(0)

  function rafraichir(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
      router.refresh()
    })
  }

  function ouvrirPreparation() {
    setPrepOuverte(true)
    setPersos(null)
    setJets({})
    setMontrerTous(false)
    setAdversaires([])
    startTransition(async () => {
      setPersos(await getPersonnagesInitiative(jour))
    })
  }

  function chargerPersosPourRenfort() {
    setRenfortOuvert(true)
    setRenfort({ nom: '', mod: '', jet: '' })
    setRenfortPersoId(0)
    if (!persos) startTransition(async () => { setPersos(await getPersonnagesInitiative(jour)) })
  }

  const jetValide = (v: string) => {
    const n = parseInt(v, 10)
    return Number.isInteger(n) && n >= 1 && n <= 20
  }

  function entrantsPrepares(): EntrantCombat[] {
    const liste: EntrantCombat[] = []
    for (const p of persos ?? []) {
      if (jetValide(jets[p.id] ?? '')) liste.push({ nom: p.nom, personnageId: p.id, mod: p.mod, jet: parseInt(jets[p.id], 10) })
    }
    for (const a of adversaires) {
      const mod = parseInt(a.mod || '0', 10)
      if (a.nom.trim() && jetValide(a.jet) && Number.isInteger(mod)) {
        liste.push({ nom: a.nom.trim(), personnageId: null, mod, jet: parseInt(a.jet, 10) })
      }
    }
    return liste
  }

  function lancer() {
    const entrants = entrantsPrepares()
    if (entrants.length === 0) return
    setPrepOuverte(false)
    rafraichir(() => demarrerCombat(entrants))
  }

  function envoyerRenfort() {
    let entrant: EntrantCombat | null = null
    if (renfortPersoId && persos) {
      const p = persos.find(x => x.id === renfortPersoId)
      if (p && jetValide(renfort.jet)) entrant = { nom: p.nom, personnageId: p.id, mod: p.mod, jet: parseInt(renfort.jet, 10) }
    } else if (renfort.nom.trim() && jetValide(renfort.jet)) {
      const mod = parseInt(renfort.mod || '0', 10)
      if (Number.isInteger(mod)) entrant = { nom: renfort.nom.trim(), personnageId: null, mod, jet: parseInt(renfort.jet, 10) }
    }
    if (!entrant) return
    const e = entrant
    setRenfortOuvert(false)
    rafraichir(() => ajouterCombattant(e))
  }

  // ─────────────────────────────── Combat en cours ───────────────────────────────
  if (combat) {
    const dansCombat = new Set(combat.combattants.filter(c => c.personnageId != null).map(c => c.personnageId))
    const persosRestants = (persos ?? []).filter(p => !dansCombat.has(p.id))
    return (
      <div className="mb-3 bg-stone-900/80 border border-red-900/50 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-red-400 text-sm font-semibold">⚔ Combat — round {combat.round}</span>
          {combat.combattants[combat.tourIndex] && (
            <span className="text-amber-300 text-sm">▶ au tour de <strong>{combat.combattants[combat.tourIndex].nom}</strong></span>
          )}
          <span className="ml-auto" />
          <button
            onClick={() => rafraichir(terminerCombat)}
            disabled={isPending}
            className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded px-2 py-1 transition-colors"
            title="Termine le combat — le bilan (dégâts, sorts, rounds) s'inscrit dans la chronique"
          >🕊 Fin du combat</button>
        </div>

        <div className="space-y-1 mb-2">
          {combat.combattants.map((c, i) => {
            const courant = i === combat.tourIndex
            const precedent = combat.combattants[i - 1]
            const egaliteParfaite = precedent && precedent.total === c.total && precedent.mod === c.mod
            return (
              <div
                key={c.cle}
                className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                  courant ? 'bg-amber-950/60 border border-amber-700/60' : 'bg-stone-950/50'
                }`}
              >
                <span className={`w-5 shrink-0 text-center ${courant ? 'text-amber-300' : 'text-stone-700'}`}>
                  {courant ? '▶' : i + 1}
                </span>
                <span className={`font-mono font-bold w-8 text-right shrink-0 ${courant ? 'text-amber-200' : 'text-stone-300'}`}>{c.total}</span>
                <span className={`truncate ${c.personnageId != null ? 'text-stone-200' : 'text-red-300/90'}`}>{c.nom}</span>
                <span className="text-stone-600 text-xs shrink-0">({c.jet} {signe(c.mod)})</span>
                {!c.agi && (
                  <span
                    className="text-[10px] text-sky-400/90 border border-sky-900/60 rounded px-1 shrink-0 uppercase tracking-wide"
                    title="N'a pas encore agi : pris au dépourvu — pas de bonus de DEX à la CA (et fenêtre d'attaque sournoise)"
                  >dépourvu</span>
                )}
                {egaliteParfaite && (
                  <span className="text-amber-500 text-xs shrink-0" title="Égalité parfaite (même total, même modificateur) — départagez d'un jet et ajustez avec ↑↓">⚠</span>
                )}
                <span className="ml-auto" />
                <button
                  onClick={() => rafraichir(() => deplacerCombattant(c.cle, -1))}
                  disabled={isPending || i === 0}
                  className="text-stone-600 hover:text-stone-300 disabled:opacity-30 text-xs px-1 transition-colors"
                  title="Monter d'un rang"
                >↑</button>
                <button
                  onClick={() => rafraichir(() => deplacerCombattant(c.cle, 1))}
                  disabled={isPending || i === combat.combattants.length - 1}
                  className="text-stone-600 hover:text-stone-300 disabled:opacity-30 text-xs px-1 transition-colors"
                  title="Descendre d'un rang — sur le combattant courant, c'est « retarder » : le tour passe au suivant"
                >↓</button>
                <button
                  onClick={() => rafraichir(() => retirerCombattant(c.cle))}
                  disabled={isPending}
                  className="text-stone-600 hover:text-red-400 text-xs px-1 transition-colors"
                  title="Retirer du combat (hors d'état de combattre, enfui…)"
                >✕</button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => rafraichir(tourSuivant)}
            disabled={isPending || combat.combattants.length === 0}
            className="text-sm bg-amber-900/40 hover:bg-amber-800/60 disabled:opacity-40 border border-amber-800/50 text-amber-300 rounded px-3 py-1.5 min-h-[36px] transition-colors"
          >▶ Tour suivant</button>
          <button
            onClick={chargerPersosPourRenfort}
            disabled={isPending}
            className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded px-2 py-1.5 transition-colors"
            title="Un renfort arrive : il s'insère au rang de son initiative"
          >+ Ajouter</button>
        </div>

        {renfortOuvert && (
          <div className="mt-2 flex flex-wrap items-center gap-2 bg-stone-950/60 rounded p-2">
            <select
              value={renfortPersoId}
              onChange={e => setRenfortPersoId(parseInt(e.target.value, 10))}
              className="bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-stone-300 text-base sm:text-sm focus:outline-none focus:border-amber-600 max-w-full"
            >
              <option value={0}>Adversaire du MJ…</option>
              {persosRestants.map(p => (
                <option key={p.id} value={p.id}>{p.nom} ({signe(p.mod)})</option>
              ))}
            </select>
            {renfortPersoId === 0 && (
              <>
                <input
                  value={renfort.nom}
                  onChange={e => setRenfort(r => ({ ...r, nom: e.target.value }))}
                  placeholder="Nom (ex. Ogre)"
                  className="w-36 bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-stone-200 text-base sm:text-sm placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
                />
                <input
                  value={renfort.mod}
                  onChange={e => setRenfort(r => ({ ...r, mod: e.target.value }))}
                  placeholder="mod"
                  inputMode="numeric"
                  className="w-16 bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-stone-200 text-base sm:text-sm text-center placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
                  title="Modificateur d'initiative de l'adversaire"
                />
              </>
            )}
            <input
              value={renfort.jet}
              onChange={e => setRenfort(r => ({ ...r, jet: e.target.value }))}
              placeholder="d20"
              inputMode="numeric"
              className="w-16 bg-stone-950 border border-amber-900/60 rounded px-2 py-1.5 text-amber-200 text-base sm:text-sm text-center font-mono placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
              title="Jet de d20 brut"
            />
            <button
              onClick={envoyerRenfort}
              disabled={isPending || !jetValide(renfort.jet) || (renfortPersoId === 0 && !renfort.nom.trim())}
              className="text-sm bg-amber-900/40 hover:bg-amber-800/60 disabled:opacity-40 border border-amber-800/50 text-amber-300 rounded px-3 py-1.5 transition-colors"
            >Insérer</button>
            <button
              onClick={() => setRenfortOuvert(false)}
              className="text-stone-500 hover:text-stone-300 text-sm px-2 transition-colors"
            >✕</button>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────── Préparation ───────────────────────────────
  if (!prepOuverte) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-stone-600 text-xs uppercase tracking-wide">Combat :</span>
        <button
          onClick={ouvrirPreparation}
          className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 rounded px-2 py-1 transition-colors"
          title="Chacun lance son vrai d20 : entrez les résultats, l'app tient l'ordre du tour"
        >⚔ Lancer un combat</button>
      </div>
    )
  }

  const visibles = (persos ?? []).filter(p => montrerTous || p.actif || jetValide(jets[p.id] ?? ''))
  const nbPrets = entrantsPrepares().length

  return (
    <div className="mb-3 bg-stone-900/80 border border-red-900/50 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-red-400 text-sm font-semibold">⚔ Ordre d&apos;initiative</span>
        <button
          onClick={() => setPrepOuverte(false)}
          className="text-stone-500 hover:text-stone-300 text-sm px-2 min-h-[32px] transition-colors"
          title="Fermer sans lancer le combat"
        >✕</button>
      </div>
      <p className="text-stone-600 text-xs mb-3">
        Chacun lance son vrai d20 — entrez les résultats bruts, le modificateur de la fiche s&apos;ajoute tout seul.
        Un personnage sans jet ne participe pas.
      </p>

      {!persos ? (
        <div className="text-stone-500 text-sm py-2">Chargement du groupe…</div>
      ) : (
        <>
          <div className="space-y-1.5 mb-2">
            {visibles.map(p => (
              <div key={p.id} className={`flex items-center gap-2 rounded px-2 py-1.5 ${jetValide(jets[p.id] ?? '') ? 'bg-stone-950/70' : 'bg-stone-950/30'}`}>
                <span className="text-stone-200 text-sm truncate flex-1">{p.nom}</span>
                <span className="text-stone-500 text-xs font-mono shrink-0" title={p.detail}>{signe(p.mod)}</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  inputMode="numeric"
                  value={jets[p.id] ?? ''}
                  onChange={e => setJets(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder="d20"
                  className="w-16 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-amber-200 text-base sm:text-sm text-center font-mono placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
                />
                <span className="text-stone-600 text-xs font-mono w-9 text-right shrink-0">
                  {jetValide(jets[p.id] ?? '') ? `= ${parseInt(jets[p.id], 10) + p.mod}` : ''}
                </span>
              </div>
            ))}
          </div>
          {!montrerTous && persos.some(p => !p.actif) && (
            <button
              onClick={() => setMontrerTous(true)}
              className="text-stone-500 hover:text-stone-300 text-xs mb-3 transition-colors"
            >+ Montrer tous les personnages…</button>
          )}

          <div className="space-y-1.5 mb-2">
            {adversaires.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded px-2 py-1.5 bg-red-950/30">
                <input
                  value={a.nom}
                  onChange={e => setAdversaires(prev => prev.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))}
                  placeholder="Nom (ex. Squelettes ×4)"
                  className="flex-1 min-w-0 bg-stone-950 border border-stone-700 rounded px-2 py-1 text-red-200 text-base sm:text-sm placeholder:text-stone-600 focus:outline-none focus:border-red-800"
                />
                <input
                  value={a.mod}
                  onChange={e => setAdversaires(prev => prev.map((x, j) => (j === i ? { ...x, mod: e.target.value } : x)))}
                  placeholder="mod"
                  inputMode="numeric"
                  className="w-16 bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-200 text-base sm:text-sm text-center placeholder:text-stone-600 focus:outline-none focus:border-red-800"
                  title="Modificateur d'initiative (vide = +0)"
                />
                <input
                  value={a.jet}
                  onChange={e => setAdversaires(prev => prev.map((x, j) => (j === i ? { ...x, jet: e.target.value } : x)))}
                  placeholder="d20"
                  inputMode="numeric"
                  className="w-16 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-amber-200 text-base sm:text-sm text-center font-mono placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
                />
                <button
                  onClick={() => setAdversaires(prev => prev.filter((_, j) => j !== i))}
                  className="text-stone-600 hover:text-red-400 text-xs px-1 transition-colors"
                  title="Retirer cette ligne"
                >✕</button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setAdversaires(prev => [...prev, { nom: '', mod: '', jet: '' }])}
            className="text-red-400/80 hover:text-red-300 text-xs mb-3 transition-colors"
          >+ Ajouter un adversaire (monstre, PNJ)…</button>

          <div className="flex items-center gap-2">
            <button
              onClick={lancer}
              disabled={isPending || nbPrets === 0}
              className="text-sm bg-red-900/40 hover:bg-red-800/60 disabled:opacity-40 border border-red-800/50 text-red-300 rounded px-3 py-1.5 min-h-[36px] transition-colors"
            >⚔ Lancer le combat{nbPrets > 0 ? ` (${nbPrets})` : ''}</button>
            <span className="text-stone-600 text-xs">L&apos;ordre s&apos;affiche trié; début et rounds s&apos;inscrivent dans la chronique.</span>
          </div>
        </>
      )}
    </div>
  )
}

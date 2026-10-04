'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { monterNiveau } from '@/app/actions/character'

// Bandeau de montée de niveau : apparaît quand l'XP a franchi le seuil du niveau
// suivant. Le joueur choisit sa classe (avec le MJ) et lance son vrai dé de vie à
// la table — on entre le résultat, l'app ne lance rien. BAB, sauvegardes et sorts
// suivent automatiquement; compétences, dons et caractéristiques via ✏️ Modifier.
export function MonterNiveau({ personnageId, niveauCible, niveauXp, conMod, classes }: {
  personnageId: number
  niveauCible: number       // niveauTotal + 1 — une montée à la fois
  niveauXp: number          // niveau que l'XP justifie (peut dépasser niveauCible)
  conMod: number
  classes: { id: number; nom: string; niveau: number; de: number }[]
}) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [classeId, setClasseId] = useState(classes[0]?.id ?? 0)
  const [pvStr, setPvStr] = useState('')
  const [isPending, startTransition] = useTransition()

  const choisie = classes.find(c => c.id === classeId) ?? classes[0]
  const pv = parseInt(pvStr, 10)
  const pvValide = Number.isInteger(pv) && pv >= 1 && pv <= 100

  // Rappels 3.5 selon le niveau atteint (Manuel des Joueurs, table 3-2)
  const rappels: string[] = ['points de compétence']
  if (niveauCible % 3 === 0) rappels.push('nouveau don')
  if (niveauCible % 4 === 0) rappels.push('+1 à une caractéristique')

  function confirmer() {
    if (!pvValide || !choisie) return
    startTransition(async () => {
      await monterNiveau(personnageId, choisie.id, pv)
      setOuvert(false)
      setPvStr('')
      router.refresh()
    })
  }

  if (classes.length === 0) return null

  if (!ouvert) {
    return (
      <div className="mt-2 text-right">
        <button
          onClick={() => setOuvert(true)}
          className="text-xs bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/60 text-amber-300 hover:text-amber-200 rounded px-2.5 py-1 min-h-[28px] transition-colors animate-pulse hover:animate-none"
          title={`L'expérience atteint le seuil du niveau ${niveauCible} — monter de niveau`}
        >🎉 Niveau {niveauCible} atteint — 🆙 Monter de niveau</button>
        {niveauXp > niveauCible && (
          <div className="text-stone-600 text-[11px] mt-0.5">
            (l&apos;XP justifie même le niveau {niveauXp} — une montée à la fois)
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 w-56 ml-auto bg-stone-900 border border-amber-800/50 rounded-lg p-2.5 text-left space-y-2">
      <div className="text-amber-300 text-xs font-bold">🆙 Montée au niveau {niveauCible}</div>
      {classes.length > 1 ? (
        <select
          value={classeId}
          onChange={e => setClasseId(parseInt(e.target.value, 10))}
          className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-200 text-xs focus:outline-none focus:border-amber-600"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.nom} {c.niveau} → {c.niveau + 1}</option>
          ))}
        </select>
      ) : (
        <div className="text-stone-300 text-xs">{choisie.nom} {choisie.niveau} → <span className="text-amber-300 font-bold">{choisie.niveau + 1}</span></div>
      )}
      <div>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={pvStr}
          onChange={e => setPvStr(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') confirmer() }}
          placeholder={`jet de d${choisie.de}${conMod !== 0 ? ` ${conMod > 0 ? '+' : '−'} ${Math.abs(conMod)}` : ''}`}
          autoFocus
          className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-red-300 text-base sm:text-sm font-mono placeholder:text-stone-600 focus:outline-none focus:border-red-700"
        />
        <div className="text-stone-500 text-[11px] mt-0.5">
          ❤️ PV gagnés : lance ton d{choisie.de}, ajoute ta CON ({conMod >= 0 ? '+' : ''}{conMod}) — minimum 1
        </div>
      </div>
      <div className="text-stone-600 text-[11px]">
        Pense aussi : {rappels.join(', ')} — via ✏️ Modifier
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => { setOuvert(false); setPvStr('') }}
          className="text-stone-500 hover:text-stone-300 text-sm px-1.5 min-h-[28px] transition-colors"
          title="Fermer sans monter"
        >✕</button>
        <button
          onClick={confirmer}
          disabled={isPending || !pvValide}
          className="text-xs bg-amber-900/40 hover:bg-amber-800/60 disabled:opacity-40 border border-amber-800/50 text-amber-300 rounded px-2.5 py-1 min-h-[28px] transition-colors"
        >{isPending ? 'Montée…' : '🆙 Monter'}</button>
      </div>
    </div>
  )
}

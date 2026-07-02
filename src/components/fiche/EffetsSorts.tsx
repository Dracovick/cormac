'use client'

import { useTransition } from 'react'
import { retirerEffetSort } from '@/app/actions/character'
import { SORTS_EFFETS_VISUELS, SORTS_EFFETS_SUIVI, type ContributionEffet } from '@/lib/dnd35/spell-effects'

type Props = {
  personnageId: number
  contributions: ContributionEffet[]
}

// Apparence des étiquettes selon l'effet visuel du sort
const STYLE_VISUEL: Record<string, { symbole: string; classes: string }> = {
  halo:      { symbole: '☀', classes: 'bg-yellow-900/30 border-yellow-600/70 text-yellow-200 shadow-[0_0_8px_rgba(253,224,71,0.35)]' },
  feu:       { symbole: '🔥', classes: 'bg-orange-950/40 border-orange-600/70 text-orange-200 shadow-[0_0_8px_rgba(249,115,22,0.4)]' },
  pierre:    { symbole: '🗿', classes: 'bg-stone-700/50 border-stone-400/60 text-stone-200' },
  invisible: { symbole: '👻', classes: 'bg-stone-800/40 border-dashed border-stone-500 text-stone-400' },
}

function titreEffet(c: ContributionEffet): string {
  if (c.cible === 'VISUEL') {
    const cat = SORTS_EFFETS_VISUELS.find(s => s.nom === c.nom)
    return cat ? `${cat.note ?? ''} Durée : ${cat.duree}.` : 'Effet visuel actif.'
  }
  if (c.cible === 'SUIVI') {
    const cat = SORTS_EFFETS_SUIVI.find(s => s.nom === c.nom)
    return cat ? `${cat.note} Durée : ${cat.duree}.` : 'Sort actif (suivi).'
  }
  if (c.cible === 'DEPL') {
    return `Déplacement +${c.effective} m`
  }
  const cibleLabel = c.cible === 'CA' ? 'CA' : c.cible
  return c.effective !== 0
    ? `${cibleLabel} ${c.effective > 0 ? '+' : ''}${c.effective} (bonus de ${c.typeBonus})`
    : `Ne se cumule pas (bonus de ${c.typeBonus}) — remplacé par ${c.remplacePar ?? 'un meilleur bonus'}`
}

// Les effets s'activent en lançant le sort (bouton « préparé ▶ » de la section Sorts).
// Ici on les affiche et on permet au joueur de les retirer quand le sort prend fin.
export function EffetsSorts({ personnageId, contributions }: Props) {
  const [isPending, startTransition] = useTransition()

  if (contributions.length === 0) return null

  function retirer(effetId: number) {
    startTransition(async () => { await retirerEffetSort(effetId, personnageId) })
  }

  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 ${isPending ? 'opacity-60' : ''}`}>
      <span className="text-violet-400 text-xs uppercase tracking-wide">✨ Sorts actifs</span>

      {contributions.map(c => {
        const visuel = c.cible === 'VISUEL' ? (STYLE_VISUEL[c.typeBonus] ?? STYLE_VISUEL.halo) : null
        const estSuivi = c.cible === 'SUIVI'
        const classes = visuel
          ? visuel.classes
          : estSuivi
            ? 'bg-sky-950/40 border-sky-800/70 text-sky-200'
            : c.effective !== 0
              ? 'bg-violet-900/40 border-violet-700 text-violet-200'
              : 'bg-stone-800/60 border-stone-700 text-stone-500'
        const valeurLabel = visuel
          ? visuel.symbole
          : estSuivi
            ? '◈'
            : c.effective !== 0
              ? `${c.cible === 'CA' ? 'CA' : c.cible === 'DEPL' ? 'Dépl.' : c.cible} ${c.effective > 0 ? '+' : ''}${c.effective}${c.cible === 'DEPL' ? ' m' : ''}`
              : '⊘'
        return (
          <span
            key={c.id}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs border ${classes}`}
            title={titreEffet(c)}
          >
            {c.nom}
            <span className="font-mono font-bold">{valeurLabel}</span>
            <button
              onClick={() => retirer(c.id)}
              className="text-stone-500 hover:text-red-400 transition-colors ml-0.5"
              title="Le sort prend fin — retirer l'effet"
            >✕</button>
          </span>
        )
      })}
    </div>
  )
}

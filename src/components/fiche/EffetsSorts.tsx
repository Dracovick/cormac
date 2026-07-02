'use client'

import { useTransition } from 'react'
import { retirerEffetSort } from '@/app/actions/character'
import type { ContributionEffet } from '@/lib/dnd35/spell-effects'

type Props = {
  personnageId: number
  contributions: ContributionEffet[]
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
        const estVisuel = c.cible === 'VISUEL'
        const cibleLabel = c.cible === 'CA' ? 'CA' : c.cible
        return (
          <span
            key={c.id}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs border ${
              estVisuel
                ? 'bg-yellow-900/30 border-yellow-600/70 text-yellow-200 shadow-[0_0_8px_rgba(253,224,71,0.35)]'
                : c.effective !== 0
                  ? 'bg-violet-900/40 border-violet-700 text-violet-200'
                  : 'bg-stone-800/60 border-stone-700 text-stone-500'
            }`}
            title={estVisuel
              ? 'Sort de lumière actif — halo lumineux autour du portrait'
              : c.effective !== 0
                ? `${cibleLabel} ${c.effective > 0 ? '+' : ''}${c.effective} (bonus de ${c.typeBonus})`
                : `Ne se cumule pas (bonus de ${c.typeBonus}) — remplacé par ${c.remplacePar ?? 'un meilleur bonus'}`}
          >
            {c.nom}
            <span className="font-mono font-bold">
              {estVisuel ? '☀' : c.effective !== 0 ? `${cibleLabel} ${c.effective > 0 ? '+' : ''}${c.effective}` : '⊘'}
            </span>
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

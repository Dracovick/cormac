'use client'

import { useTransition } from 'react'
import { depensePotion } from '@/app/actions/character'

type Props = { charPotionId: number; personnageId: number; chargesRestantes: number }

export function LivePotion({ charPotionId, personnageId, chargesRestantes }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleUse() {
    startTransition(async () => { await depensePotion(charPotionId, personnageId) })
  }

  if (chargesRestantes <= 0) {
    return (
      <div className="text-center ml-3 shrink-0">
        <div className="text-stone-600 font-bold text-lg italic">0</div>
        <div className="text-stone-700 text-xs">épuisée</div>
      </div>
    )
  }

  return (
    <div className="text-center ml-3 shrink-0">
      <button
        onClick={handleUse}
        disabled={isPending}
        className={`block w-full rounded px-2 py-0.5 border transition-all ${
          isPending
            ? 'opacity-50 cursor-wait bg-green-900/20 border-green-800/30'
            : 'bg-green-900/30 hover:bg-red-900/40 border-green-800/40 hover:border-red-700/50 cursor-pointer'
        }`}
        title="Cliquer pour boire une gorgée"
      >
        <div className={`font-bold text-lg ${isPending ? 'text-green-700' : 'text-green-300 hover:text-red-300'}`}>{chargesRestantes}</div>
      </button>
      <div className="text-stone-500 text-xs mt-0.5">gorgée{chargesRestantes > 1 ? 's' : ''}</div>
    </div>
  )
}

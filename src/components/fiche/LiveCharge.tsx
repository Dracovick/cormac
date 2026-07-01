'use client'

import { useTransition } from 'react'
import { depenseChargeObjet } from '@/app/actions/character'

type Props = { charItemId: number; personnageId: number; chargesRestantes: number; chargesMax: number }

export function LiveCharge({ charItemId, personnageId, chargesRestantes, chargesMax }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleUse() {
    startTransition(async () => { await depenseChargeObjet(charItemId, personnageId) })
  }

  const pct = chargesMax > 0 ? Math.round((chargesRestantes / chargesMax) * 100) : 0
  const barColor = pct > 50 ? '#8b5cf6' : pct > 25 ? '#f59e0b' : '#ef4444'

  if (chargesRestantes <= 0) {
    return (
      <div className="shrink-0 ml-2 text-right">
        <span className="text-xs text-stone-600 italic">épuisé (0/{chargesMax})</span>
      </div>
    )
  }

  return (
    <div className="shrink-0 ml-2 min-w-[70px]">
      <button
        onClick={handleUse}
        disabled={isPending}
        className={`text-xs rounded px-1.5 py-0.5 border w-full transition-all ${
          isPending
            ? 'opacity-50 cursor-wait bg-purple-900/20 border-purple-800/30 text-purple-600'
            : 'bg-purple-900/30 hover:bg-red-900/40 border-purple-800/40 hover:border-red-700/50 text-purple-300 hover:text-red-300 cursor-pointer'
        }`}
        title="Cliquer pour dépenser une charge"
      >
        {chargesRestantes}/{chargesMax} ch. ▶
      </button>
      <div className="mt-1 h-1 bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

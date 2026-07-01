'use client'

import { useTransition } from 'react'
import { depenseSort } from '@/app/actions/character'

type Props = { charSpellId: number; personnageId: number; estPrepare: number }

export function LiveSort({ charSpellId, personnageId, estPrepare }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleUse() {
    startTransition(async () => { await depenseSort(charSpellId, personnageId) })
  }

  if (estPrepare <= 0) {
    return <span className="text-xs text-stone-600 ml-2 shrink-0 italic">connu</span>
  }

  return (
    <button
      onClick={handleUse}
      disabled={isPending}
      className={`text-xs rounded px-1.5 py-0.5 ml-2 shrink-0 border transition-all ${
        isPending
          ? 'opacity-50 cursor-wait bg-amber-900/20 border-amber-800/30 text-amber-600'
          : 'bg-amber-900/40 hover:bg-red-900/50 border-amber-800/40 hover:border-red-700/50 text-amber-400 hover:text-red-300 cursor-pointer'
      }`}
      title="Cliquer pour dépenser cet emplacement"
    >
      préparé{estPrepare > 1 ? ` ×${estPrepare}` : ''} ▶
    </button>
  )
}

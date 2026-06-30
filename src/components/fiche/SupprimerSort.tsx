'use client'

import { useTransition } from 'react'
import { supprimerSortPersonnalise } from '@/app/actions/character'

type Props = { charSpellId: number; personnageId: number }

export function SupprimerSort({ charSpellId, personnageId }: Props) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => supprimerSortPersonnalise(charSpellId, personnageId))}
      disabled={isPending}
      title="Retirer ce sort personnalisé"
      className="text-stone-700 hover:text-red-400 disabled:opacity-50 text-xs transition-colors ml-1 leading-none"
    >
      ✕
    </button>
  )
}

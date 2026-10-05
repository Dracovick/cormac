'use client'

import { useTransition } from 'react'
import { jeterPotion } from '@/app/actions/character'

type Props = { charPotionId: number; personnageId: number; nomPotion: string; chargesRestantes: number }

export function JeterPotion({ charPotionId, personnageId, nomPotion, chargesRestantes }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleJeter() {
    const detail = chargesRestantes > 0
      ? `(il reste ${chargesRestantes} ${chargesRestantes > 1 ? 'gorgées' : 'gorgée'} — rien n'est bu, la ligne disparaît de la fiche)`
      : '(fiole vide — la ligne disparaît de la fiche)'
    if (!confirm(`Jeter « ${nomPotion} » ?\n${detail}`)) return
    startTransition(async () => { await jeterPotion(charPotionId, personnageId) })
  }

  return (
    <button
      onClick={handleJeter}
      disabled={isPending}
      className={`shrink-0 self-start -mt-0.5 rounded px-1 text-sm leading-tight transition-colors ${
        isPending
          ? 'opacity-40 cursor-wait text-stone-600'
          : 'text-stone-600 hover:text-red-400 hover:bg-red-900/30 cursor-pointer'
      }`}
      title="Jeter cette potion (la retirer de la fiche)"
      aria-label={`Jeter ${nomPotion}`}
    >
      ✕
    </button>
  )
}

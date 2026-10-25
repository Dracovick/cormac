'use client'

import { useTransition } from 'react'
import { jeterParchemin, lireParchemin } from '@/app/actions/character'

type Props = {
  charScrollId: number
  personnageId: number
  nom: string
  quantite: number
}

/**
 * Lire un parchemin — et le consumer.
 *
 * ⛔ Pas de « gorgée » ici : un parchemin se LIT, et il se consume quand le sort
 * part (SRD, Magic Items — Scrolls). C'est le mélange avec les potions qui avait
 * fait écrire « Boit « Parchemin Porte dimensionnelle » (0 gorgée restante) »
 * dans le journal d'André le 2026-10-25.
 */
export function LireParchemin({ charScrollId, personnageId, nom, quantite }: Props) {
  const [isPending, startTransition] = useTransition()

  function lire() {
    const reste = quantite - 1
    const suite = reste > 0
      ? `Il en restera ${reste}.`
      : 'Le parchemin se consume : il n’en restera aucun.'
    if (!confirm(`Lire le parchemin « ${nom} » ?\n${suite}`)) return
    startTransition(async () => { await lireParchemin(charScrollId, personnageId) })
  }

  function jeter() {
    const detail = quantite > 0
      ? `(il reste ${quantite} exemplaire${quantite > 1 ? 's' : ''} — rien n'est lancé, la ligne disparaît de la fiche)`
      : '(parchemin consumé — la ligne disparaît de la fiche)'
    if (!confirm(`Jeter « ${nom} » ?\n${detail}`)) return
    startTransition(async () => { await jeterParchemin(charScrollId, personnageId) })
  }

  return (
    <div className="flex items-start gap-1">
      <div className="text-center ml-3 shrink-0">
        {quantite <= 0 ? (
          <>
            <div className="text-stone-600 font-bold text-lg italic">0</div>
            <div className="text-stone-700 text-xs">consumé</div>
          </>
        ) : (
          <>
            <button
              onClick={lire}
              disabled={isPending}
              className={`block w-full rounded px-2 py-0.5 border transition-all ${
                isPending
                  ? 'opacity-50 cursor-wait bg-amber-900/20 border-amber-800/30'
                  : 'bg-amber-900/30 hover:bg-red-900/40 border-amber-800/40 hover:border-red-700/50 cursor-pointer'
              }`}
              title="Lire ce parchemin — le sort part et le parchemin se consume"
            >
              <div className={`font-bold text-lg ${isPending ? 'text-amber-700' : 'text-amber-300 hover:text-red-300'}`}>{quantite}</div>
            </button>
            <div className="text-stone-500 text-xs mt-0.5">exemplaire{quantite > 1 ? 's' : ''}</div>
          </>
        )}
      </div>
      <button
        onClick={jeter}
        disabled={isPending}
        className={`shrink-0 self-start -mt-0.5 rounded px-1 text-sm leading-tight transition-colors ${
          isPending ? 'opacity-40 cursor-wait text-stone-600' : 'text-stone-600 hover:text-red-400 hover:bg-red-900/30 cursor-pointer'
        }`}
        title="Jeter ce parchemin (le retirer de la fiche)"
        aria-label={`Jeter ${nom}`}
      >
        ✕
      </button>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { logAttaque } from '@/app/actions/journal'

type Props = { personnageId: number; nomArme: string }

// Bouton « ⚔ attaque » au bout de chaque arme : note l'attaque au journal de partie.
// Un clic ouvre un mini-panneau Touché/Raté + dégâts optionnels (même esprit que LiveHP).
export function LiveAttaque({ personnageId, nomArme }: Props) {
  const [open, setOpen] = useState(false)
  const [resultat, setResultat] = useState<'touche' | 'rate'>('touche')
  const [degats, setDegats] = useState('')
  const [note, setNote] = useState(false)
  const [isPending, startTransition] = useTransition()

  function confirmer() {
    const n = parseInt(degats, 10)
    const res = resultat
    const dmg = res === 'touche' && n > 0 ? n : null
    setOpen(false)
    setDegats('')
    setResultat('touche')
    startTransition(async () => {
      await logAttaque(personnageId, nomArme, res, dmg)
      setNote(true)
      setTimeout(() => setNote(false), 1500)
    })
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') confirmer()
    if (e.key === 'Escape') { setOpen(false); setDegats('') }
  }

  if (note) {
    return <span className="text-xs text-green-500 ml-2 shrink-0">✓ noté</span>
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className={`text-xs rounded px-1.5 py-0.5 ml-2 shrink-0 border transition-all ${
          isPending
            ? 'opacity-50 cursor-wait bg-amber-900/20 border-amber-800/30 text-amber-600'
            : 'bg-amber-900/40 hover:bg-red-900/50 border-amber-800/40 hover:border-red-700/50 text-amber-400 hover:text-red-300 cursor-pointer'
        }`}
        title="Noter cette attaque au journal de partie"
      >
        ⚔ attaque
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 ml-2 shrink-0 bg-stone-800 border border-stone-600 rounded px-1.5 py-0.5">
      <button
        onClick={() => setResultat('touche')}
        className={`text-xs rounded px-1 transition-colors ${
          resultat === 'touche' ? 'bg-green-900/60 text-green-400' : 'text-stone-500 hover:text-stone-300'
        }`}
        title="L'attaque touche"
      >✓ touché</button>
      <button
        onClick={() => setResultat('rate')}
        className={`text-xs rounded px-1 transition-colors ${
          resultat === 'rate' ? 'bg-red-900/60 text-red-400' : 'text-stone-500 hover:text-stone-300'
        }`}
        title="L'attaque rate"
      >✗ raté</button>
      {resultat === 'touche' && (
        <input
          type="number"
          min={1}
          value={degats}
          onChange={e => setDegats(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
          className="w-12 bg-stone-700 border border-stone-600 rounded px-1 text-stone-100 text-xs text-center focus:outline-none focus:border-amber-500"
          placeholder="dég."
          title="Dégâts infligés (optionnel)"
        />
      )}
      <button
        onClick={confirmer}
        className="text-xs bg-amber-700 hover:bg-amber-600 text-white rounded px-1.5 transition-colors"
      >OK</button>
      <button
        onClick={() => { setOpen(false); setDegats('') }}
        className="text-xs text-stone-500 hover:text-stone-300 px-0.5 transition-colors"
      >✕</button>
    </span>
  )
}

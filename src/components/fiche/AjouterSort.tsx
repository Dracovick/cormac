'use client'

import { useState, useTransition } from 'react'
import { ajouterSortPersonnalise } from '@/app/actions/character'

const ECOLES = [
  'Abjuration', 'Divination', 'Enchantement', 'Évocation',
  'Illusion', 'Invocation', 'Nécromancie', 'Transmutation', 'Universel',
]

type Props = { personnageId: number; maxNiveau?: number; classe?: string }

export function AjouterSort({ personnageId, maxNiveau = 9, classe }: Props) {
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [ecole, setEcole] = useState('')
  const [niveau, setNiveau] = useState(1)
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!nom.trim()) return
    startTransition(async () => {
      await ajouterSortPersonnalise(personnageId, { nom: nom.trim(), ecole, niveau, description: description.trim() || undefined, classe })
      setNom(''); setEcole(''); setNiveau(1); setDescription('')
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-amber-400 transition-colors mt-3"
      >
        <span className="text-base leading-none">+</span> Ajouter un sort personnalisé
      </button>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-2 p-3 bg-stone-800/60 rounded-lg border border-stone-700/60">
      <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom du sort"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        className="flex-1 min-w-36 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600"
      />
      <select
        value={ecole}
        onChange={e => setEcole(e.target.value)}
        className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-300 focus:outline-none focus:border-amber-600"
      >
        <option value="">École</option>
        {ECOLES.map(e => <option key={e} value={e}>{e}</option>)}
      </select>
      <select
        value={niveau}
        onChange={e => setNiveau(Number(e.target.value))}
        className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-300 focus:outline-none focus:border-amber-600"
      >
        {Array.from({ length: maxNiveau + 1 }, (_, i) => (
          <option key={i} value={i}>{i === 0 ? 'Oraison (0)' : `Niveau ${i}`}</option>
        ))}
      </select>
      </div>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optionnel) — effets, portée, durée, composantes…"
        rows={2}
        className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600 resize-none"
      />
      <div className="flex gap-2 w-full">
        <button
          onClick={submit}
          disabled={isPending || !nom.trim()}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
        >
          {isPending ? '...' : 'Ajouter'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-stone-600 hover:text-stone-400 text-xs transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { modifierDescriptionSort } from '@/app/actions/character'

type Props = { sortId: number; description: string | null; personnageId: number }

export function DescriptionSort({ sortId, description, personnageId }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(description ?? '')
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      await modifierDescriptionSort(sortId, value, personnageId)
      setEditing(false)
    })
  }

  function cancel() {
    setValue(description ?? '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="mt-0.5 ml-0.5">
        {description ? (
          <button
            onClick={() => setEditing(true)}
            className="text-left text-xs text-stone-500 hover:text-stone-300 transition-colors block w-full leading-snug"
          >
            {description}
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-stone-700 hover:text-amber-600 transition-colors italic"
          >
            + Ajouter une description…
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-1 space-y-1.5">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        autoFocus
        rows={3}
        placeholder="Description du sort — effets, portée, durée, composantes…"
        onKeyDown={e => {
          if (e.key === 'Escape') cancel()
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
        }}
        className="w-full bg-stone-900 border border-stone-700 focus:border-amber-600 rounded px-2 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="text-xs bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-1 rounded transition-colors"
        >
          {isPending ? '...' : 'Enregistrer'}
        </button>
        <button onClick={cancel} className="text-xs text-stone-600 hover:text-stone-400 transition-colors">
          Annuler
        </button>
        <span className="text-stone-700 text-xs ml-auto">Ctrl+Entrée pour sauvegarder</span>
      </div>
    </div>
  )
}

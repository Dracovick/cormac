'use client'

import { useState, useTransition } from 'react'
import { updateNotes } from '@/app/actions/character'

type Props = { personnageId: number; notes: string }

export function LiveNotes({ personnageId, notes }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(notes)
  const [saved, setSaved] = useState(notes)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaved(value)
    setEditing(false)
    startTransition(async () => { await updateNotes(personnageId, value) })
  }

  function handleCancel() {
    setValue(saved)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          rows={6}
          className="w-full bg-stone-800 border border-amber-700/50 focus:border-amber-500 rounded-lg px-3 py-2 text-stone-200 text-sm leading-relaxed resize-y focus:outline-none"
          placeholder="Notes de partie, informations importantes, contacts..."
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            {isPending ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
          <button
            onClick={handleCancel}
            className="text-stone-500 hover:text-stone-300 text-xs px-3 py-1.5 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="group cursor-text min-h-[60px] rounded-lg px-3 py-2 border border-transparent hover:border-stone-700 hover:bg-stone-800/40 transition-all relative"
      title="Cliquer pour modifier les notes"
    >
      {saved ? (
        <p className="text-stone-400 text-sm italic leading-relaxed whitespace-pre-wrap">{saved}</p>
      ) : (
        <p className="text-stone-700 text-sm italic">Cliquer pour ajouter des notes de partie...</p>
      )}
      <span className="absolute top-2 right-2 text-stone-700 group-hover:text-stone-500 text-xs transition-colors">✎</span>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { deleteCharacter } from '@/app/actions/character'

export function DeleteButton({ personnageId, nom }: { personnageId: number; nom: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteCharacter(personnageId)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 hover:border-red-700 text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded-lg transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        Supprimer
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => !isPending && setOpen(false)}>
          <div className="bg-stone-900 border border-red-800/50 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-4">⚔️</div>
            <h3 className="text-white text-xl font-bold mb-2">Supprimer {nom} ?</h3>
            <p className="text-stone-400 text-sm mb-6">
              Cette action est <span className="text-red-400 font-semibold">irréversible</span>. Toutes les données du personnage seront effacées définitivement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-white py-2.5 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

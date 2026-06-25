'use client'

import { useState, useTransition } from 'react'
import { updatePhotoUrl } from '@/app/actions/character'

type Props = {
  personnageId: number
  photoUrl: string | null
  nom: string
}

export function PhotoPortrait({ personnageId, photoUrl, nom }: Props) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(photoUrl ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updatePhotoUrl(personnageId, url)
      setEditing(false)
    })
  }

  function handleCancel() {
    setUrl(photoUrl ?? '')
    setEditing(false)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Portrait */}
      <div className="relative w-32 h-32 rounded-xl border-2 border-amber-700/60 overflow-hidden bg-stone-800 shrink-0 flex items-center justify-center group">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Portrait de ${nom}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-stone-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            <span className="text-xs mt-1 text-stone-500">Portrait</span>
          </div>
        )}

        {/* Bouton crayon au survol */}
        <button
          onClick={() => setEditing(true)}
          title="Modifier le portrait"
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {/* Bouton plein écran */}
      {photoUrl && (
        <a
          href={photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir l'image en pleine page"
          className="flex items-center gap-1 text-stone-500 hover:text-amber-400 text-xs transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Plein écran
        </a>
      )}

      {/* Modal de saisie URL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-stone-900 border border-amber-700/50 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-amber-300 font-bold text-lg mb-4">Portrait de {nom}</h3>

            {/* Prévisualisation */}
            {url && (
              <div className="mb-4 flex justify-center">
                <img
                  src={url}
                  alt="Prévisualisation"
                  className="w-32 h-32 rounded-xl object-cover border-2 border-amber-700/60"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}

            <label className="block text-stone-400 text-sm mb-2">URL de l'image</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://exemple.com/image.jpg"
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 mb-4"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Annuler
              </button>
              {url && (
                <button
                  onClick={() => { setUrl(''); startTransition(async () => { await updatePhotoUrl(personnageId, ''); setEditing(false) }) }}
                  disabled={isPending}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Supprimer
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isPending || !url.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isPending ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

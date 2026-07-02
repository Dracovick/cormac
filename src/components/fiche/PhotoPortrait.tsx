'use client'

import { useRef, useState, useTransition } from 'react'
import { updatePhotoUrl } from '@/app/actions/character'

type Props = {
  personnageId: number
  photoUrl: string | null
  nom: string
  visuels?: string[] // effets visuels actifs : 'halo', 'pierre', 'feu', 'invisible'
}

export function PhotoPortrait({ personnageId, photoUrl, nom, visuels = [] }: Props) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(photoUrl ?? '')
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    startTransition(async () => {
      await updatePhotoUrl(personnageId, url)
      setEditing(false)
    })
  }

  function handleCancel() {
    setUrl(photoUrl ?? '')
    setUploadError(null)
    setEditing(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-portrait', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur d\'upload')
      setUrl(data.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      // Reset input pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Portrait — effets visuels des sorts actifs (halo, pierre, feu, invisible) */}
      {(() => {
        const halo = visuels.includes('halo')
        const pierre = visuels.includes('pierre')
        const feu = visuels.includes('feu')
        const invisible = visuels.includes('invisible')
        const lueurs = [
          feu && '0 0 30px 12px rgba(249,115,22,0.6)',
          halo && '0 0 28px 10px rgba(253,224,71,0.55)',
          pierre && '0 0 16px 5px rgba(148,163,184,0.45)',
        ].filter(Boolean).join(', ')
        const bordure = feu ? 'border-orange-400/80'
          : halo ? 'border-yellow-300/80'
          : pierre ? 'border-stone-400/90'
          : invisible ? 'border-dashed border-stone-500/70'
          : 'border-amber-700/60'
        return (
      <div
        className={`relative w-32 h-48 rounded-xl border-2 ${bordure} overflow-hidden bg-stone-800 shrink-0 flex items-center justify-center group transition-shadow duration-700`}
        style={lueurs ? { boxShadow: lueurs } : undefined}
      >
        {halo && <div className="pointer-events-none absolute inset-0 bg-yellow-200/10 animate-pulse z-10" />}
        {feu && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orange-500/35 via-red-500/10 to-transparent animate-pulse z-10" />}
        {pierre && <div className="pointer-events-none absolute inset-0 bg-stone-400/20 z-10" />}
        {url || photoUrl ? (
          <img
            src={url || photoUrl!}
            alt={`Portrait de ${nom}`}
            className={`w-full h-full object-cover object-top transition-all duration-700 ${pierre ? 'grayscale contrast-125' : ''} ${invisible ? 'opacity-25' : ''}`}
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
        )
      })()}

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

      {/* Modal */}
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
                  className="w-32 h-48 rounded-xl object-cover object-top border-2 border-amber-700/60"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}

            {/* Upload depuis l'appareil */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isPending}
              className="w-full flex items-center justify-center gap-2 bg-amber-700/30 hover:bg-amber-700/50 border border-amber-600/50 hover:border-amber-500 text-amber-300 text-sm font-medium rounded-lg px-4 py-2.5 mb-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Téléversement en cours...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Choisir une image (max 5 Mo)
                </>
              )}
            </button>

            {uploadError && (
              <p className="text-red-400 text-xs mb-3 text-center">{uploadError}</p>
            )}

            {/* Séparateur */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-stone-700"/>
              <span className="text-stone-500 text-xs">ou coller une URL</span>
              <div className="flex-1 h-px bg-stone-700"/>
            </div>

            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://exemple.com/image.jpg"
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 mb-4"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={isPending || uploading}
                className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Annuler
              </button>
              {url && (
                <button
                  onClick={() => { setUrl(''); startTransition(async () => { await updatePhotoUrl(personnageId, ''); setEditing(false) }) }}
                  disabled={isPending || uploading}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Supprimer
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isPending || uploading || !url.trim()}
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

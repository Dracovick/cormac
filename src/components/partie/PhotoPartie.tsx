'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ajouterPhotoMJ } from '@/app/actions/journal'

// 📷 Photo de la table : le MJ photographie la map en fin de partie depuis son
// téléphone ou sa tablette, ajoute une légende s'il veut, et la position du groupe
// est gardée dans le journal. L'image est recompressée côté client (JPEG ≤ 2000 px)
// avant l'envoi — une photo d'iPhone passe de plusieurs Mo à quelques centaines de Ko,
// et le HEIC ressort en JPEG affichable partout.
const COTE_MAX = 2000
const QUALITE_JPEG = 0.85

async function compresserImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Image illisible'))
      i.src = url
    })
    const ratio = Math.min(1, COTE_MAX / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * ratio)
    canvas.height = Math.round(img.naturalHeight * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponible')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Compression échouée'))), 'image/jpeg', QUALITE_JPEG)
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function PhotoPartie() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [apercu, setApercu] = useState<{ blob: Blob; url: string } | null>(null)
  const [legende, setLegende] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function choisir(file: File | undefined) {
    if (!file) return
    setErreur(null)
    try {
      const blob = await compresserImage(file)
      setApercu(prev => {
        if (prev) URL.revokeObjectURL(prev.url)
        return { blob, url: URL.createObjectURL(blob) }
      })
    } catch {
      setErreur('Impossible de lire cette image.')
    }
  }

  function annuler() {
    if (apercu) URL.revokeObjectURL(apercu.url)
    setApercu(null)
    setLegende('')
    setErreur(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function publier() {
    if (!apercu) return
    setErreur(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', apercu.blob, 'map.jpg')
        const res = await fetch('/api/upload-photo-partie', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok || !data.url) throw new Error(data.error ?? 'Téléversement échoué')
        await ajouterPhotoMJ(data.url, legende)
        annuler()
        router.refresh()
      } catch (e) {
        setErreur(e instanceof Error ? e.message : 'Téléversement échoué — réessayez.')
      }
    })
  }

  return (
    <div>
      {/* Sans attribut capture : iOS propose « Photothèque / Prendre une photo » — les
          deux cas servent, la photo de la map est souvent déjà dans la pellicule. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => choisir(e.target.files?.[0])}
      />
      {!apercu && (
        <button
          onClick={() => inputRef.current?.click()}
          className="text-sm bg-sky-900/40 hover:bg-sky-800/60 border border-sky-800/50 text-sky-300 rounded px-3 py-1.5 transition-colors shrink-0"
          title="Photographier la map de jeu — la position du groupe reste dans le journal"
        >
          📷 Photo
        </button>
      )}
      {apercu && (
        <div className="mt-2 bg-stone-900/80 border border-sky-900/60 rounded-lg p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={apercu.url} alt="Aperçu de la photo" className="max-h-64 rounded mx-auto" />
          <input
            type="text"
            value={legende}
            onChange={e => setLegende(e.target.value)}
            maxLength={500}
            placeholder="Légende (optionnelle) — ex. « Fin de la 2e soirée, entrée de la crypte »"
            className="mt-2 w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-stone-200 text-base sm:text-sm placeholder:text-stone-600 focus:outline-none focus:border-sky-600"
          />
          <div className="mt-2 flex items-center gap-2 justify-end">
            {erreur && <span className="text-red-400 text-xs mr-auto">{erreur}</span>}
            <button
              onClick={annuler}
              disabled={isPending}
              className="text-sm text-stone-400 hover:text-stone-200 px-3 py-1.5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={publier}
              disabled={isPending}
              className="text-sm bg-sky-900/40 hover:bg-sky-800/60 disabled:opacity-40 border border-sky-800/50 text-sky-300 rounded px-3 py-1.5 transition-colors"
            >
              {isPending ? 'Envoi…' : '📷 Au journal'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

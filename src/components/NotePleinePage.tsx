'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** Titre du bandeau — « ✏️ Note d'aventure », « 📝 Note du MJ ». */
  titre: string
  /** Sous-titre : à qui appartient la note, qui la verra. */
  sousTitre?: string
  valeur: string
  onChange: (texte: string) => void
  /** Publier. Appelé par le bouton et par Ctrl+Entrée. */
  onPublier: () => void
  /** Revenir à la vue normale — le texte est conservé par l'appelant. */
  onReduire: () => void
  publicationBloquee?: boolean
  placeholder?: string
  maxLength?: number
  /** Libellé du bouton de publication. */
  libellePublier?: string
}

/**
 * Écrire une note sur TOUT l'écran.
 *
 * Pensé pour l'Apple Pencil : André prend ses notes de partie au crayon sur un
 * iPad, et Scribble a besoin de place pour reconnaître l'écriture manuscrite.
 * Une zone de trois lignes à 14 px n'en donnait pas.
 *
 * Partagé par le journal du joueur (tiroir 📜) et la vue du MJ (/partie) depuis
 * le 2026-10-25 : trois détails non évidents valaient d'être écrits une seule
 * fois, et ils sont commentés plus bas — l'autofocus, le défilement du corps et
 * la hauteur du viewport.
 */
export function NotePleinePage({
  titre, sousTitre, valeur, onChange, onPublier, onReduire,
  publicationBloquee = false,
  placeholder,
  maxLength = 4000,
  libellePublier = '📝 Publier',
}: Props) {
  const zone = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // ⚠ Pas d'autofocus au doigt ni au crayon : il fait monter le clavier
    // virtuel, qui mange la moitié de la page qu'on vient justement d'agrandir
    // pour écrire. Au crayon on écrit directement dans le champ, sans le
    // toucher avant. À la souris, le curseur est placé pour l'utilisateur.
    if (window.matchMedia('(pointer: fine)').matches) zone.current?.focus()

    // Le corps de page ne doit pas défiler sous la pleine page : au crayon, un
    // trait qui dépasse la zone ferait glisser la page derrière.
    const defilement = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const echap = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onReduire() }
    window.addEventListener('keydown', echap)
    return () => {
      document.body.style.overflow = defilement
      window.removeEventListener('keydown', echap)
    }
    // onReduire est stable en pratique; le relier ici rouvrirait le clavier à
    // chaque frappe si l'appelant en recrée une closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // h-[100dvh] et pas h-full : sur iPad, le clavier virtuel rétrécit le
    // viewport visuel, et un `fixed inset-0` laisserait le pied des boutons
    // sous le clavier.
    <div className="fixed inset-0 z-[60] h-[100dvh] bg-stone-900 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-700 shrink-0">
        <div className="min-w-0">
          <div className="text-amber-400 font-semibold">{titre}</div>
          {sousTitre && <div className="text-stone-500 text-xs truncate">{sousTitre}</div>}
        </div>
        <button
          onClick={onReduire}
          className="text-stone-400 hover:text-amber-300 text-xs px-3 py-1.5 border border-stone-600 hover:border-amber-700 rounded-lg transition-colors shrink-0"
          title="Revenir à la vue normale (Échap) — le texte est conservé"
        >
          ⤡ Réduire
        </button>
      </div>

      {/* text-lg + leading-loose : des lignes de 2 em, assez hautes pour qu'une
          écriture manuscrite ne morde pas sur la ligne du dessous. */}
      <textarea
        ref={zone}
        value={valeur}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onPublier() } }}
        maxLength={maxLength}
        placeholder={placeholder}
        className="flex-1 min-h-0 w-full bg-stone-900 px-5 py-4 text-stone-100 text-lg leading-loose resize-none focus:outline-none placeholder:text-stone-700"
      />

      <div className="px-4 py-3 border-t border-stone-700 shrink-0 flex items-center gap-3">
        <button
          onClick={onPublier}
          disabled={publicationBloquee || !valeur.trim()}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {libellePublier}
        </button>
        <button
          onClick={onReduire}
          className="text-stone-500 hover:text-stone-300 text-xs px-3 py-2 transition-colors"
        >
          Continuer plus tard
        </button>
        <span className={`ml-auto text-xs tabular-nums ${valeur.length >= maxLength - 200 ? 'text-amber-400' : 'text-stone-600'}`}>
          {valeur.length} / {maxLength}
        </span>
      </div>
    </div>
  )
}

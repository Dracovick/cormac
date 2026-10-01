'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'

export type LigneDetail = {
  label: string
  valeur: number
  /** Précision affichée sous la ligne (ex. « plafonné par l'armure ») */
  note?: string
}

type Props = {
  /** Titre du panneau (ex. « Classe d'armure ») */
  titre: string
  /** Première ligne non signée (ex. 10 de base pour la CA) */
  base?: number
  /** Chaque contribution au total, dans l'ordre d'affichage */
  lignes: LigneDetail[]
  /** Total affiché au bas du panneau (séquence d'attaque possible : chaîne) */
  total: string | number
  /** Rendu en ligne (compétences) plutôt qu'en bloc (cases de combat) */
  inline?: boolean
  /** Déclencheur : le contenu existant de la case ou de la ligne */
  children: ReactNode
}

function signe(n: number) {
  return n >= 0 ? `+${n}` : `${n}`
}

/**
 * « Pourquoi +7? » — enveloppe un chiffre de la fiche et montre, au toucher,
 * la décomposition complète du calcul (règles D&D 3.5). Le panneau ne lance
 * rien : le joueur lance son dé, la fiche lui dit quoi additionner.
 */
export function DetailBonus({ titre, base, lignes, total, inline, children }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ouvert) return
    function fermer(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false)
    }
    function echap(e: KeyboardEvent) {
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('mousedown', fermer)
    document.addEventListener('touchstart', fermer)
    document.addEventListener('keydown', echap)
    return () => {
      document.removeEventListener('mousedown', fermer)
      document.removeEventListener('touchstart', fermer)
      document.removeEventListener('keydown', echap)
    }
  }, [ouvert])

  return (
    <div ref={ref} className={inline ? 'relative inline-block' : 'relative'}>
      <button
        type="button"
        onClick={() => setOuvert(o => !o)}
        aria-expanded={ouvert}
        title="Toucher pour voir le détail du calcul"
        className={`${inline ? '' : 'w-full h-full '}cursor-pointer rounded transition-all ${
          ouvert ? 'ring-1 ring-amber-500/60' : 'hover:ring-1 hover:ring-amber-700/40'
        }`}
      >
        {children}
      </button>

      {ouvert && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-30 w-56 bg-stone-900 border border-amber-800/50 rounded-lg shadow-xl shadow-black/50 p-3 text-left">
          <div className="text-amber-400 text-xs uppercase tracking-wide font-bold mb-2">{titre}</div>
          <div className="space-y-1">
            {base !== undefined && (
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-stone-400">base</span>
                <span className="text-stone-200 font-mono">{base}</span>
              </div>
            )}
            {lignes.map((l, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-stone-400">{l.label}</span>
                  <span className={`font-mono ${l.valeur < 0 ? 'text-red-400' : 'text-stone-200'}`}>{signe(l.valeur)}</span>
                </div>
                {l.note && <div className="text-stone-600 text-[11px] leading-snug">{l.note}</div>}
              </div>
            ))}
          </div>
          <div className="flex items-baseline justify-between border-t border-stone-700 mt-2 pt-1.5 text-xs">
            <span className="text-amber-500 font-semibold">Total</span>
            <span className="text-white font-bold font-mono">{total}</span>
          </div>
        </div>
      )}
    </div>
  )
}

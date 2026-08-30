'use client'

import { useState, type ReactNode } from 'react'

type Props = {
  /** Contenu de gauche : nom du sort, école, loupe… */
  entete: ReactNode
  /** Contenu de droite : badges et bouton « lancer » */
  actions: ReactNode
  /** Définition complète du sort. Null = pas de bouton 📖 */
  description?: string | null
  /** Composantes · portée · durée, affichées sous la définition */
  meta?: string | null
  /** Bloc supplémentaire sous la ligne (éditeur des sorts personnalisés) */
  children?: ReactNode
  /**
   * Mode contrôlé — le parent décide quelle ligne est ouverte.
   * Sert aux listes serrées (modale de préparation) où l'on veut
   * une seule définition ouverte à la fois. Absent = mode autonome.
   */
  ouvert?: boolean
  onToggle?: () => void
  /** Limite la hauteur du panneau ouvert et le rend défilable (listes serrées). */
  panneauCompact?: boolean
}

export function LigneSort({ entete, actions, description, meta, children, ouvert: ouvertProp, onToggle, panneauCompact }: Props) {
  const [ouvertLocal, setOuvertLocal] = useState(false)
  const controle = ouvertProp !== undefined
  const ouvert = controle ? ouvertProp : ouvertLocal
  const setOuvert = () => { if (controle) onToggle?.(); else setOuvertLocal(o => !o) }
  const aDefinition = Boolean(description)

  return (
    <div className="py-1.5 border-b border-stone-800/60 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0 flex-wrap gap-x-1">
          {entete}
          {aDefinition && (
            <button
              type="button"
              onClick={setOuvert}
              aria-expanded={ouvert}
              title={ouvert ? 'Masquer la définition' : 'Voir la définition'}
              className={`text-xs leading-none transition-colors ${ouvert ? 'text-amber-400' : 'text-stone-700 hover:text-amber-400'}`}
            >
              📖
            </button>
          )}
        </div>
        <span className="flex items-center shrink-0">{actions}</span>
      </div>

      {ouvert && aDefinition && (
        <div className={`mt-1.5 mb-1 border-l-2 border-stone-700 pl-2.5 space-y-1${panneauCompact ? ' max-h-28 overflow-y-auto pr-1' : ''}`}>
          <p className="text-xs text-stone-400 leading-snug whitespace-pre-line">{description}</p>
          {meta && <p className="text-xs text-stone-600">{meta}</p>}
        </div>
      )}

      {children}
    </div>
  )
}

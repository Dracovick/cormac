'use client'

import { useState } from 'react'
import { chercherFloue, existeAuCatalogue } from '@/lib/recherche-floue'

export type SuggestionNom = { nom: string; detail?: string | null; alias?: string[] }

type Props = {
  value: string
  onChange: (texte: string) => void
  /** Le joueur a choisi une entrée existante : remplir la ligne avec sa fiche. */
  onPick: (s: SuggestionNom) => void
  catalogue: SuggestionNom[]
  placeholder?: string
  className?: string
  /** « potion », « objet »… — sert à la ligne « ➕ Créer “X” comme nouvelle potion ». */
  typeLabel: string
  inputRef?: React.Ref<HTMLInputElement>
}

/**
 * Champ Nom à suggestions — la réponse aux doublons d'orthographe.
 *
 * Dès deux lettres tapées, propose les entrées du Grimoire qui correspondent
 * (accents, pluriels et coquilles tolérés), chacune avec son effet pour que le
 * joueur reconnaisse la bonne. Choisir une suggestion réutilise la fiche
 * existante; créer du neuf reste possible mais devient un geste conscient via
 * la ligne « ➕ Créer… ». Tout se passe dans le navigateur : aucun appel au
 * serveur, la liste répond à la frappe même en pleine partie.
 */
export function ChampRechercheNom({ value, onChange, onPick, catalogue, placeholder, className, typeLabel, inputRef }: Props) {
  const [ouvert, setOuvert] = useState(false)

  const actif = ouvert && value.trim().length >= 2
  const suggestions = actif ? chercherFloue(value, catalogue, s => s.nom, 8, s => s.alias ?? []) : []
  const dejaConnu = actif && existeAuCatalogue(value, catalogue, s => s.nom)
  const offreCreation = actif && !dejaConnu

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOuvert(true) }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        onKeyDown={e => { if (e.key === 'Escape' && actif) { e.stopPropagation(); setOuvert(false) } }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {actif && (suggestions.length > 0 || offreCreation) && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-stone-900 border border-stone-600 rounded shadow-xl overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.nom}
              type="button"
              // onMouseDown : le clic doit gagner contre le blur du champ.
              onMouseDown={e => { e.preventDefault(); onPick(s); setOuvert(false) }}
              className="block w-full text-left px-2.5 py-2 text-sm text-stone-200 hover:bg-stone-700/70 cursor-pointer border-b border-stone-800 last:border-b-0"
            >
              <span className="text-amber-200">{s.nom}</span>
              {s.detail && <span className="text-stone-500"> — {s.detail}</span>}
            </button>
          ))}
          {offreCreation && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setOuvert(false) }}
              className="block w-full text-left px-2.5 py-2 text-sm text-emerald-300/90 hover:bg-stone-700/70 cursor-pointer"
            >
              ➕ Créer « {value.trim()} » comme {typeLabel === 'objet' ? 'nouvel' : 'nouvelle'} {typeLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// Termes alternatifs recherchés ensemble
const SYNONYMES: Record<string, string[]> = {
  'mage':         ['magicien', 'mage'],
  'magicien':     ['magicien', 'mage'],
  'prêtre':       ['clerc', 'prêtre'],
  'pretre':       ['clerc', 'prêtre'],
  'clerc':        ['clerc', 'prêtre'],
  'voleur':       ['roublard', 'voleur'],
  'roublard':     ['roublard', 'voleur'],
  'rodeur':       ['rôdeur', 'ranger'],
  'rôdeur':       ['rôdeur', 'ranger'],
  'ranger':       ['rôdeur', 'ranger'],
  'sorcier':      ['ensorceleur', 'sorcier'],
  'ensorceleur':  ['ensorceleur', 'sorcier'],
  'combattant':   ['guerrier', 'combattant'],
  'guerrier':     ['guerrier', 'combattant'],
  'paladin':      ['paladin', 'chevalier'],
  'chevalier':    ['paladin', 'chevalier'],
  'lb':           ['loyal bon'],
  'ln':           ['loyal neutre'],
  'lm':           ['loyal mauvais'],
  'nb':           ['neutre bon'],
  'nn':           ['neutre'],
  'nm':           ['neutre mauvais'],
  'cb':           ['chaotique bon'],
  'cn':           ['chaotique neutre'],
  'cm':           ['chaotique mauvais'],
}

function expandQuery(q: string): string[] {
  return SYNONYMES[q] ?? [q]
}

type Character = {
  id: number
  nom: string
  surnom: string | null
  alignement: string | null
  race: string | null
  xp: number | null
  classes: { nom: string; niveau: number }[]
  joueurPrenom: string | null
  joueurNom: string | null
  clan: string | null
}

export function CharacterList({ characters }: { characters: Character[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return characters
    const terms = expandQuery(q)
    return characters.filter(c => {
      const fields = [
        c.nom, c.surnom, c.race, c.alignement,
        c.clan, c.joueurPrenom, c.joueurNom,
        c.xp?.toString(),
        ...c.classes.map(cl => cl.nom),
        ...c.classes.map(cl => cl.niveau.toString()),
      ]
      return fields.some(f => f && terms.some(t => f.toLowerCase().includes(t)))
    })
  }, [characters, query])

  return (
    <div className="space-y-3">

      {/* ─── Barre de recherche ─── */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nom, race, classe, alignement, clan, joueur, niveau…"
          className="w-full bg-stone-900/80 backdrop-blur border border-amber-900/40 rounded-lg py-3 pl-10 pr-10 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 transition-colors text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ─── Compteur ─── */}
      {query.trim() && (
        <p className="text-stone-600 text-xs px-1">
          {filtered.length} personnage{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          {filtered.length < characters.length ? ` sur ${characters.length}` : ''}
        </p>
      )}

      {/* ─── Liste ─── */}
      {filtered.map(c => (
        <Link
          key={c.id}
          href={`/personnage/${c.id}`}
          className="flex items-center justify-between bg-stone-900/80 backdrop-blur border border-amber-900/40 rounded-lg p-5 hover:border-amber-500/60 hover:bg-stone-800/80 transition-all group"
        >
          <div className="min-w-0 flex-1">
            <div className="text-white text-xl font-bold group-hover:text-amber-300 transition-colors">{c.nom}</div>
            {c.surnom && <div className="text-stone-500 text-sm italic">{c.surnom}</div>}
            <div className="text-stone-400 text-sm mt-1">
              {[
                c.race,
                c.classes.length > 0 ? c.classes.map(cl => `${cl.nom} ${cl.niveau}`).join(' / ') : null,
                c.alignement,
              ].filter(Boolean).join(' · ')}
            </div>
            {(c.joueurPrenom || c.joueurNom) && (
              <div className="text-stone-600 text-xs mt-0.5">
                Joueur : {[c.joueurPrenom, c.joueurNom].filter(Boolean).join(' ')}
              </div>
            )}
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-amber-400 font-semibold">{c.xp?.toLocaleString('fr-FR')} XP</div>
            <div className="text-amber-600 text-2xl group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </Link>
      ))}

      {/* ─── Aucun résultat ─── */}
      {query.trim() && filtered.length === 0 && (
        <div className="text-center py-10">
          <p className="text-stone-500 text-sm">Aucun personnage ne correspond à « {query} »</p>
          <button
            onClick={() => setQuery('')}
            className="mt-2 text-amber-700 hover:text-amber-500 text-xs transition-colors"
          >
            Effacer la recherche
          </button>
        </div>
      )}

      {/* ─── Liste vide (aucun personnage du tout) ─── */}
      {characters.length === 0 && (
        <div className="text-center text-stone-600 py-12">
          <p className="text-lg">Aucun personnage trouvé.</p>
        </div>
      )}
    </div>
  )
}

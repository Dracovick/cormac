'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { chercherFloue } from '@/lib/recherche-floue'
import type { BibliothequeIndex, EntreeIndex, RayonSlug } from '@/lib/queries/bibliotheque'

type RayonCle = keyof BibliothequeIndex

const RAYONS: { cle: RayonCle; slug: RayonSlug; label: string; icone: string; filtreLabel?: string }[] = [
  { cle: 'sorts', slug: 'sort', label: 'Sorts', icone: '✨', filtreLabel: 'Toutes les écoles' },
  { cle: 'potions', slug: 'potion', label: 'Potions', icone: '🧪' },
  { cle: 'objets', slug: 'objet', label: 'Objets magiques', icone: '💍', filtreLabel: 'Tous les types' },
  { cle: 'armes', slug: 'arme', label: 'Armes', icone: '⚔️' },
  { cle: 'armures', slug: 'armure', label: 'Armures', icone: '🛡️' },
  { cle: 'dons', slug: 'don', label: 'Dons', icone: '🎯' },
]

type Trouvaille = EntreeIndex & { slug: RayonSlug; icone: string; rayonLabel: string }

function LigneEntree({ href, nom, detail, badge }: { href: string; nom: string; detail: string; badge?: string }) {
  return (
    <Link
      href={href}
      className="flex items-baseline gap-2 px-3 py-2 border-b border-stone-800/70 last:border-b-0 hover:bg-stone-800/50 transition-colors"
    >
      {badge && <span className="shrink-0 text-xs" aria-hidden>{badge}</span>}
      <span className="text-amber-200 text-sm">{nom}</span>
      {detail && <span className="text-stone-500 text-xs truncate">{detail}</span>}
    </Link>
  )
}

/**
 * La Grande Bibliothèque — consultation des catalogues du Grimoire.
 *
 * Tout l'index est déjà dans le navigateur : la recherche répond à la frappe,
 * avec la même tolérance que le champ potions (accents, pluriels, coquilles,
 * vieux noms de table). Sans saisie, on feuillette rayon par rayon.
 *
 * L'état (recherche, rayon, filtre) est recopié dans l'URL via replaceState :
 * le bouton Retour d'une fiche ramène exactement où on était, sans repasser
 * par le serveur à chaque frappe.
 */
export function BibliothequeClient({ index }: { index: BibliothequeIndex }) {
  const [q, setQ] = useState('')
  const [rayon, setRayon] = useState<RayonCle>('sorts')
  const [filtre, setFiltre] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q0 = params.get('q')
    const r0 = params.get('rayon')
    const f0 = params.get('filtre')
    if (q0) setQ(q0)
    if (r0 && RAYONS.some(r => r.cle === r0)) setRayon(r0 as RayonCle)
    if (f0) setFiltre(f0)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (rayon !== 'sorts') params.set('rayon', rayon)
    if (filtre) params.set('filtre', filtre)
    const suffixe = params.toString()
    window.history.replaceState(null, '', suffixe ? `?${suffixe}` : window.location.pathname)
  }, [q, rayon, filtre])

  const tout: Trouvaille[] = useMemo(
    () => RAYONS.flatMap(r => index[r.cle].map(e => ({ ...e, slug: r.slug, icone: r.icone, rayonLabel: r.label }))),
    [index],
  )

  const enRecherche = q.trim().length >= 2
  const trouvailles = enRecherche ? chercherFloue(q, tout, e => e.nom, 30, e => e.alias ?? []) : []

  const rayonActif = RAYONS.find(r => r.cle === rayon)!
  const entreesRayon = index[rayon]
  const groupes = rayonActif.filtreLabel
    ? [...new Set(entreesRayon.map(e => e.groupe).filter((g): g is string => !!g))].sort((a, b) => a.localeCompare(b, 'fr'))
    : []
  const entreesAffichees = filtre ? entreesRayon.filter(e => e.groupe === filtre) : entreesRayon

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Chercher partout — un sort, une potion, un objet, une arme, un don…"
        className="w-full bg-stone-900 border border-stone-700 focus:border-amber-600 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 text-sm outline-none transition-colors mb-4"
        autoComplete="off"
      />

      {enRecherche ? (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden">
          {trouvailles.length === 0 ? (
            <p className="px-4 py-6 text-stone-500 text-sm text-center">
              Rien de ce nom dans la Bibliothèque. La page d'un personnage permet toujours de créer une mixture maison.
            </p>
          ) : (
            trouvailles.map(t => (
              <LigneEntree
                key={`${t.slug}-${t.id}`}
                href={`/bibliotheque/${t.slug}/${t.id}`}
                nom={t.nom}
                detail={[t.rayonLabel, t.detail].filter(Boolean).join(' — ')}
                badge={t.icone}
              />
            ))
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {RAYONS.map(r => (
              <button
                key={r.cle}
                type="button"
                onClick={() => { setRayon(r.cle); setFiltre('') }}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  rayon === r.cle
                    ? 'bg-amber-900/40 border-amber-700/60 text-amber-300'
                    : 'bg-stone-900/50 border-stone-700/40 text-stone-400 hover:text-amber-300 hover:border-amber-700/40'
                }`}
              >
                {r.icone} {r.label}
                <span className="text-xs opacity-60 ml-1">{index[r.cle].length}</span>
              </button>
            ))}
          </div>

          {groupes.length > 1 && (
            <select
              value={filtre}
              onChange={e => setFiltre(e.target.value)}
              className="mb-3 bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-300 text-sm outline-none focus:border-amber-600"
            >
              <option value="">{rayonActif.filtreLabel}</option>
              {groupes.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}

          <div className="bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden">
            {entreesAffichees.length === 0 ? (
              <p className="px-4 py-6 text-stone-500 text-sm text-center">Ce rayon est encore vide.</p>
            ) : (
              entreesAffichees.map(e => (
                <LigneEntree key={e.id} href={`/bibliotheque/${rayonActif.slug}/${e.id}`} nom={e.nom} detail={e.detail} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

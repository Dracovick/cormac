'use client'

import { useState } from 'react'

type Props = {
  url: string
  titre: string
  pages: number | null
  /** 'fiable' | 'partielle' | 'inutilisable' — ce que vaut la recherche ici. */
  qualiteRecherche: string | null
  tauxOcr: number | null
  tailleAffichee: string | null
  enAnglais: boolean
}

/**
 * Le lecteur d'un livre de jeu — ouvre le PDF dans la visionneuse du navigateur,
 * qui apporte la pagination, le zoom, l'impression et la RECHERCHE dans le texte
 * (Ctrl+F / ⌘F, ou la loupe de sa barre d'outils).
 *
 * Pourquoi la visionneuse du navigateur plutôt qu'un lecteur maison : elle sait
 * déjà tout faire, elle ne coûte pas un octet de dépendance, et sa recherche
 * fonctionne sur les 418 pages d'un coup — un lecteur page par page devrait
 * télécharger le livre entier pour chercher dedans.
 *
 * Le volume ne se charge qu'au clic : 14 à 96 Mo par livre, personne ne veut les
 * voir partir en ouvrant la fiche.
 *
 * ⚠ Sur téléphone, la visionneuse intégrée est capricieuse : le bouton « ouvrir
 * dans un onglet » est donc toujours offert à côté, et il ne dépend d'aucun
 * iframe.
 */
export function LecteurLivre({
  url, titre, pages, qualiteRecherche, tauxOcr, tailleAffichee, enAnglais,
}: Props) {
  const [ouvert, setOuvert] = useState(false)

  const recherche = qualiteRecherche === 'fiable'
    ? {
        couleur: 'text-emerald-400',
        icone: '🔍',
        texte: 'La recherche dans le texte fonctionne : Ctrl+F dans le lecteur (⌘F sur Mac), ou la loupe de sa barre d’outils.',
      }
    : qualiteRecherche === 'partielle'
      ? {
          couleur: 'text-amber-400',
          icone: '🔍',
          texte: 'La recherche trouve les mots nets, mais la reconnaissance de caractères de ce volume est imparfaite : un mot absent des résultats peut quand même être dans le livre.',
        }
      : {
          couleur: 'text-red-400',
          icone: '⛔',
          texte: 'La recherche ne fonctionne pas sur ce volume : son texte reconnu est trop abîmé. Le lecteur reste utile pour feuilleter et pour lire — ce sont les images des pages qui s’affichent, et elles sont nettes.',
        }

  return (
    <div className="mt-4">
      {/* ── Ce qu'il faut savoir avant d'ouvrir ── */}
      <div className="space-y-2 text-sm">
        {enAnglais && (
          <p className="text-amber-200 bg-amber-950/40 border border-amber-800/50 rounded px-3 py-2">
            🇬🇧 <strong>Ce livre est en anglais.</strong> C’est le seul ouvrage du Grimoire qui ne
            soit pas en français — tout le reste de la Bibliothèque est traduit.
          </p>
        )}
        <p className={recherche.couleur}>
          {recherche.icone} {recherche.texte}
          {tauxOcr !== null && (
            <span className="text-stone-600"> (texte reconnu : {tauxOcr} %)</span>
          )}
        </p>
      </div>

      {/* ── Les trois façons de l'ouvrir ── */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={() => setOuvert(o => !o)}
          className="bg-amber-900/50 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 rounded-lg px-4 py-2 text-sm font-semibold transition-colors min-h-[44px]"
        >
          {ouvert ? '✕ Fermer le lecteur' : '📖 Lire ici'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 rounded-lg px-4 py-2 text-sm transition-colors min-h-[44px] flex items-center"
        >
          ↗ Ouvrir dans un onglet
        </a>
        <a
          href={`${url}?download=1`}
          className="bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 rounded-lg px-4 py-2 text-sm transition-colors min-h-[44px] flex items-center"
        >
          ⬇ Télécharger{tailleAffichee ? ` (${tailleAffichee})` : ''}
        </a>
      </div>

      {!ouvert && (
        <p className="text-stone-600 text-xs mt-2">
          Le livre ne se télécharge qu’au moment où vous l’ouvrez
          {tailleAffichee ? ` — ${tailleAffichee}` : ''}
          {pages ? `, ${pages} pages` : ''}. Sur téléphone, préférez « ouvrir dans un onglet ».
        </p>
      )}

      {/* ── La visionneuse ── */}
      {ouvert && (
        <div className="mt-3">
          <iframe
            src={url}
            title={titre}
            className="w-full rounded-lg border border-stone-700 bg-stone-900"
            style={{ height: '80vh', minHeight: '480px' }}
          />
          <p className="text-stone-600 text-xs mt-2">
            Si la page reste blanche, votre navigateur refuse d’afficher un PDF dans un cadre :
            utilisez « ↗ Ouvrir dans un onglet ».
          </p>
        </div>
      )}
    </div>
  )
}

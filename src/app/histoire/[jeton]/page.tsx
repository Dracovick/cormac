import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getHistoireParJeton } from '@/lib/queries/histoire'
import { HistoireLecture } from '@/components/histoire/HistoireLecture'
import { cheminPartage, estJetonBienForme } from '@/lib/partage'

export const dynamic = 'force-dynamic'

/**
 * L'HISTOIRE PARTAGÉE — la seule page du Grimoire qui s'ouvre sans mot de passe.
 *
 * André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire.
 * Lorsque je copie le lien de la page ce lien amène à l'accueil du site. »
 *
 * ⛔ Trois garde-fous, et aucun n'est décoratif :
 *   1. le jeton est vérifié dans sa FORME avant toute requête — un segment
 *      d'URL quelconque ne part pas en `where` sur la base;
 *   2. un jeton inconnu ET un jeton révoqué rendent le MÊME 404, sans message
 *      qui les distinguerait vu du dehors;
 *   3. aucune action serveur n'est atteignable depuis cette page — ni ici, ni
 *      dans `HistoireLecture`. Et le middleware n'exempte ce préfixe qu'en GET
 *      et HEAD : une Server Action est un POST, le manifeste des actions de
 *      Next est global à l'application, et exempter toutes méthodes ouvrirait
 *      l'écriture du Grimoire entier à qui détient un lien de lecture.
 *
 * ⛔ Pas de lien vers la fiche : partager une histoire ne partage pas un
 * personnage. Le visiteur n'a pas le mot de passe, et ce lien ne lui en donne
 * pas l'équivalent.
 */

export const metadata: Metadata = {
  // ⚠ Un lien privé qu'on colle dans un message ne doit pas finir dans un
  // moteur de recherche. L'adresse est secrète par son jeton, pas par
  // obscurité — mais une page indexée annule le secret pour de bon.
  robots: { index: false, follow: false },
}

export default async function HistoirePartagee({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params
  if (!estJetonBienForme(jeton)) notFound()

  const histoire = await getHistoireParJeton(jeton)
  if (!histoire) notFound()

  const sousTitre = [histoire.race, histoire.classes].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-5">
            <div className="text-stone-500 text-sm">
              Grimoire D&amp;D · histoire partagée
            </div>
            <Link
              href={`${cheminPartage(jeton)}/imprimer`}
              className="inline-flex items-center gap-2 bg-stone-700/50 hover:bg-stone-600/70 border border-stone-600/50 text-stone-300 hover:text-white text-sm px-3 py-2 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              PDF de l’histoire
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Portraits du Blob, hôte non déclaré dans next.config : même choix que
                PhotoPortrait. ⚠ Le `eslint-disable-next-line` doit être collé à la
                balise — posé avant le `&&`, il visait cette ligne-là et la règle
                se déclenchait quand même, un étage plus bas. */}
            {histoire.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={histoire.photoUrl}
                alt={histoire.nom}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-900/50 shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="text-amber-600 text-xs uppercase tracking-widest mb-1">Histoire</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-300 tracking-wide">{histoire.nom}</h1>
              {histoire.surnom && <p className="text-amber-600 italic mt-0.5">« {histoire.surnom} »</p>}
              {sousTitre && <p className="text-stone-500 text-sm mt-1">{sousTitre}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-8">
        <HistoireLecture histoire={histoire} />

        <p className="text-stone-700 text-xs text-center mt-10">
          Lecture seule — Donjons &amp; Dragons 3<sup>e</sup> édition
        </p>
      </main>
    </div>
  )
}

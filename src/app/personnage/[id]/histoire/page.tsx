import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getHistoire } from '@/lib/queries/histoire'
import { HistoireClient } from '@/components/histoire/HistoireClient'
import { PartageHistoire } from '@/components/histoire/PartageHistoire'

export const dynamic = 'force-dynamic'

/**
 * L'HISTOIRE D'UN PERSONNAGE — une page à elle, pas une section de la fiche.
 *
 * André, le 2026-11-15 : « J'aimerais développer une section dans le grimoire
 * pour l'histoire des personnages. Quelque chose de différent de leur fiche de
 * personnage. Un lien dans la fiche du personnage qui amène à son histoire
 * détaillée que le joueur pourrait écrire. »
 *
 * ⛔ Volontairement sobre : pas de caractéristiques, pas de dés, pas de totaux.
 * La fiche est la machine; ceci est le récit. Le bandeau ne garde que ce qu'il
 * faut pour savoir de qui on lit l'histoire.
 */
export default async function HistoirePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ⚠ `Number('abc')` vaut NaN, et la requête partirait avec un `where id = NaN`
  // — c'est ainsi que `/personnage/<segment non numérique>` rend un 500 au lieu
  // d'un 404 ailleurs dans le Grimoire (dossier ouvert du 2026-11-12). On ne
  // reproduit pas le défaut sur une page neuve.
  const numero = Number(id)
  if (!Number.isInteger(numero) || numero <= 0) notFound()

  const histoire = await getHistoire(numero)
  if (!histoire) notFound()

  const sousTitre = [histoire.race, histoire.classes].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-5">
            {/* Zone tactile ≥44 px, rembourrage compensé par -mx-3 : même geste que la fiche. */}
            <Link
              href={`/personnage/${histoire.id}`}
              className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 -mx-3 min-h-[44px] rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Fiche de {histoire.nom}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/personnage/${histoire.id}/histoire/imprimer`}
                className="inline-flex items-center gap-2 bg-stone-700/50 hover:bg-stone-600/70 border border-stone-600/50 text-stone-300 hover:text-white text-sm px-3 py-2 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                PDF de l’histoire
              </Link>
              <Link
                href={`/aide/joueur?from=/personnage/${histoire.id}/histoire`}
                className="inline-flex items-center gap-1.5 bg-stone-800/50 hover:bg-stone-700/60 border border-stone-700/50 hover:border-stone-500 text-stone-400 hover:text-stone-200 text-sm px-3 py-2 rounded-lg transition-all"
                title="Aide — Guide du joueur"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Aide
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- portraits du Blob,
                hôte non déclaré dans next.config : même choix que PhotoPortrait. */}
            {histoire.photoUrl && (
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
        {/* Le partage AVANT le récit : c'est ce qu'on vient chercher quand on
            arrive ici pour donner le lien à quelqu'un, et ça ne gêne pas la
            lecture — le bloc est replié tant qu'on ne le déplie pas. */}
        <PartageHistoire personnageId={histoire.id} jetonInitial={histoire.jetonPartage} />

        <HistoireClient
          personnageId={histoire.id}
          nomPersonnage={histoire.nom}
          chapitres={histoire.chapitres}
          historiqueFiche={histoire.historique}
        />
      </main>
    </div>
  )
}

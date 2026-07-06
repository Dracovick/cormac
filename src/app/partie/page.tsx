import Link from 'next/link'
import { getJournalPartie, getEtatGroupe } from '@/app/actions/journal'
import { journeeLudiqueCourante, dateLisible, jourDecale } from '@/lib/journal-format'
import { PartieTimeline } from '@/components/partie/PartieTimeline'

export const dynamic = 'force-dynamic'

// Journal de partie du Maître de jeu : la chronologie fusionnée de tous les personnages
// pour une journée ludique (6 h → 6 h, heure du Québec). Les personnages actifs du jour
// sont détectés automatiquement — aucune configuration.
export default async function PartiePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams
  const aujourdhui = journeeLudiqueCourante()
  const jour = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : aujourdhui
  const [entrees, etatGroupe] = await Promise.all([getJournalPartie(jour), getEtatGroupe(jour)])

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ backgroundColor: '#080608' }}>
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-wide">📜 Journal de partie</h1>
            <p className="text-stone-500 text-sm mt-0.5">Vue du Maître de jeu — toute la table, round par round</p>
          </div>
          <Link href="/" className="text-stone-400 hover:text-amber-300 text-sm transition-colors">← Accueil</Link>
        </div>

        {/* Navigation de date */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Link
            href={`/partie?date=${jourDecale(jour, -1)}`}
            className="text-stone-400 hover:text-amber-300 bg-stone-900/80 border border-stone-700 rounded px-2.5 py-1.5 text-sm transition-colors"
            title="Journée précédente"
          >‹</Link>
          <div className="text-amber-400 font-semibold text-sm sm:text-base px-1 capitalize">
            {dateLisible(jour)}{jour === aujourdhui && <span className="text-stone-500 font-normal"> (aujourd&apos;hui)</span>}
          </div>
          <Link
            href={`/partie?date=${jourDecale(jour, 1)}`}
            className="text-stone-400 hover:text-amber-300 bg-stone-900/80 border border-stone-700 rounded px-2.5 py-1.5 text-sm transition-colors"
            title="Journée suivante"
          >›</Link>
          <form action="/partie" className="flex items-center gap-1.5 ml-auto">
            <input
              type="date"
              name="date"
              defaultValue={jour}
              className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-stone-300 text-base sm:text-sm focus:outline-none focus:border-amber-600 [color-scheme:dark]"
            />
            <button className="text-sm bg-amber-900/40 hover:bg-amber-800/60 border border-amber-800/50 text-amber-300 rounded px-2.5 py-1 transition-colors">
              Voir
            </button>
          </form>
        </div>

        <PartieTimeline entrees={entrees} etatGroupe={etatGroupe} enDirect={jour === aujourdhui} />

        <p className="mt-8 text-stone-700 text-xs text-center select-none">
          Chaque action posée sur une fiche (PV, sort, potion, attaque…) s&apos;inscrit ici automatiquement.
          La journée ludique s&apos;étend de 6 h à 6 h — une soirée qui déborde après minuit reste entière.
        </p>
      </div>
    </div>
  )
}

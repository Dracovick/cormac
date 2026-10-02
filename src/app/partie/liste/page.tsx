import Link from 'next/link'
import { getListeParties } from '@/app/actions/journal'
import { journeeLudiqueCourante, dateLisible } from '@/lib/journal-format'

export const dynamic = 'force-dynamic'

// Liste des parties précédentes : une carte par journée ludique où il s'est passé
// quelque chose au journal, de la plus récente à la plus ancienne. Un clic rouvre
// le journal complet de la soirée (/partie?date=…) — la porte d'entrée du début
// de séance, quand la table veut relire la dernière partie.
export default async function ListePartiesPage() {
  const parties = await getListeParties()
  const aujourdhui = journeeLudiqueCourante()

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ backgroundColor: '#080608' }}>
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-wide">🗂 Parties précédentes</h1>
            <p className="text-stone-500 text-sm mt-0.5">Toutes les soirées jouées, de la plus récente à la plus ancienne</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/partie" className="inline-flex items-center bg-stone-900/80 border border-stone-700 hover:border-amber-800/60 text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 min-h-[44px] rounded-lg">📜 Journal du jour</Link>
            <Link href="/" className="inline-flex items-center text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 -mx-1 min-h-[44px] rounded-lg">← Accueil</Link>
          </div>
        </div>

        {parties.length === 0 ? (
          <div className="bg-stone-900/70 border border-stone-800 rounded-lg p-8 text-center">
            <div className="text-stone-500">Aucune partie au journal pour l&apos;instant.</div>
            <div className="text-stone-600 text-xs mt-2">
              Dès que vos joueurs utilisent leur fiche, la soirée apparaîtra ici.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {parties.map(p => {
              const saillants: string[] = []
              if (p.combats > 0) saillants.push(`🏆 ${p.combats} combat${p.combats > 1 ? 's' : ''}`)
              if (p.xpTotale > 0) saillants.push(`⭐ ${p.xpTotale.toLocaleString('fr-CA')} XP distribuée`)
              if (p.butins > 0) saillants.push(`💰 butin (${p.butins})`)
              if (p.repos > 0) saillants.push(`🌙 nuit de repos`)
              if (p.notes > 0) saillants.push(`📝 ${p.notes} note${p.notes > 1 ? 's' : ''}`)
              if (p.photos > 0) saillants.push(`📷 ${p.photos} photo${p.photos > 1 ? 's' : ''}`)
              return (
                <Link
                  key={p.jour}
                  href={`/partie?date=${p.jour}`}
                  className="block bg-stone-900/70 border border-stone-800 hover:border-amber-800/60 rounded-lg px-4 py-3 transition-colors"
                  title="Ouvrir le journal complet de cette soirée"
                >
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-amber-400 font-semibold capitalize">
                      {dateLisible(p.jour)}
                      {p.jour === aujourdhui && <span className="text-stone-500 font-normal text-sm"> (aujourd&apos;hui)</span>}
                    </span>
                    <span className="text-stone-600 text-xs">{p.nbEntrees} entrée{p.nbEntrees > 1 ? 's' : ''} au journal</span>
                  </div>
                  {p.personnages.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {p.personnages.map(nom => (
                        <span key={nom} className="text-xs bg-stone-800/80 text-stone-300 border border-stone-700 rounded-full px-2 py-0.5">
                          {nom}
                        </span>
                      ))}
                    </div>
                  )}
                  {saillants.length > 0 && (
                    <div className="text-stone-400 text-xs mt-2">{saillants.join(' · ')}</div>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-stone-700 text-xs text-center select-none">
          Une journée ludique s&apos;étend de 6 h à 6 h, heure du Québec — une soirée qui déborde après minuit reste une seule partie.
        </p>
      </div>
    </div>
  )
}

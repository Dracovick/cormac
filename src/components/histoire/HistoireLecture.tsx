import { ancreChapitre, compteMots, dateCourte, deNom } from '@/lib/histoire'
import { RecitRendu } from '@/components/histoire/RecitRendu'
import type { HistoirePersonnage } from '@/lib/queries/histoire'

/**
 * L'HISTOIRE EN LECTURE SEULE — ce que voit celui à qui on a donné le lien.
 *
 * André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire. »
 *
 * ⛔ Composant SERVEUR, sans 'use client', et c'est le garde-fou le plus
 * important de tout ce lot : il n'importe AUCUNE action serveur. La page
 * publique `/histoire/<jeton>` est la seule adresse du Grimoire exemptée du mot
 * de passe — si le moindre bouton d'écriture descendait jusqu'ici, il
 * s'exécuterait pour un visiteur anonyme. Rien à envoyer, donc rien à signer.
 * (Le middleware ferme la porte en second : il n'exempte ce préfixe qu'en GET
 * et HEAD, jamais en POST — et une Server Action est un POST.)
 *
 * ⛔ Et rien de la FICHE n'apparaît : ni caractéristiques, ni dés, ni totaux, ni
 * lien vers la fiche. Partager une histoire ne partage pas un personnage.
 */
export function HistoireLecture({ histoire }: { histoire: HistoirePersonnage }) {
  const { chapitres } = histoire

  return (
    <div className="space-y-6">
      {/* Le sommaire, dressé sur les titres — masqué sous deux chapitres, où il
          n'aiderait personne. Même règle que la page interne. */}
      {chapitres.length > 1 && (
        <nav className="bg-stone-900/60 border border-stone-700/60 rounded-xl p-4">
          <div className="text-amber-500 text-xs uppercase tracking-wider mb-3">Sommaire</div>
          <ol className="space-y-1.5">
            {chapitres.map((c, i) => (
              <li key={c.id} className="flex items-baseline gap-2 text-sm">
                <span className="text-stone-600 tabular-nums w-5 shrink-0 text-right">{i + 1}.</span>
                <a href={`#${ancreChapitre(c.id)}`} className="text-stone-300 hover:text-amber-300 transition-colors">
                  {c.titre}
                </a>
                <span className="text-stone-700 text-xs ml-auto shrink-0 tabular-nums">
                  {compteMots(c.contenu)} mots
                </span>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {chapitres.length === 0 && (
        <div className="bg-stone-900/50 border border-stone-700/60 rounded-xl p-6 text-center">
          <p className="text-stone-400 text-sm">
            L’histoire {deNom(histoire.nom)} n’est pas encore écrite.
          </p>
        </div>
      )}

      {chapitres.map((c, i) => (
        <article
          key={c.id}
          id={ancreChapitre(c.id)}
          className="scroll-mt-6 bg-stone-900/40 border border-stone-700/50 rounded-xl p-5 sm:p-6"
        >
          <header className="mb-4 pb-3 border-b border-stone-700/50">
            <div className="text-stone-600 text-xs uppercase tracking-wider mb-1">
              Chapitre {i + 1}
            </div>
            <h2 className="text-amber-300 text-xl font-semibold">{c.titre}</h2>
            <div className="text-stone-600 text-xs mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {c.signature && <span>écrit par {c.signature}</span>}
              {c.updatedAt && <span>revu le {dateCourte(c.updatedAt)}</span>}
            </div>
          </header>
          <RecitRendu contenu={c.contenu} />
        </article>
      ))}
    </div>
  )
}

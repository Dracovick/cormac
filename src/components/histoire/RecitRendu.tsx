import { blocsHistoire, type Fragment } from '@/lib/histoire'

/**
 * La prose d'un chapitre, mise en forme.
 *
 * ⛔ Aucun `dangerouslySetInnerHTML`, et aucun HTML stocké en base : ce texte
 * vient d'un joueur. `@/lib/histoire` le découpe en blocs, ce fichier les tourne
 * en éléments React, et React échappe tout ce qu'il affiche. Un joueur qui tape
 * `<script>` voit `<script>`.
 *
 * ⛔ Et aucune dépendance Markdown ajoutée : cinq formes suffisent, et elles
 * s'écrivent au crayon sans menu — ### intertitre, > réplique, - liste,
 * **gras**, *italique*. Tout le reste est du texte.
 */

/**
 * ⚠ `pourImpression` descend jusqu'ici, et ce n'est pas un détail de goût : un
 * gras doré (`text-amber-200`) sur le fond blanc du papier est illisible. Le
 * mode papier n'habille donc le gras que de sa graisse, et l'italique que de sa
 * pente — les deux seules marques qui survivent au noir et blanc.
 */
function Fragments({ fragments, pourImpression }: { fragments: Fragment[]; pourImpression: boolean }) {
  return (
    <>
      {fragments.map((f, i) => {
        if (f.sorte === 'gras') {
          return <strong key={i} className={pourImpression ? 'font-bold' : 'text-amber-200 font-semibold'}>{f.texte}</strong>
        }
        if (f.sorte === 'italique') {
          return <em key={i} className={pourImpression ? '' : 'text-stone-200'}>{f.texte}</em>
        }
        return <span key={i}>{f.texte}</span>
      })}
    </>
  )
}

export function RecitRendu({ contenu, pourImpression = false }: { contenu: string; pourImpression?: boolean }) {
  const blocs = blocsHistoire(contenu)

  if (blocs.length === 0) {
    return pourImpression ? null : (
      <p className="text-stone-600 italic text-sm">Ce chapitre n’a pas encore de texte.</p>
    )
  }

  // Deux chartes : l'écran (parchemin sombre du Grimoire) et le papier (noir sur
  // blanc). Les classes `print:` ne suffisaient pas — la page imprimable a son
  // propre fond, et un gris clair sur blanc ne se lit pas à la table.
  const corps = pourImpression ? 'text-stone-900' : 'text-stone-300'
  const titre = pourImpression ? 'text-stone-900' : 'text-amber-400'
  const cit = pourImpression ? 'border-stone-400 text-stone-700' : 'border-amber-800/60 text-amber-100/90'

  return (
    <div className={`space-y-3 leading-relaxed ${corps}`}>
      {blocs.map((bloc, i) => {
        if (bloc.sorte === 'titre') {
          return (
            <h3 key={i} className={`${titre} font-semibold text-base mt-5 first:mt-0`}>
              <Fragments fragments={bloc.fragments} pourImpression={pourImpression} />
            </h3>
          )
        }
        if (bloc.sorte === 'citation') {
          return (
            <blockquote key={i} className={`border-l-2 pl-4 italic ${cit}`}>
              <Fragments fragments={bloc.fragments} pourImpression={pourImpression} />
            </blockquote>
          )
        }
        if (bloc.sorte === 'liste') {
          return (
            <ul key={i} className="list-disc pl-6 space-y-1">
              {bloc.items.map((item, j) => (
                <li key={j}><Fragments fragments={item} pourImpression={pourImpression} /></li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i}>
            <Fragments fragments={bloc.fragments} pourImpression={pourImpression} />
          </p>
        )
      })}
    </div>
  )
}

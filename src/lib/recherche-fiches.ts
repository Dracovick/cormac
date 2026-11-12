/**
 * LA RECHERCHE DE LA LISTE DES PERSONNAGES — ses synonymes.
 *
 * Sorti de `CharacterList.tsx` pour être CONTRÔLABLE : la table des races qui
 * portent deux noms se dérive de `RACES_DND35`, et un script doit pouvoir le
 * vérifier sans monter un composant React.
 */
import { RACES_DND35 } from '@/lib/dnd35/races'

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

/**
 * Les races qui portent plusieurs noms — « Halfelin » et « Petite-gens » sont
 * la même race, et André garde les deux (2026-11-12) : « Plusieurs joueurs
 * préfèrent le nom anglais! Tant que tout fonctionne avec les deux! »
 *
 * ⚠ Sans cette table, chercher « halfelin » ratait les 3 fiches saisies en
 * Petite-gens, et l'inverse. La recherche fait un `includes`, donc le même
 * terme ramène aussi les sous-races : « halfelin » trouve « Petite-gens
 * vaillant ». Construite depuis `RACES_DND35[].alias`, jamais écrite à la
 * main : une race qui prend un second nom de table suit toute seule.
 */
const SYNONYMES_RACE: Record<string, string[]> = Object.fromEntries(
  RACES_DND35.filter(r => r.alias?.length).flatMap(r => {
    const toutes = [r.nom, ...(r.alias ?? [])]
    return toutes.map(a => [a.toLowerCase(), toutes.map(x => x.toLowerCase())])
  })
)

export function expandQuery(q: string): string[] {
  return SYNONYMES[q] ?? SYNONYMES_RACE[q] ?? [q]
}


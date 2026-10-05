/**
 * Anciens noms et habitudes de table — les noms que les joueurs tapent encore
 * par réflexe (1re édition, vieilles traductions maison) et que la recherche à
 * suggestions doit reconnaître pour les ramener au nom officiel du Grimoire.
 *
 * Clé : nom OFFICIEL tel qu'écrit dans la table `potions` (à l'octet près).
 * Valeurs : ce que les joueurs tapent à la place.
 *
 * C'est ce qui a produit les doublons du 2026-10-04 : « Potion de Grand Soin »,
 * « Potion de grands soins », « Potion de grand soins » et « Posion Grand Soin »
 * pour la même « Potion de soins importants » (le terme 1re édition a la vie dure).
 */
export const ANCIENS_NOMS: Record<string, string[]> = {
  'Potion de soins importants': ['Potion de grands soins', 'Grand Soin', 'Guérison majeure'],
  'Potion de soins': ['Potion de soins légers'],
}

export function aliasPour(nomOfficiel: string): string[] {
  return ANCIENS_NOMS[nomOfficiel] ?? []
}

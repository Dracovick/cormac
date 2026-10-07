/**
 * Anciens noms et habitudes de table — les noms que les joueurs tapent encore
 * par réflexe (1re édition, vieilles traductions maison) et que la recherche à
 * suggestions doit reconnaître pour les ramener au nom officiel du Grimoire.
 *
 * Clé : nom OFFICIEL tel qu'écrit en base (table `potions` ou `spells`), à l'octet près.
 * Valeurs : ce que les joueurs tapent à la place.
 *
 * C'est ce qui a produit les doublons du 2026-10-04 : « Potion de Grand Soin »,
 * « Potion de grands soins », « Potion de grand soins » et « Posion Grand Soin »
 * pour la même « Potion de soins importants » (le terme 1re édition a la vie dure).
 */
export const ANCIENS_NOMS: Record<string, string[]> = {
  'Potion de soins importants': ['Potion de grands soins', 'Grand Soin', 'Guérison majeure'],
  'Potion de soins': ['Potion de soins légers'],
  // Le Guide du Maître (table 7-28, p. 263) nomme la potion « État gazeux »,
  // mais à la table on dit « forme gazeuse » — les deux doivent la trouver.
  "Potion d'état gazeux": ['Forme gazeuse', 'Potion de forme gazeuse'],
  // Le sort s'appelle Rapidité en VF 3.5, mais le réflexe « hâte » a la vie dure.
  'Potion de rapidité': ['Hâte', 'Potion de hâte'],

  // ── Sorts : le Manuel des Joueurs imprime lui-même deux noms pour le même sort.
  // La liste de classe du chapitre 11 donne l'un, la fiche descriptive donne l'autre;
  // la base porte le nom de la liste, la table dit souvent l'autre. Vérifié à l'image.
  'Téléportation suprême': ['Téléportation sans erreur'],          // p. 296
  'Blessure importante de groupe': ['Blessure grave de groupe'],   // p. 205
}

export function aliasPour(nomOfficiel: string): string[] {
  return ANCIENS_NOMS[nomOfficiel] ?? []
}

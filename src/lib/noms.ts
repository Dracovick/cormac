/**
 * Normalisation des noms de référence (compétences, dons, dieux, langues…).
 *
 * Sert à reconnaître qu'une saisie désigne une entrée qui existe déjà, pour
 * éviter d'en créer une seconde. C'est ainsi que la table `skills` est passée
 * de 45 compétences réelles à 191 entrées : chaque saisie manuelle qui ne
 * tombait pas à l'octet près sur l'entrée existante en créait une nouvelle,
 * en silence.
 *
 * ⚠️ Volontairement conservatrice. On ignore seulement ce qui ne distingue
 * jamais deux références :
 *   - la casse                  « iron will »   = « Iron Will »
 *   - les accents               « Equitation »  = « Équitation »
 *   - les espaces multiples     « Iron  Will »  = « Iron Will »
 *   - les espaces de début/fin  «  Détection »  = « Détection »
 *
 * ⛔ La ponctuation et les parenthèses sont conservées : elles portent du sens.
 *   « Connaissances (mystères) » ≠ « Connaissances (nature) »
 *   « Artisanat (armes) »        ≠ « Artisanat (armures) »
 *   « Magie divine »             ≠ « Art de la magie »   (compétence maison)
 *
 * Vérifié contre les 104 compétences, 478 dons, 713 sorts, 272 objets magiques,
 * 170 armes, 33 langues, 27 dieux, 16 classes et 10 races de la base : la règle
 * ne rapproche aucune paire d'entrées réellement distinctes.
 */
export function normaliserNom(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // retire les accents
    .toLowerCase()
    .replace(/\s+/g, ' ')             // espaces multiples et tabulations
    .trim()
}

export function memeNom(a: string, b: string): boolean {
  return normaliserNom(a) === normaliserNom(b)
}

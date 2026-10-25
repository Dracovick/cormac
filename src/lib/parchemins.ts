// Petites règles d'affichage des parchemins, partagées par la fiche, les actions
// serveur et la feuille imprimable.
//
// ⛔ Ce fichier existe parce que `src/app/actions/character.ts` porte 'use server' :
// tout ce qu'un tel module exporte doit être une fonction asynchrone, sinon le
// build échoue. Une aide de mise en forme n'a rien à y faire.

/** Le nom à afficher : celui du sort lié, ou le nom libre quand il n'y en a pas. */
export function nomParchemin(nomSort: string | null | undefined, nomLibre: string | null | undefined): string {
  return nomSort ?? nomLibre ?? 'Parchemin'
}

/**
 * Niveau de lanceur par défaut d'un parchemin de ce niveau de sort, selon le SRD
 * (Magic Items — Scrolls) : le NLS minimal est celui du lanceur le plus faible
 * capable de lancer le sort, soit 2 × niveau du sort − 1 pour un lanceur profane
 * à progression complète (sort de niveau 1 → NLS 1, niveau 2 → NLS 3, niveau 4 →
 * NLS 7).
 *
 * ⚠ C'est une SUGGESTION proposée à la saisie, jamais une valeur écrite d'office :
 * un parchemin trouvé peut porter n'importe quel NLS supérieur, et c'est lui qui
 * fixe portée, durée et dégâts. Un parchemin dont le NLS n'est pas connu garde
 * NULL, et la fiche le dit.
 */
export function nlsSuggere(niveauSort: number | null | undefined): number | null {
  if (niveauSort == null || niveauSort < 0) return null
  if (niveauSort === 0) return 1 // une oraison vient d'un lanceur de niveau 1
  return 2 * niveauSort - 1
}

export const TYPES_PARCHEMIN = [
  { code: 'profane', libelle: 'Profane' },
  { code: 'divin', libelle: 'Divin' },
] as const

export type TypeParchemin = (typeof TYPES_PARCHEMIN)[number]['code']

/** Classes du Manuel, par nature de magie. Sert à deviner le type au choix du sort. */
export const CLASSES_ARCANIQUES = ['Magicien', 'Ensorceleur', 'Barde']
export const CLASSES_DIVINES = ['Prêtre', 'Druide', 'Paladin', 'Rôdeur']

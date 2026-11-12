/**
 * EMPLACEMENTS DE SORTS EN BONUS — caractéristique élevée.
 *
 * Source : Manuel des Joueurs 3.5 (VF), **table 1-1 « Modificateurs de
 * caractéristique et sorts en bonus », page 8**. Relevée à l'image dans le PDF
 * (le livre n'a pas de couche texte), ligne par ligne, et recopiée telle quelle
 * dans `TABLE_1_1` ci-dessous pour que les contrôles comparent au LIVRE et non
 * au résultat de la formule.
 *
 * ⭐ Le piège de cette table, celui qui se trompe sans choquer personne : au
 * modificateur **+5** (valeur 20-21), le 1er niveau de sort reçoit **2**
 * emplacements, pas 1. Le deuxième emplacement d'un niveau de sort N arrive au
 * modificateur N+4, et non N+5 — donc dès +5 pour les sorts de 1er niveau.
 *
 * ⛔ Aucun bonus aux sorts de niveau 0 (oraisons / tours de magie) : la colonne
 * « 0 » de la table ne porte que des tirets, à toutes les lignes.
 *
 * ⚠️ Un emplacement en bonus n'est accordé que si le personnage a déjà accès à
 * ce niveau de sort — le livre l'écrit juste sous la table : « seulement s'il a
 * atteint le niveau nécessaire pour lancer les sorts en question ». C'est
 * `getEmplacementsAvecBonus` (dans `classes.ts`) qui applique cette condition,
 * en exigeant au moins un emplacement de base au même niveau de sort.
 */

/**
 * Emplacements en bonus pour UN niveau de sort, selon le modificateur de la
 * caractéristique d'incantation.
 *
 *     bonus(N) = ⌊(mod − N) / 4⌋ + 1   si mod ≥ N ≥ 1
 *     bonus(N) = 0                      sinon
 *
 * La formule reproduit les dix-huit lignes de la table 1-1 sans exception —
 * c'est ce que vérifie le contrôle `emplacements-bonus.test`.
 */
export function emplacementsBonusCarac(modCarac: number, niveauSort: number): number {
  if (niveauSort < 1 || niveauSort > 9) return 0
  if (modCarac < niveauSort) return 0
  return Math.floor((modCarac - niveauSort) / 4) + 1
}

/**
 * Les neuf valeurs d'un coup, indexées comme les tables d'emplacements du
 * Grimoire : l'indice 0 (oraisons) vaut toujours 0.
 */
export function emplacementsBonusTousNiveaux(modCarac: number): number[] {
  return Array.from({ length: 10 }, (_, n) => emplacementsBonusCarac(modCarac, n))
}

/**
 * La table 1-1 recopiée du Manuel des Joueurs, p. 8 — colonnes « Sorts en bonus
 * (par niveau de sort) », du 1er au 9e. Le livre s'arrête à 44-45 (+17) et
 * écrit « etc. » : la formule prolonge au-delà, ce qui sert aux scores poussés
 * par un manuel ou un tome.
 *
 * ⭐ Conservée pour rester vérifiable ligne à ligne contre le livre, exactement
 * comme `XP_PAR_NIVEAU` dans `rules.ts`. Ce n'est PAS la source de vérité du
 * calcul : c'est son témoin.
 */
export const TABLE_1_1: Record<number, number[]> = {
  //      1er 2e 3e 4e 5e 6e 7e 8e 9e
  0:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  1:  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [1, 1, 0, 0, 0, 0, 0, 0, 0],
  3:  [1, 1, 1, 0, 0, 0, 0, 0, 0],
  4:  [1, 1, 1, 1, 0, 0, 0, 0, 0],
  5:  [2, 1, 1, 1, 1, 0, 0, 0, 0],
  6:  [2, 2, 1, 1, 1, 1, 0, 0, 0],
  7:  [2, 2, 2, 1, 1, 1, 1, 0, 0],
  8:  [2, 2, 2, 2, 1, 1, 1, 1, 0],
  9:  [3, 2, 2, 2, 2, 1, 1, 1, 1],
  10: [3, 3, 2, 2, 2, 2, 1, 1, 1],
  11: [3, 3, 3, 2, 2, 2, 2, 1, 1],
  12: [3, 3, 3, 3, 2, 2, 2, 2, 1],
  13: [4, 3, 3, 3, 3, 2, 2, 2, 2],
  14: [4, 4, 3, 3, 3, 3, 2, 2, 2],
  15: [4, 4, 4, 3, 3, 3, 3, 2, 2],
  16: [4, 4, 4, 4, 3, 3, 3, 3, 2],
  17: [5, 4, 4, 4, 4, 3, 3, 3, 3],
}

// Limites de charge légère (lbs) selon le score de Force (SRD D&D 3.5)
const LIGHT_LOAD_LBS: Record<number, number> = {
  1: 3,  2: 6,  3: 10, 4: 13, 5: 16, 6: 20, 7: 23, 8: 26, 9: 30,
  10: 33, 11: 38, 12: 43, 13: 50, 14: 58, 15: 66, 16: 76, 17: 86, 18: 100,
  19: 116, 20: 133, 21: 153, 22: 173, 23: 200, 24: 233, 25: 266,
}

export function getLightLoadLbs(str: number): number {
  if (str <= 0) return 0
  const clamped = Math.min(Math.max(str, 1), 25)
  return LIGHT_LOAD_LBS[clamped] ?? 3
}

export type ChargeCategorie = 'légère' | 'moyenne' | 'lourde' | 'surchargé'

export function getChargeCategorie(str: number, poidsLbs: number, multTaille = 1): ChargeCategorie {
  const light = getLightLoadLbs(str) * multTaille
  if (poidsLbs <= light)       return 'légère'
  if (poidsLbs <= light * 2)   return 'moyenne'
  if (poidsLbs <= light * 3)   return 'lourde'
  return 'surchargé'
}

export function getChargeLimites(str: number, multTaille = 1): { legere: number; moyenne: number; lourde: number } {
  const light = getLightLoadLbs(str) * multTaille
  return { legere: light, moyenne: light * 2, lourde: light * 3 }
}

// ─── Kilogrammes ─────────────────────────────────────────────────────────────
// ⚠ La table ci-dessus est celle du SRD, en LIVRES. Les poids de la base, eux,
// sont en KILOGRAMMES : mesuré au catalogue d'armes le 2026-11-12 — dague 0,50 ·
// arbalète lourde 4,00 · masse d'armes lourde 4,00 · masse légère 2,00, soit
// exactement les valeurs du Manuel des Joueurs 3.5 en version française. La
// feuille imprimée dit de son côté « Poids (kg) » en toutes lettres.
//
// Comparer directement les deux rendait la charge optimiste d'un facteur 2 : un
// sac de 25 kg s'affichait « 25 lbs » et restait « légère » là où il relève de
// la charge moyenne. Mesuré avant correction sur les 74 fiches : 21 portent un
// poids non nul, et UNE SEULE change de catégorie — Grimdar [86], 64 kg à FOR
// 16, qui passe de « légère » à « moyenne ». Les 20 autres ne bougent pas.
//
// ⭐ Le facteur est 2, et non 2,2046 : le Manuel français convertit à raison de
// 1 livre = 0,5 kg, et sa table d'encombrement suit la même règle (charge légère
// à FOR 10 : 33 lb → 16,5 kg). Prendre la conversion physique exacte donnerait
// des seuils qui ne sont dans aucun livre de la table.
const LB_PAR_KG = 2

/**
 * ⚠ `multTaille` vient de `multiplicateurCharge()` (`lib/dnd35/taille.ts`) :
 * ×3/4 pour une créature de petite taille, ×2 pour une grande. SRD 3.5 VF,
 * chap. Poids transportable : « les chiffres indiqués […] concernent des
 * créatures bipèdes de taille moyenne (M) […] les créatures bipèdes plus
 * petites transportent un poids moins important […] petite (P) : 3/4 ».
 *
 * ⛔ Défaut à 1 : un appel qui l'ignore rend exactement ce qu'il rendait avant
 * le 2026-11-16. Mesuré sur les 6 fiches de petite taille : aucune ne change de
 * catégorie (elles portent de 0 à 5,5 kg), seuls les SEUILS affichés baissent.
 */
export function getChargeCategorieKg(str: number, poidsKg: number, multTaille = 1): ChargeCategorie {
  return getChargeCategorie(str, poidsKg * LB_PAR_KG, multTaille)
}

/** Les trois seuils en kilogrammes — ceux de la table française du Manuel. */
export function getChargeLimitesKg(str: number, multTaille = 1): { legere: number; moyenne: number; lourde: number } {
  const l = getChargeLimites(str, multTaille)
  return { legere: l.legere / LB_PAR_KG, moyenne: l.moyenne / LB_PAR_KG, lourde: l.lourde / LB_PAR_KG }
}

// Effets des catégories de charge (PHB 3.5 p.162)
export const EFFETS_CHARGE: Record<ChargeCategorie, string> = {
  légère:    'Aucun malus.',
  moyenne:   'Max DEX +3, malus armure −3, vitesse réduite.',
  lourde:    'Max DEX +1, malus armure −6, vitesse réduite, pas de course.',
  surchargé: 'Peut seulement pousser, tirer ou traîner (×5 charge lourde).',
}

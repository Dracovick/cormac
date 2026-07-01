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

export function getChargeCategorie(str: number, poidsLbs: number): ChargeCategorie {
  const light = getLightLoadLbs(str)
  if (poidsLbs <= light)       return 'légère'
  if (poidsLbs <= light * 2)   return 'moyenne'
  if (poidsLbs <= light * 3)   return 'lourde'
  return 'surchargé'
}

export function getChargeLimites(str: number): { legere: number; moyenne: number; lourde: number } {
  const light = getLightLoadLbs(str)
  return { legere: light, moyenne: light * 2, lourde: light * 3 }
}

// Effets des catégories de charge (PHB 3.5 p.162)
export const EFFETS_CHARGE: Record<ChargeCategorie, string> = {
  légère:    'Aucun malus.',
  moyenne:   'Max DEX +3, malus armure −3, vitesse réduite.',
  lourde:    'Max DEX +1, malus armure −6, vitesse réduite, pas de course.',
  surchargé: 'Peut seulement pousser, tirer ou traîner (×5 charge lourde).',
}

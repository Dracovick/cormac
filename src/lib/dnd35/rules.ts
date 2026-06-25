export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export type BabProgression = 'elevee' | 'moyenne' | 'faible'

export function getBab(prog: BabProgression, niveau: number): number {
  if (prog === 'elevee') return niveau
  if (prog === 'moyenne') return Math.floor(niveau * 3 / 4)
  return Math.floor(niveau / 2)
}

export function getSave(isBon: boolean, niveau: number): number {
  return isBon ? 2 + Math.floor(niveau / 2) : Math.floor(niveau / 3)
}

export const ALIGNEMENTS = [
  'Loyal Bon', 'Neutre Bon', 'Chaotique Bon',
  'Loyal Neutre', 'Neutre', 'Chaotique Neutre',
  'Loyal Mauvais', 'Neutre Mauvais', 'Chaotique Mauvais',
]

export const XP_PAR_NIVEAU: Record<number, number> = {
  1: 0, 2: 1000, 3: 3000, 4: 6000, 5: 10000,
  6: 15000, 7: 21000, 8: 28000, 9: 36000, 10: 45000,
  11: 55000, 12: 66000, 13: 78000, 14: 91000, 15: 105000,
  16: 120000, 17: 136000, 18: 153000, 19: 171000, 20: 190000,
}

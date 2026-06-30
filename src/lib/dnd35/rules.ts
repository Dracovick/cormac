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

export function getMultiClassBab(classes: { bab: BabProgression; niveau: number }[]): number {
  return classes.reduce((sum, c) => sum + getBab(c.bab, c.niveau), 0)
}

export function getMultiClassSave(
  saveType: 'vigueur' | 'reflexes' | 'volonte',
  classes: { bonsSauvegardes: string[]; niveau: number }[]
): number {
  return classes.reduce((sum, c) => {
    const isGood = c.bonsSauvegardes.includes(saveType)
    return sum + (isGood ? 2 + Math.floor(c.niveau / 2) : Math.floor(c.niveau / 3))
  }, 0)
}

export function calcXpPenalite(
  classes: { classe: string; niveau: number }[],
  classePreferee: string
): number {
  if (classes.length <= 1) return 0
  let eligibles: { classe: string; niveau: number }[]
  if (classePreferee === 'any') {
    // L'humain désigne sa classe la plus haute comme préférée (exempt du calcul)
    const maxNivAll = Math.max(...classes.map(c => c.niveau))
    const favIdx = classes.findIndex(c => c.niveau === maxNivAll)
    eligibles = classes.filter((_, i) => i !== favIdx)
  } else {
    eligibles = classes.filter(c => c.classe !== classePreferee)
  }
  if (eligibles.length === 0) return 0
  const maxNiv = Math.max(...eligibles.map(c => c.niveau))
  return eligibles.filter(c => maxNiv - c.niveau >= 2).length * 20
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

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

/**
 * Seuils d'expérience par niveau de personnage.
 *
 * Niveaux 1-20 : Manuel des Joueurs 3.5, table 3-2 « Experience and Level-Dependent
 * Benefits ». Niveaux 21-30 : Epic Level Handbook, table 1-2 (page 7 du livre —
 * sur cet ouvrage, page du PDF = page du livre, décalage zéro). Valeurs relues à
 * l'image, une par une.
 *
 * ⭐ La table est CONSERVÉE pour rester vérifiable ligne à ligne contre les livres,
 * mais elle n'est plus la source de vérité : c'est `xpPourNiveau()` ci-dessous.
 * Les onze valeurs épiques ont été recoupées onze fois sur onze contre la formule.
 */
export const XP_PAR_NIVEAU: Record<number, number> = {
  1: 0, 2: 1000, 3: 3000, 4: 6000, 5: 10000,
  6: 15000, 7: 21000, 8: 28000, 9: 36000, 10: 45000,
  11: 55000, 12: 66000, 13: 78000, 14: 91000, 15: 105000,
  16: 120000, 17: 136000, 18: 153000, 19: 171000, 20: 190000,
  // ── Niveaux épiques (Epic Level Handbook, table 1-2, p. 7) ────────────────
  21: 210000, 22: 231000, 23: 253000, 24: 276000, 25: 300000,
  26: 325000, 27: 351000, 28: 378000, 29: 406000, 30: 435000,
}

/**
 * XP nécessaire pour atteindre le niveau `n`.
 *
 *     PX(n) = 500 × n × (n − 1)
 *
 * ⛔⛔ Il n'existe AUCUN niveau maximum en D&D 3.5. Une table qui s'arrête crée un
 * faux plafond : c'est ce qui faisait afficher « Niveau maximum atteint » sur la
 * fiche d'Elora Vlaardoen (Magicien 16 / Cryptomancière 8 = niveau 24).
 *
 * La formule du Manuel des Joueurs se prolonge sans rupture au-delà du niveau 20 :
 * elle reproduit exactement les dix seuils épiques de la table 1-2 (21 à 30). Le
 * Epic Level Handbook le confirme deux fois :
 *   - par sa règle d'incrément — « add your current level times 1,000 XP » ;
 *   - par l'encadré « No Limits », p. 6 — « You can generally assume that any
 *     patterns on a particular table continue infinitely. »
 *
 * ⭐ Toujours passer par cette fonction plutôt que d'indexer `XP_PAR_NIVEAU`
 * directement : c'est ce qui garantit que l'écran et la fiche imprimée ne peuvent
 * plus se contredire, et que le jeu épique n'a pas de borne artificielle.
 */
export function xpPourNiveau(niveau: number): number {
  const n = Math.max(1, Math.floor(niveau))
  return 500 * n * (n - 1)
}

/**
 * Modificateur de caractéristique servant à un jet de sauvegarde.
 *
 * ⛔ Le bonus racial en fait partie. L'oublier fausse la Vigueur de tous les nains
 * (+2 CON) et de tous les elfes (−2 CON) : c'est le défaut qui faisait afficher +7
 * à l'écran et +8 sur la fiche imprimée pour un même personnage.
 *
 * Partagée par la fiche à l'écran et par la fiche imprimée, pour qu'elles ne
 * puissent plus diverger. Les Réflexes passent déjà par le modificateur de
 * Dextérité complet ; Vigueur et Volonté doivent faire de même.
 *
 * ⚠️ `base` est le score SAISI, sans bonus racial : c'est la convention de
 * `character_ability_scores` (un nain à CON 16 est enregistré 14).
 */
export function modSauvegarde(
  base: number | null | undefined,
  magique: number | null | undefined,
  bonusRacial: number,
  bonusSorts = 0,
): number {
  return getModifier((base ?? 10) + (magique ?? 0) + bonusRacial + bonusSorts)
}

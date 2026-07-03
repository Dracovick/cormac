import type { BabProgression } from './rules'
import { PRESTIGE_CLASSES } from './prestige-classes'

export interface ClasseInfo {
  nom: string
  de: number
  bab: BabProgression
  bonsSauvegardes: string[]
  competencesParNiveau: number
  lanceurSorts: boolean
  caracteristiqueSorts?: 'intelligence' | 'sagesse' | 'charisme'
  niveauMaxSorts?: number
}

export const CLASSES_DND35: ClasseInfo[] = [
  { nom: 'Barbare',     de: 12, bab: 'elevee',  bonsSauvegardes: ['vigueur'],                     competencesParNiveau: 4, lanceurSorts: false },
  { nom: 'Barde',       de: 6,  bab: 'moyenne', bonsSauvegardes: ['reflexes', 'volonte'],          competencesParNiveau: 6, lanceurSorts: true,  caracteristiqueSorts: 'charisme',      niveauMaxSorts: 6 },
  { nom: 'Druide',      de: 8,  bab: 'moyenne', bonsSauvegardes: ['vigueur', 'volonte'],           competencesParNiveau: 4, lanceurSorts: true,  caracteristiqueSorts: 'sagesse',       niveauMaxSorts: 9 },
  { nom: 'Ensorceleur', de: 4,  bab: 'faible',  bonsSauvegardes: ['volonte'],                     competencesParNiveau: 2, lanceurSorts: true,  caracteristiqueSorts: 'charisme',      niveauMaxSorts: 9 },
  { nom: 'Guerrier',    de: 10, bab: 'elevee',  bonsSauvegardes: ['vigueur'],                     competencesParNiveau: 2, lanceurSorts: false },
  { nom: 'Magicien',    de: 4,  bab: 'faible',  bonsSauvegardes: ['volonte'],                     competencesParNiveau: 2, lanceurSorts: true,  caracteristiqueSorts: 'intelligence',  niveauMaxSorts: 9 },
  { nom: 'Moine',       de: 8,  bab: 'moyenne', bonsSauvegardes: ['vigueur', 'reflexes', 'volonte'], competencesParNiveau: 4, lanceurSorts: false },
  { nom: 'Paladin',     de: 10, bab: 'elevee',  bonsSauvegardes: ['vigueur', 'volonte'],           competencesParNiveau: 2, lanceurSorts: true,  caracteristiqueSorts: 'sagesse',       niveauMaxSorts: 4 },
  { nom: 'Prêtre',      de: 8,  bab: 'moyenne', bonsSauvegardes: ['vigueur', 'volonte'],           competencesParNiveau: 2, lanceurSorts: true,  caracteristiqueSorts: 'sagesse',       niveauMaxSorts: 9 },
  { nom: 'Rôdeur',      de: 8,  bab: 'elevee',  bonsSauvegardes: ['vigueur', 'reflexes'],          competencesParNiveau: 6, lanceurSorts: true,  caracteristiqueSorts: 'sagesse',       niveauMaxSorts: 4 },
  { nom: 'Roublard',    de: 6,  bab: 'moyenne', bonsSauvegardes: ['reflexes'],                    competencesParNiveau: 8, lanceurSorts: false },
]

export function getClasseInfo(nom: string): ClasseInfo | undefined {
  return CLASSES_DND35.find(c => c.nom === nom) ?? PRESTIGE_CLASSES.find(c => c.nom === nom)
}

// Emplacements de sorts par jour (index = niveau de sort 0-9), selon classe et niveau de personnage
// Source : D&D 3.5 SRD. 0 = pas encore accessible.
const SLOTS_FULL_9: number[][] = [
  // niv0, niv1, niv2, niv3, niv4, niv5, niv6, niv7, niv8, niv9
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 0], // CL 1
  [4, 2, 0, 0, 0, 0, 0, 0, 0, 0], // CL 2
  [4, 2, 1, 0, 0, 0, 0, 0, 0, 0], // CL 3
  [4, 3, 2, 1, 0, 0, 0, 0, 0, 0], // CL 4
  [4, 3, 2, 2, 0, 0, 0, 0, 0, 0], // CL 5
  [4, 3, 3, 2, 1, 0, 0, 0, 0, 0], // CL 6
  [4, 4, 3, 2, 2, 0, 0, 0, 0, 0], // CL 7
  [4, 4, 3, 3, 2, 1, 0, 0, 0, 0], // CL 8
  [4, 4, 4, 3, 2, 2, 0, 0, 0, 0], // CL 9
  [4, 4, 4, 3, 3, 2, 1, 0, 0, 0], // CL 10
  [4, 4, 4, 4, 3, 2, 2, 0, 0, 0], // CL 11
  [4, 4, 4, 4, 3, 3, 2, 1, 0, 0], // CL 12
  [4, 4, 4, 4, 4, 3, 2, 2, 0, 0], // CL 13
  [4, 4, 4, 4, 4, 3, 3, 2, 1, 0], // CL 14
  [4, 4, 4, 4, 4, 4, 3, 2, 2, 0], // CL 15
  [4, 4, 4, 4, 4, 4, 3, 3, 2, 1], // CL 16
  [4, 4, 4, 4, 4, 4, 4, 3, 2, 2], // CL 17
  [4, 4, 4, 4, 4, 4, 4, 3, 3, 2], // CL 18
  [4, 4, 4, 4, 4, 4, 4, 4, 3, 3], // CL 19
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4], // CL 20
]

// Barde : lanceur de sorts profane jusqu'au niveau 6, accès décalé (1er niveau de sort au niveau 2)
const SLOTS_BARDE: number[][] = [
  [2, 0, 0, 0, 0, 0, 0], // CL 1
  [3, 1, 0, 0, 0, 0, 0], // CL 2
  [3, 2, 0, 0, 0, 0, 0], // CL 3
  [3, 3, 1, 0, 0, 0, 0], // CL 4
  [3, 3, 2, 0, 0, 0, 0], // CL 5
  [3, 3, 3, 1, 0, 0, 0], // CL 6
  [3, 3, 3, 2, 0, 0, 0], // CL 7
  [3, 3, 3, 3, 1, 0, 0], // CL 8
  [3, 3, 3, 3, 2, 0, 0], // CL 9
  [3, 3, 3, 3, 3, 1, 0], // CL 10
  [3, 3, 3, 3, 3, 2, 0], // CL 11
  [3, 3, 3, 3, 3, 3, 1], // CL 12
  [3, 3, 3, 3, 3, 3, 2], // CL 13
  [4, 3, 3, 3, 3, 3, 3], // CL 14
  [4, 4, 3, 3, 3, 3, 3], // CL 15
  [4, 4, 4, 3, 3, 3, 3], // CL 16
  [4, 4, 4, 4, 3, 3, 3], // CL 17
  [4, 4, 4, 4, 4, 3, 3], // CL 18
  [4, 4, 4, 4, 4, 4, 3], // CL 19
  [4, 4, 4, 4, 4, 4, 4], // CL 20
]

// Paladin / Rôdeur : accès à partir du niveau 4, uniquement niveaux 1-4
const SLOTS_DEMI_4: number[][] = [
  [0, 0, 0, 0], // CL 1-3 : pas de sorts
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [1, 0, 0, 0], // CL 4
  [1, 0, 0, 0], // CL 5
  [1, 0, 0, 0], // CL 6
  [1, 1, 0, 0], // CL 7
  [1, 1, 0, 0], // CL 8
  [2, 1, 1, 0], // CL 9
  [2, 1, 1, 0], // CL 10
  [2, 1, 1, 1], // CL 11
  [2, 2, 1, 1], // CL 12
  [2, 2, 2, 1], // CL 13
  [2, 2, 2, 1], // CL 14
  [3, 2, 2, 2], // CL 15
  [3, 3, 2, 2], // CL 16
  [3, 3, 3, 2], // CL 17
  [3, 3, 3, 3], // CL 18
  [4, 3, 3, 3], // CL 19
  [4, 4, 4, 4], // CL 20
]

export function getSortsSlotsParJour(classe: string, niveau: number): number[] {
  const idx = Math.min(Math.max(niveau, 1), 20) - 1
  if (classe === 'Barde') return SLOTS_BARDE[idx] ?? []
  if (classe === 'Paladin' || classe === 'Rôdeur') return SLOTS_DEMI_4[idx] ?? []
  const info = getClasseInfo(classe)
  if (!info?.lanceurSorts) return []
  return SLOTS_FULL_9[idx] ?? []
}

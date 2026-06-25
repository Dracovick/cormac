import type { BabProgression } from './rules'

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
  return CLASSES_DND35.find(c => c.nom === nom)
}

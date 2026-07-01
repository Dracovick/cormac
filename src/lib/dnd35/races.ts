export interface RaceInfo {
  nom: string
  bonusFor: number; bonusDex: number; bonusCon: number
  bonusInt: number; bonusSag: number; bonusCha: number
  deplacement: number
  visionNocturne: boolean
  classePreferee: string  // 'any' pour Humain/Demi-Elfe, nom de classe sinon
}

export const RACES_DND35: RaceInfo[] = [
  { nom: 'Humain',     bonusFor: 0,  bonusDex: 0,  bonusCon: 0,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 9, visionNocturne: false, classePreferee: 'any' },
  { nom: 'Elfe',       bonusFor: 0,  bonusDex: 2,  bonusCon: -2, bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 9, visionNocturne: true,  classePreferee: 'Magicien' },
  { nom: 'Nain',       bonusFor: 0,  bonusDex: 0,  bonusCon: 2,  bonusInt: 0,  bonusSag: 0,  bonusCha: -2, deplacement: 6, visionNocturne: true,  classePreferee: 'Guerrier' },
  { nom: 'Halfelin',   bonusFor: -2, bonusDex: 2,  bonusCon: 0,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 6, visionNocturne: false, classePreferee: 'Roublard' },
  { nom: 'Gnome',      bonusFor: -2, bonusDex: 0,  bonusCon: 2,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 6, visionNocturne: true,  classePreferee: 'Barde' },
  { nom: 'Demi-Elfe',  bonusFor: 0,  bonusDex: 0,  bonusCon: 0,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 9, visionNocturne: true,  classePreferee: 'any' },
  { nom: 'Demi-Orque', bonusFor: 2,  bonusDex: 0,  bonusCon: 0,  bonusInt: -2, bonusSag: 0,  bonusCha: -2, deplacement: 9, visionNocturne: true,  classePreferee: 'Barbare' },
]

export function getRaceInfo(nom: string): RaceInfo | undefined {
  return RACES_DND35.find(r => r.nom === nom)
}

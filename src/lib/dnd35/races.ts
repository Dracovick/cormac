export interface RaceInfo {
  nom: string
  bonusFor: number; bonusDex: number; bonusCon: number
  bonusInt: number; bonusSag: number; bonusCha: number
  deplacement: number
  visionNocturne: boolean
}

export const RACES_DND35: RaceInfo[] = [
  { nom: 'Humain',    bonusFor: 0,  bonusDex: 0,  bonusCon: 0,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 9, visionNocturne: false },
  { nom: 'Elfe',      bonusFor: 0,  bonusDex: 2,  bonusCon: -2, bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 9, visionNocturne: true  },
  { nom: 'Nain',      bonusFor: 0,  bonusDex: 0,  bonusCon: 2,  bonusInt: 0,  bonusSag: 0,  bonusCha: -2, deplacement: 6, visionNocturne: true  },
  { nom: 'Halfelin',  bonusFor: -2, bonusDex: 2,  bonusCon: 0,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 6, visionNocturne: false },
  { nom: 'Gnome',     bonusFor: -2, bonusDex: 0,  bonusCon: 2,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 6, visionNocturne: true  },
  { nom: 'Demi-Elfe', bonusFor: 0,  bonusDex: 0,  bonusCon: 0,  bonusInt: 0,  bonusSag: 0,  bonusCha: 0,  deplacement: 9, visionNocturne: true  },
  { nom: 'Demi-Orc',  bonusFor: 2,  bonusDex: 0,  bonusCon: 0,  bonusInt: -2, bonusSag: 0,  bonusCha: -2, deplacement: 9, visionNocturne: true  },
]

export function getRaceInfo(nom: string): RaceInfo | undefined {
  return RACES_DND35.find(r => r.nom === nom)
}

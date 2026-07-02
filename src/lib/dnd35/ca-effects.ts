// Sorts D&D 3.5 qui modifient la classe d'armure.
// Le temps de jeu ne correspond pas au temps réel : le joueur active et retire
// lui-même chaque effet sur sa fiche. La durée est affichée à titre de rappel.

export type TypeBonusCA =
  | 'armure'
  | 'bouclier'
  | 'parade'
  | 'armure naturelle'
  | 'esquive'
  | 'caractéristique (DEX)'
  | 'taille'
  | 'divers'

export type EffetCACatalogue = {
  nom: string
  typeBonus: TypeBonusCA
  valeur: number
  valeurMax?: number // si le bonus varie selon le niveau du lanceur
  progression?: 'bouclier-foi' | 'peau-ecorce' // formule de progression PHB 3.5
  duree: string
  note?: string
}

// Bonus effectif selon le niveau du lanceur (PHB 3.5)
export function valeurEffetSelonNiveau(effet: EffetCACatalogue, niveauLanceur: number): number {
  const max = effet.valeurMax ?? effet.valeur
  if (effet.progression === 'bouclier-foi') {
    // +2, +1 par 6 niveaux de lanceur (max +5 au 18e)
    return Math.min(max, 2 + Math.floor(niveauLanceur / 6))
  }
  if (effet.progression === 'peau-ecorce') {
    // +2, +1 par 3 niveaux au-delà du 3e (max +5 au 12e)
    return Math.min(max, 2 + Math.max(0, Math.floor((niveauLanceur - 3) / 3)))
  }
  return effet.valeur
}

// PHB 3.5 : les bonus de même type ne se cumulent pas (on garde le meilleur),
// sauf les bonus d'esquive (et « divers ») qui se cumulent toujours.
export const TYPES_CUMULABLES: TypeBonusCA[] = ['esquive', 'divers']

export const TYPES_BONUS_CA: TypeBonusCA[] = [
  'armure', 'bouclier', 'parade', 'armure naturelle', 'esquive', 'caractéristique (DEX)', 'taille', 'divers',
]

export const SORTS_EFFETS_CA: EffetCACatalogue[] = [
  { nom: 'Armure de mage',           typeBonus: 'armure',              valeur: 4,               duree: '1 h/niveau',      note: 'Ne se cumule pas avec une armure portée (le meilleur bonus s\'applique).' },
  { nom: 'Bouclier',                 typeBonus: 'bouclier',            valeur: 4,               duree: '1 min/niveau',    note: 'Ne se cumule pas avec un bouclier porté.' },
  { nom: 'Bouclier de la foi',       typeBonus: 'parade',              valeur: 2, valeurMax: 5, progression: 'bouclier-foi', duree: '1 min/niveau',   note: '+2, +1 par 6 niveaux de lanceur au-delà du 1er (max +5).' },
  { nom: 'Protection contre le Mal', typeBonus: 'parade',              valeur: 2,               duree: '1 min/niveau',    note: 'Contre les attaques des créatures mauvaises seulement.' },
  { nom: 'Peau d\'écorce',           typeBonus: 'armure naturelle',    valeur: 2, valeurMax: 5, progression: 'peau-ecorce', duree: '10 min/niveau',   note: '+2, +1 par 3 niveaux de lanceur au-delà du 3e (max +5 au 12e).' },
  { nom: 'Grâce du chat',            typeBonus: 'caractéristique (DEX)', valeur: 2,             duree: '1 min/niveau',    note: '+4 DEX = +2 CA. Limité par le max DEX de l\'armure portée.' },
  { nom: 'Grâce du félin',           typeBonus: 'caractéristique (DEX)', valeur: 2,             duree: '1 min/niveau',    note: '+4 DEX = +2 CA. Limité par le max DEX de l\'armure portée.' },
  { nom: 'Hâte',                     typeBonus: 'esquive',             valeur: 1,               duree: '1 round/niveau',  note: 'Bonus d\'esquive : se cumule avec tout.' },
  { nom: 'Rapetissement',            typeBonus: 'taille',              valeur: 1,               duree: '1 min/niveau',    note: 'Taille P : +1 CA et +1 attaque.' },
  { nom: 'Agrandissement',           typeBonus: 'taille',              valeur: -1,              duree: '1 min/niveau',    note: 'Taille G : −1 CA et −1 attaque.' },
]

export type EffetCAActif = { id: number; nom: string; typeBonus: string; valeur: number }

export type ContributionEffetCA = {
  id: number
  nom: string
  typeBonus: string
  valeur: number
  effective: number // ce que l'effet apporte réellement après règles de cumul
  remplacePar?: string // nom de la source qui rend l'effet inopérant (cumul)
}

// Applique les règles de cumul du PHB 3.5 :
// - même type de bonus → seul le meilleur compte (esquive et divers se cumulent)
// - type « armure » comparé au bonus d'armure portée, « bouclier » au bouclier porté
export function calculeBonusEffetsCA(
  effets: EffetCAActif[],
  equipement: { bonusArmurePortee: number; bonusBouclierPorte: number },
): { total: number; contributions: ContributionEffetCA[] } {
  const meilleurs = new Map<string, EffetCAActif>()
  for (const e of effets) {
    if (TYPES_CUMULABLES.includes(e.typeBonus as TypeBonusCA)) continue
    const best = meilleurs.get(e.typeBonus)
    if (!best || e.valeur > best.valeur) meilleurs.set(e.typeBonus, e)
  }

  const contributions: ContributionEffetCA[] = effets.map(e => {
    if (TYPES_CUMULABLES.includes(e.typeBonus as TypeBonusCA)) {
      return { id: e.id, nom: e.nom, typeBonus: e.typeBonus, valeur: e.valeur, effective: e.valeur }
    }
    const best = meilleurs.get(e.typeBonus)
    if (best && best.id !== e.id) {
      return { id: e.id, nom: e.nom, typeBonus: e.typeBonus, valeur: e.valeur, effective: 0, remplacePar: best.nom }
    }
    // Le meilleur de son type : comparé à l'équipement porté pour armure/bouclier
    if (e.typeBonus === 'armure' && equipement.bonusArmurePortee >= e.valeur) {
      return { id: e.id, nom: e.nom, typeBonus: e.typeBonus, valeur: e.valeur, effective: 0, remplacePar: 'armure portée' }
    }
    if (e.typeBonus === 'armure' && equipement.bonusArmurePortee > 0) {
      return { id: e.id, nom: e.nom, typeBonus: e.typeBonus, valeur: e.valeur, effective: e.valeur - equipement.bonusArmurePortee }
    }
    if (e.typeBonus === 'bouclier' && equipement.bonusBouclierPorte >= e.valeur) {
      return { id: e.id, nom: e.nom, typeBonus: e.typeBonus, valeur: e.valeur, effective: 0, remplacePar: 'bouclier porté' }
    }
    if (e.typeBonus === 'bouclier' && equipement.bonusBouclierPorte > 0) {
      return { id: e.id, nom: e.nom, typeBonus: e.typeBonus, valeur: e.valeur, effective: e.valeur - equipement.bonusBouclierPorte }
    }
    return { id: e.id, nom: e.nom, typeBonus: e.typeBonus, valeur: e.valeur, effective: e.valeur }
  })

  return { total: contributions.reduce((sum, c) => sum + c.effective, 0), contributions }
}

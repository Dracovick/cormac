// Sorts D&D 3.5 qui modifient temporairement la CA ou une caractéristique.
// Le temps de jeu ne correspond pas au temps réel : l'effet s'active quand le
// joueur lance le sort préparé (bouton « préparé ▶ ») et c'est lui qui le
// retire (✕) quand le sort prend fin. La durée est affichée à titre de rappel.

export type Caracteristique = 'FOR' | 'DEX' | 'CON' | 'INT' | 'SAG' | 'CHA'
export type CibleEffet = 'CA' | Caracteristique

export type TypeBonusCA =
  | 'armure'
  | 'bouclier'
  | 'parade'
  | 'armure naturelle'
  | 'esquive'
  | 'taille'
  | 'intuition'
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

export type EffetCaracCatalogue = {
  nom: string
  carac: Caracteristique
  valeur: number
  typeBonus: string // 'amélioration' pour les sorts classiques (ne se cumule pas)
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
export const TYPES_CUMULABLES: string[] = ['esquive', 'divers']

export const SORTS_EFFETS_CA: EffetCACatalogue[] = [
  { nom: 'Armure de mage',           typeBonus: 'armure',           valeur: 4,               duree: '1 h/niveau',      note: 'Ne se cumule pas avec une armure portée (le meilleur bonus s\'applique).' },
  { nom: 'Bouclier',                 typeBonus: 'bouclier',         valeur: 4,               duree: '1 min/niveau',    note: 'Ne se cumule pas avec un bouclier porté.' },
  { nom: 'Bouclier de la foi',       typeBonus: 'parade',           valeur: 2, valeurMax: 5, progression: 'bouclier-foi', duree: '1 min/niveau',   note: '+2, +1 par 6 niveaux de lanceur au-delà du 1er (max +5).' },
  { nom: 'Protection contre le Mal', typeBonus: 'parade',           valeur: 2,               duree: '1 min/niveau',    note: 'Contre les attaques des créatures mauvaises seulement.' },
  { nom: 'Peau d\'écorce',           typeBonus: 'armure naturelle', valeur: 2, valeurMax: 5, progression: 'peau-ecorce', duree: '10 min/niveau',   note: '+2, +1 par 3 niveaux de lanceur au-delà du 3e (max +5 au 12e).' },
  { nom: 'Hâte',                     typeBonus: 'esquive',          valeur: 1,               duree: '1 round/niveau',  note: 'Bonus d\'esquive : se cumule avec tout.' },
  { nom: 'Rapetissement',            typeBonus: 'taille',           valeur: 1,               duree: '1 min/niveau',    note: 'Taille P : +1 CA et +1 attaque.' },
  { nom: 'Agrandissement',           typeBonus: 'taille',           valeur: -1,              duree: '1 min/niveau',    note: 'Taille G : −1 CA et −1 attaque.' },
  { nom: 'Vision du futur',          typeBonus: 'intuition',        valeur: 2,               duree: '10 min/niveau',   note: '+2 aussi aux attaques et sauvegardes ; ne peut pas être surpris.' },
]

// Sorts d'amélioration de caractéristique (+4 amélioration, PHB 3.5).
// Le bonus se propage partout : mod de carac, CA (DEX), attaques, sauvegardes, compétences…
export const SORTS_EFFETS_CARAC: EffetCaracCatalogue[] = [
  { nom: 'Force de taureau',       carac: 'FOR', valeur: 4, typeBonus: 'amélioration', duree: '1 min/niveau', note: 'Attaque au corps à corps, dégâts, compétences de Force.' },
  { nom: 'Grâce du chat',          carac: 'DEX', valeur: 4, typeBonus: 'amélioration', duree: '1 min/niveau', note: 'CA (limitée par le max DEX de l\'armure), initiative, Réflexes, attaque à distance.' },
  { nom: 'Grâce du félin',         carac: 'DEX', valeur: 4, typeBonus: 'amélioration', duree: '1 min/niveau', note: 'CA (limitée par le max DEX de l\'armure), initiative, Réflexes, attaque à distance.' },
  { nom: 'Endurance de l\'ours',   carac: 'CON', valeur: 4, typeBonus: 'amélioration', duree: '1 min/niveau', note: 'Vigueur et Constitution. Les PV ne sont pas ajustés automatiquement (+2/niveau à gérer avec ✚).' },
  { nom: 'Ruse du renard',         carac: 'INT', valeur: 4, typeBonus: 'amélioration', duree: '1 min/niveau', note: 'Compétences d\'Intelligence.' },
  { nom: 'Sagesse du hibou',       carac: 'SAG', valeur: 4, typeBonus: 'amélioration', duree: '1 min/niveau', note: 'Volonté et compétences de Sagesse.' },
  { nom: 'Splendeur de l\'aigle',  carac: 'CHA', valeur: 4, typeBonus: 'amélioration', duree: '1 min/niveau', note: 'Compétences de Charisme.' },
]

// Sorts à effet purement visuel sur le portrait (aucune statistique modifiée).
// cible en DB : 'VISUEL', typeBonus : nom de l'effet visuel.
export type EffetVisuel = 'halo' | 'pierre' | 'feu' | 'invisible'

export type EffetVisuelCatalogue = {
  nom: string
  effet: EffetVisuel
  duree: string
  note?: string
}

export const SORTS_EFFETS_VISUELS: EffetVisuelCatalogue[] = [
  { nom: 'Lumière',              effet: 'halo',      duree: '10 min/niveau',    note: 'L\'objet touché brille comme une torche (9 m de rayon).' },
  { nom: 'Lumière du jour',      effet: 'halo',      duree: '10 min/niveau',    note: 'Lumière aussi brillante que le plein jour (18 m de rayon).' },
  { nom: 'Peau de pierre',       effet: 'pierre',    duree: '10 min/niveau',    note: 'Réduction de dégâts 10/adamantine (max 150 points absorbés).' },
  { nom: 'Bouclier de feu',      effet: 'feu',       duree: '1 round/niveau',   note: 'Qui vous frappe au corps à corps subit 1d6+1/niv dégâts de feu (ou de froid).' },
  { nom: 'Invisibilité',         effet: 'invisible', duree: '1 min/niveau',     note: 'Invisible jusqu\'à ce que vous attaquiez.' },
  { nom: 'Invisibilité totale',  effet: 'invisible', duree: '1 min/niveau',     note: 'Invisible même en attaquant.' },
]

// Sorts lançables sur soi-même avec une durée : suivi seulement (aucune statistique
// modifiée automatiquement — la note rappelle l'effet). cible en DB : 'SUIVI',
// sauf indication (ex. Repli expéditif → cible 'DEPL', +9 m au déplacement affiché).
export type EffetSuiviCatalogue = {
  nom: string
  duree: string
  note: string
  cible?: 'DEPL'
  valeur?: number
}

export const SORTS_EFFETS_SUIVI: EffetSuiviCatalogue[] = [
  // Niveau 0
  { nom: 'Résistance',                     duree: '1 minute',        note: '+1 aux jets de sauvegarde.' },
  { nom: 'Vertu',                          duree: '1 minute',        note: '+1 point de vie temporaire.' },
  { nom: 'Guidage',                        duree: '1 minute',        note: '+1 au prochain test de compétence ou jet d\'attaque.' },
  { nom: 'Sauvegarde contre le feu',       duree: '10 min/niveau',   note: 'Réduit les dégâts de feu non magique.' },
  // Niveau 1
  { nom: 'Repli expéditif',                duree: '1 min/niveau',    note: 'Déplacement augmenté de 9 m.', cible: 'DEPL', valeur: 9 },
  { nom: 'Compréhension des langages',     duree: '10 min/niveau',   note: 'Comprend toutes les langues écrites et parlées.' },
  { nom: 'Faveur divine',                  duree: '1 minute',        note: '+1 aux attaques et dégâts par 3 niveaux (max +3).' },
  { nom: 'Sanctuaire',                     duree: '1 round/niveau',  note: 'Les adversaires doivent réussir un JS Volonté pour vous attaquer.' },
  { nom: 'Bénédiction',                    duree: '1 min/niveau',    note: '+1 attaques et JS contre la peur (vous et vos alliés à 15 m).' },
  // Niveau 2
  { nom: 'Image miroir',                   duree: '1 min/niveau',    note: '1d4+1 doubles illusoires — chaque attaque ratée en détruit un.' },
  { nom: 'Résistance aux énergies',        duree: '10 min/niveau',   note: 'Résistance 10 à un type d\'énergie choisi.' },
  { nom: 'Vision dans le noir',            duree: '1 h/niveau',      note: 'Vision dans le noir jusqu\'à 18 m.' },
  { nom: 'Sens de la nature',              duree: '1 min/niveau',    note: 'Perception animaux/plantes à 9 m, +4 aux tests d\'initiative.' },
  { nom: 'Lame de feu',                    duree: '1 min/niveau',    note: 'Lame enflammée en main : 1d8 + ½ niveau dégâts de feu.' },
  { nom: 'Aide',                           duree: '1 min/niveau',    note: '+1 attaques, +1 JS contre la peur, +1d8 PV temporaires.' },
  // Niveau 3
  { nom: 'Vol',                            duree: '1 min/niveau',    note: 'Vole à 18 m/round (bonne manœuvrabilité).' },
  { nom: 'Forme gazeuse',                  duree: '2 min/niveau',    note: 'Corps gazeux : immunité à la plupart des attaques, déplacement 3 m.' },
  { nom: 'Respiration aquatique',          duree: '2 h/niveau',      note: 'Respire sous l\'eau comme à l\'air libre.' },
  { nom: 'Vision magique',                 duree: '1 min/niveau',    note: 'Voit les auras magiques, leurs écoles et intensités.' },
  { nom: 'Protection contre les énergies', duree: '10 min/niveau',   note: 'Absorbe jusqu\'à 12 points de dégâts/niveau d\'un type d\'énergie.' },
  { nom: 'Prière',                         duree: '1 round/niveau',  note: '+1 attaques/dégâts/comp./JS pour vous et vos alliés ; −1 pour les ennemis.' },
  // Niveau 4
  { nom: 'Globe d\'invulnérabilité mineur', duree: '1 round/niveau', note: 'Bloque les sorts de niveau 1 à 3.' },
  { nom: 'Liberté de mouvement',           duree: '10 min/niveau',   note: 'Se déplace normalement malgré entraves magiques ou naturelles.' },
  { nom: 'Immunité aux énergies',          duree: '24 heures',       note: 'Immunité totale à un type d\'énergie choisi.' },
  { nom: 'Métamorphose',                   duree: '1 min/niveau',    note: 'Transformé en une autre créature (pouvoirs, FOR/DEX/CON selon la forme).' },
  // Niveau 6+
  { nom: 'Globe d\'invulnérabilité',       duree: '1 round/niveau',  note: 'Bloque les sorts de niveau 1 à 4.' },
  { nom: 'Festin des héros',               duree: '12 heures',       note: 'Immunité peur et poison, +1 morale attaques/JS, +2d8 PV temporaires.' },
  { nom: 'Régénération',                   duree: '1 min/niveau',    note: 'Régénère 1 PV/round, repousse les membres coupés.' },
  { nom: 'Sphère prismatique',             duree: '10 min/niveau',   note: 'Sphère de 7 couches colorées protégeant contre tout.' },
]

export type EffetSortActif = { id: number; nom: string; cible: string; typeBonus: string; valeur: number }

export type ContributionEffet = {
  id: number
  nom: string
  cible: string
  typeBonus: string
  valeur: number
  effective: number // ce que l'effet apporte réellement après règles de cumul
  remplacePar?: string // nom de la source qui rend l'effet inopérant (cumul)
}

// Applique les règles de cumul du PHB 3.5 aux effets sur la CA :
// - même type de bonus → seul le meilleur compte (esquive et divers se cumulent)
// - type « armure » comparé au bonus d'armure portée, « bouclier » au bouclier porté
export function calculeBonusEffetsCA(
  effets: EffetSortActif[],
  equipement: { bonusArmurePortee: number; bonusBouclierPorte: number },
): { total: number; contributions: ContributionEffet[] } {
  const meilleurs = new Map<string, EffetSortActif>()
  for (const e of effets) {
    if (TYPES_CUMULABLES.includes(e.typeBonus)) continue
    const best = meilleurs.get(e.typeBonus)
    if (!best || e.valeur > best.valeur) meilleurs.set(e.typeBonus, e)
  }

  const contributions: ContributionEffet[] = effets.map(e => {
    const base = { id: e.id, nom: e.nom, cible: e.cible, typeBonus: e.typeBonus, valeur: e.valeur }
    if (TYPES_CUMULABLES.includes(e.typeBonus)) {
      return { ...base, effective: e.valeur }
    }
    const best = meilleurs.get(e.typeBonus)
    if (best && best.id !== e.id) {
      return { ...base, effective: 0, remplacePar: best.nom }
    }
    // Le meilleur de son type : comparé à l'équipement porté pour armure/bouclier
    if (e.typeBonus === 'armure' && equipement.bonusArmurePortee > 0) {
      return equipement.bonusArmurePortee >= e.valeur
        ? { ...base, effective: 0, remplacePar: 'armure portée' }
        : { ...base, effective: e.valeur - equipement.bonusArmurePortee }
    }
    if (e.typeBonus === 'bouclier' && equipement.bonusBouclierPorte > 0) {
      return equipement.bonusBouclierPorte >= e.valeur
        ? { ...base, effective: 0, remplacePar: 'bouclier porté' }
        : { ...base, effective: e.valeur - equipement.bonusBouclierPorte }
    }
    return { ...base, effective: e.valeur }
  })

  return { total: contributions.reduce((sum, c) => sum + c.effective, 0), contributions }
}

export type BonusCaracs = Record<Caracteristique, number>

// Applique les règles de cumul aux effets de caractéristiques :
// même caractéristique + même type de bonus → seul le meilleur compte
// (deux Force de taureau ne se cumulent pas), « divers » se cumule.
export function calculeBonusEffetsCarac(
  effets: EffetSortActif[],
): { bonus: BonusCaracs; contributions: ContributionEffet[] } {
  const bonus: BonusCaracs = { FOR: 0, DEX: 0, CON: 0, INT: 0, SAG: 0, CHA: 0 }
  const meilleurs = new Map<string, EffetSortActif>() // clé : carac|typeBonus
  for (const e of effets) {
    if (TYPES_CUMULABLES.includes(e.typeBonus)) continue
    const cle = `${e.cible}|${e.typeBonus}`
    const best = meilleurs.get(cle)
    if (!best || e.valeur > best.valeur) meilleurs.set(cle, e)
  }

  const contributions: ContributionEffet[] = effets.map(e => {
    const base = { id: e.id, nom: e.nom, cible: e.cible, typeBonus: e.typeBonus, valeur: e.valeur }
    if (!TYPES_CUMULABLES.includes(e.typeBonus)) {
      const best = meilleurs.get(`${e.cible}|${e.typeBonus}`)
      if (best && best.id !== e.id) {
        return { ...base, effective: 0, remplacePar: best.nom }
      }
    }
    return { ...base, effective: e.valeur }
  })

  for (const c of contributions) {
    if (c.cible in bonus) bonus[c.cible as Caracteristique] += c.effective
  }
  return { bonus, contributions }
}

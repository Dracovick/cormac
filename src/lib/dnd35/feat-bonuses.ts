export interface BonusItem {
  label: string
  value: number
  conditional?: string
}

function normalizeWeaponName(nom: string): string {
  return nom.toLowerCase().replace(/\s*[+\-]\d+/g, '').replace(/\s+/g, ' ').trim()
}

function extractFeatTarget(featNom: string): string | null {
  const m = featNom.match(/\(([^)]+)\)\s*$/i)
  return m ? normalizeWeaponName(m[1]) : null
}

function weaponMatches(weaponNom: string, target: string): boolean {
  return normalizeWeaponName(weaponNom) === target
}

/**
 * Retourne les bonus d'attaque et de dégâts issus des dons pour une arme donnée.
 * Dons reconnus (noms français D&D 3.5) :
 *   - Arme de prédilection (arme)     → +1 attaque
 *   - Maîtrise martiale supérieure (arme) → +1 attaque supplémentaire
 *   - Spécialisation martiale (arme)   → +2 dégâts
 *   - Spécialisation martiale supérieure (arme) → +2 dégâts supplémentaires
 *   - Tir à bout portant               → +1 attaque et dégâts (portée ≤9m, armes à distance)
 */
export function getFeatWeaponBonuses(
  featNames: string[],
  weaponNom: string,
  isRanged: boolean
): { attackItems: BonusItem[]; damageItems: BonusItem[] } {
  const attackItems: BonusItem[] = []
  const damageItems: BonusItem[] = []

  for (const nom of featNames) {
    const target  = extractFeatTarget(nom)
    const applies = target ? weaponMatches(weaponNom, target) : false

    if (/^arme de prédilection/i.test(nom) && applies) {
      attackItems.push({ label: 'Préd.', value: 1 })
    }
    if (/^maîtrise martiale supérieure/i.test(nom) && applies) {
      attackItems.push({ label: 'Maîtr. sup.', value: 1 })
    }
    if (/^spécialisation martiale supérieure/i.test(nom) && applies) {
      damageItems.push({ label: 'Spéc. sup.', value: 2 })
    } else if (/^spécialisation martiale/i.test(nom) && applies) {
      damageItems.push({ label: 'Spéc.', value: 2 })
    }
    if (/tir à bout portant/i.test(nom) && isRanged) {
      attackItems.push({ label: 'TBP', value: 1, conditional: '≤9m' })
      damageItems.push({ label: 'TBP', value: 1, conditional: '≤9m' })
    }
  }

  return { attackItems, damageItems }
}

/**
 * Bonus passifs issus des dons, comptés automatiquement dans la fiche.
 * Les noms de dons sont du texte libre importé de FileMaker : chaque règle
 * reconnaît les variantes françaises (officielles et maisons) et anglaises.
 */
export interface PassiveFeatBonuses {
  initiative: BonusItem[]
  vigueur: BonusItem[]
  reflexes: BonusItem[]
  volonte: BonusItem[]
  /** Bonus de CA conditionnels (Esquive, Mobilité) — affichés mais JAMAIS comptés dans le total */
  caConditionnelle: BonusItem[]
  /** Bonus de compétences (Vigilance : +2 Détection et Perception auditive) */
  competences: { skillNoms: string[]; item: BonusItem }[]
  /** Robustesse : +3 pv — informatif seulement (le pv max de la fiche est saisi à la main) */
  pv: BonusItem[]
}

/** Extrait un « +N » explicite du nom du don (ex. « Improved initiative +5 ») */
function bonusExplicite(nom: string, defaut: number): number {
  const m = nom.match(/\+\s*(\d+)/)
  return m ? parseInt(m[1], 10) : defaut
}

export function getFeatPassiveBonuses(featNames: string[]): PassiveFeatBonuses {
  const r: PassiveFeatBonuses = {
    initiative: [], vigueur: [], reflexes: [], volonte: [],
    caConditionnelle: [], competences: [], pv: [],
  }
  // Un même don entré deux fois (doublon d'import) ne compte qu'une fois.
  const vus = new Set<string>()
  const unefois = (cle: string) => !vus.has(cle) && (vus.add(cle), true)

  for (const nom of featNames) {
    // Science de l'initiative (+4) — variantes : Improved Initiative, Initiative améliorée, Sens de l'initiative
    if (/science de l.initiative|improved initiative|initiative am[ée]lior|sens de l.initiative/i.test(nom) && unefois('init'))
      r.initiative.push({ label: "don : Science de l'initiative", value: bonusExplicite(nom, 4) })

    // Vigueur surhumaine (+2 Vigueur) — variantes : Great Fortitude, Grande résistance (vieille traduction)
    if (/vigueur surhumaine|great fortitude|grande r[ée]sistance/i.test(nom) && unefois('vig'))
      r.vigueur.push({ label: 'don : Vigueur surhumaine', value: 2 })

    // Réflexes surhumains (+2 Réflexes) — variantes : Lightning Reflexes (et sa coquille « Ligthning »), Réflexes surnaturels
    if (/r[ée]flexes surhumains|li(gh|g)t?h?ning reflexes|r[ée]flexes surnaturels/i.test(nom) && unefois('ref'))
      r.reflexes.push({ label: 'don : Réflexes surhumains', value: 2 })

    // Volonté de fer (+2 Volonté) — variante : Iron Will
    if (/volont[ée] de fer|iron will/i.test(nom) && unefois('vol'))
      r.volonte.push({ label: 'don : Volonté de fer', value: 2 })

    // Esquive (+1 CA contre UN adversaire choisi) — conditionnel, jamais dans le total.
    // Exclusions : Esquive instinctive/totale/surnaturelle (capacités de classe) et la
    // variante « jet de réflexe » (Esquive totale mal nommée).
    if (/^(esquive|dodge)\b/i.test(nom)
        && !/instinctive|totale?|surnaturelle|r[ée]flexe/i.test(nom)
        && unefois('esquive'))
      r.caConditionnelle.push({ label: 'don : Esquive', value: 1, conditional: 'contre un adversaire choisi en début de round — à ajouter à la main' })

    // Mobilité (+4 CA contre les attaques d'opportunité de déplacement) — conditionnel
    if (/mobilit[ée]|mobility/i.test(nom) && unefois('mobilite'))
      r.caConditionnelle.push({ label: 'don : Mobilité', value: bonusExplicite(nom, 4), conditional: 'contre les attaques d’opportunité provoquées par le déplacement' })

    // Vigilance (+2 Détection et Perception auditive) — variante : Alertness.
    // Exclusion : « Vigilance (Familier) » — actif seulement à portée de bras du familier.
    if (/^(vigil[ae]nce|alertness)\b/i.test(nom) && !/famil/i.test(nom) && unefois('vigilance'))
      r.competences.push({ skillNoms: ['Détection', 'Perception auditive'], item: { label: 'don : Vigilance', value: 2 } })

    // Robustesse (+3 pv) — variantes : Toughness, Dur à cuire
    if (/^robustesse|toughness|dur [àa] cuire/i.test(nom) && unefois('pv'))
      r.pv.push({ label: 'don : Robustesse', value: 3 })
  }
  return r
}

export const sommeBonus = (items: BonusItem[]) => items.reduce((s, b) => s + b.value, 0)

/**
 * Génère une phrase descriptive pour les dons dont le nom suit un pattern reconnu.
 * Utilisé en fallback quand effetMecanique n'est pas stocké en base.
 */
export function getFeatDescription(featNom: string): string | null {
  const target = extractFeatTarget(featNom)
  const arme = target ? target.replace(/\b\w/g, c => c.toUpperCase()) : null

  if (/^arme de prédilection/i.test(featNom) && arme)
    return `+1 aux jets d'attaque avec ${arme}`
  if (/^maîtrise martiale supérieure/i.test(featNom) && arme)
    return `+1 attaque supplémentaire avec ${arme} (2ème attaque dès BAB +1)`
  if (/^spécialisation martiale supérieure/i.test(featNom) && arme)
    return `+2 aux dégâts supplémentaires avec ${arme}`
  if (/^spécialisation martiale/i.test(featNom) && arme)
    return `+2 aux dégâts avec ${arme}`
  if (/^tir à bout portant/i.test(featNom))
    return '+1 attaque et dégâts avec les armes à distance à portée ≤ 9 m'
  if (/^tir de précision/i.test(featNom))
    return 'Attaque supplémentaire à −2 avec une arme à distance par round'
  if (/^tir en mêlée/i.test(featNom))
    return 'Pas de malus en mêlée pour les attaques à distance'
  if (/^attaque en puissance/i.test(featNom))
    return 'Échange jusqu\'à −5 en attaque contre +5 aux dégâts'
  if (/^combat à deux armes/i.test(featNom))
    return 'Réduit les malus pour combattre avec deux armes'
  if (/^esquive/i.test(featNom))
    return '+1 à la CA contre un adversaire choisi en début de round'
  if (/^robustesse/i.test(featNom))
    return '+3 points de vie'
  if (/^science de l'initiative/i.test(featNom) || /^science de l'initiative/i.test(featNom))
    return '+4 à l\'initiative'
  if (/^vigilance/i.test(featNom))
    return '+2 aux jets de Détection et Psychologie'
  if (/^endurance/i.test(featNom))
    return '+4 aux tests de Constitution pour les actions prolongées'
  if (/^frappe précise/i.test(featNom))
    return 'Ignore le bonus de bouclier et d\'armure avec une attaque de base'

  return null
}

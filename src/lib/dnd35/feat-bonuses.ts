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

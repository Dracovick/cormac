/**
 * Le calcul d'ATTAQUE et de DÉGÂTS d'une ligne d'arme, en un seul endroit.
 *
 * Deux pages affichent ce bloc — l'écran (`/personnage/[id]`) et la feuille
 * imprimée (`/personnage/[id]/imprimer`). Elles le calculaient chacune de leur
 * côté, et elles ne disaient pas la même chose : au 2026-10-10, le papier
 * ignorait les munitions magiques, les bonus de dons et tout modificateur de
 * dégâts (sa colonne Dégâts affichait le dé nu). Sur l'arc de Cormac, l'écran
 * disait +16/+11 et 1d8+9 là où le papier disait +12/+7 et 1d8.
 *
 * La duplication EST la cause de la divergence : les deux pages passent
 * désormais par `calculeArme`.
 *
 * ── La règle du non-cumul ────────────────────────────────────────────────────
 * SRD 3.5 VF, armes magiques, « Armes à distance et projectiles » :
 *
 *   « Le bonus d'altération d'une arme à projectiles ne se cumule pas avec le
 *     bonus d'altération de ses munitions. On ne tient compte que de la plus
 *     haute des deux valeurs. »
 *
 * Le Grimoire les additionnait. Même nature que le non-cumul des bonus de CA
 * (voir `classe-armure.ts`) : on garde le meilleur, et on dit lequel est écarté.
 *
 * ⚠ L'arme à projectiles n'est pas inutile pour autant quand ses munitions sont
 * meilleures : la même page du SRD précise qu'une munition tirée d'une arme à
 * +1 ou plus « est considérée comme une arme magique pour ce qui est d'ignorer
 * la réduction des dégâts », et qu'une munition tirée d'une arme alignée en
 * reçoit l'alignement. Le bonus ne se cumule pas ; la qualité magique, oui.
 */
import { getFeatWeaponBonuses } from './feat-bonuses'
import { estArmeADistance } from './weapons'

export type LigneBonus = {
  label: string
  valeur: number
  note?: string
  /** Écarté par le non-cumul : à afficher barré, et non compté dans le total. */
  ecarte?: boolean
}

/** Une contribution que la règle écarte, avec le motif — pour l'afficher barrée. */
export type BonusEcarte = { label: string; valeur: number; motif: string }

/** Libellés complets des bonus de dons (`feat-bonuses` rend des abrégés). */
const LABELS_DONS: Record<string, string> = {
  'Préd.': 'don : Arme de prédilection',
  'Maîtr. sup.': 'don : Maîtrise martiale sup.',
  'Spéc.': 'don : Spécialisation martiale',
  'Spéc. sup.': 'don : Spécialisation sup.',
  'TBP': 'don : Tir à bout portant',
}

/**
 * Le bonus d'altération retenu entre l'arme et ses munitions : le meilleur des
 * deux, jamais la somme. Hors arme à distance, les munitions ne jouent pas.
 */
export function alterationEffective(opts: {
  bonusArme: number
  bonusMunitions: number
  estADistance: boolean
}): { total: number; source: 'arme' | 'munitions'; ecarte: BonusEcarte | null } {
  const arme = opts.bonusArme
  const mun = opts.estADistance ? opts.bonusMunitions : 0

  if (mun === 0) return { total: arme, source: 'arme', ecarte: null }
  if (arme === 0) return { total: mun, source: 'munitions', ecarte: null }

  // Les deux sont non nuls : un des deux est écarté. À égalité on écarte les
  // munitions — le total est le même, et c'est l'arme qui porte le nom affiché.
  return mun > arme
    ? {
        total: mun,
        source: 'munitions',
        ecarte: {
          label: 'arme magique',
          valeur: arme,
          motif: `ne se cumule pas, les munitions +${mun} l'emportent`,
        },
      }
    : {
        total: arme,
        source: 'arme',
        ecarte: {
          label: 'munitions magiques',
          valeur: mun,
          motif: `ne se cumule pas, l'arme +${arme} l'emporte`,
        },
      }
}

/** « +13 / +8 / +3 » — une attaque de plus par palier de 5 du BAB brut. */
export function sequenceAttaques(total: number, bbaBrut: number): string {
  const seq = [total]
  if (bbaBrut >= 6) seq.push(total - 5)
  if (bbaBrut >= 11) seq.push(total - 10)
  if (bbaBrut >= 16) seq.push(total - 15)
  return seq.map(n => (n >= 0 ? `+${n}` : `${n}`)).join(' / ')
}

export type EntreeArme = {
  /** Nom de l'entrée d'arme, tel qu'en base (sert aussi à apparier les dons). */
  nom: string
  famille: string | null | undefined
  portee: number | null | undefined
  /** Dé de l'arme, « 1d8 ». Peut être nul sur une ligne d'inventaire. */
  degats: string | null | undefined
  /** Champ `bonus_magique` de la ligne d'inventaire. */
  bonusArme: number
  /** Champ `bonus_munitions` : flèches +2, carreaux +1… */
  bonusMunitions: number | null
  /** Côte de Force d'un arc composite : plafonne la FOR aux dégâts. */
  coteDeForce: number | null
  /** Noms des dons du personnage. */
  dons: string[]
  bbaBrutCorps: number
  bbaBrutDistance: number
  forMod: number
  dexMod: number
}

export type CalculArme = {
  estADistance: boolean
  bbaBrut: number
  /** Bonus d'altération retenu après le non-cumul. */
  alteration: number
  /** Total du premier jet d'attaque. */
  attaque: number
  /** « +13 / +8 ». */
  sequence: string
  /** Modificateur total aux dégâts. */
  degatsMod: number
  /** « 1d8+8 », ou le dé seul si aucun modificateur. */
  degatsTexte: string
  /** « Arc long composite (Force +3) +1 ». */
  nomAffiche: string
  attaqueLignes: LigneBonus[]
  degatsLignes: LigneBonus[]
  /** Contributions écartées par le non-cumul, à afficher barrées. */
  ecartes: BonusEcarte[]
}

export function calculeArme(e: EntreeArme): CalculArme {
  const estADistance = estArmeADistance(e.famille, e.portee)
  const bbaBrut = estADistance ? e.bbaBrutDistance : e.bbaBrutCorps
  const caracAtk = estADistance ? e.dexMod : e.forMod

  const { total: alteration, source, ecarte } = alterationEffective({
    bonusArme: e.bonusArme,
    bonusMunitions: e.bonusMunitions ?? 0,
    estADistance,
  })

  const { attackItems, damageItems } = getFeatWeaponBonuses(e.dons, e.nom, estADistance)
  const donsAtk = attackItems.reduce((s, b) => s + b.value, 0)
  const donsDmg = damageItems.reduce((s, b) => s + b.value, 0)

  // Dégâts : la FOR entière au corps à corps ; à distance, seulement l'arc
  // composite en donne, plafonnée par sa côte de Force.
  const estComposite = e.coteDeForce !== null || e.nom.toLowerCase().includes('composite')
  const caracDmg = !estADistance
    ? e.forMod
    : e.coteDeForce !== null
      ? Math.min(e.forMod, e.coteDeForce)
      : estComposite ? e.forMod : 0

  const attaque = bbaBrut + caracAtk + alteration + donsAtk
  const degatsMod = alteration + caracDmg + donsDmg
  const deArme = e.degats ?? '—'

  const ligneDon = (b: { label: string; value: number; conditional?: string }): LigneBonus => ({
    label: LABELS_DONS[b.label] ?? b.label,
    valeur: b.value,
    note: b.conditional ? `seulement à ${b.conditional}` : undefined,
  })
  const labelAlteration = source === 'munitions' ? 'munitions magiques' : 'arme magique'
  // Le joueur doit voir la pièce qu'il porte ET voir qu'elle ne compte pas.
  const ligneEcartee: LigneBonus[] = ecarte
    ? [{ label: ecarte.label, valeur: ecarte.valeur, note: ecarte.motif, ecarte: true }]
    : []

  return {
    estADistance,
    bbaBrut,
    alteration,
    attaque,
    sequence: sequenceAttaques(attaque, bbaBrut),
    degatsMod,
    degatsTexte: degatsMod === 0 ? deArme : `${deArme}${degatsMod > 0 ? '+' : ''}${degatsMod}`,
    nomAffiche: e.nom
      + (e.coteDeForce !== null ? ` (Force +${e.coteDeForce})` : '')
      + (e.bonusArme > 0 ? ` +${e.bonusArme}` : ''),
    attaqueLignes: [
      {
        label: 'bonus de base (BAB)',
        valeur: bbaBrut,
        note: bbaBrut >= 6
          ? 'BAB ≥ 6 : attaques multiples — la séquence vient du BAB seul (−5 chacune), tous les bonus s’appliquent à chaque attaque'
          : undefined,
      },
      { label: estADistance ? 'DEX' : 'FOR', valeur: caracAtk },
      ...(alteration > 0 ? [{ label: labelAlteration, valeur: alteration }] : []),
      ...ligneEcartee,
      ...attackItems.map(ligneDon),
    ],
    degatsLignes: [
      ...(caracDmg !== 0 ? [{
        label: estADistance ? 'FOR (arc composite)' : 'FOR',
        valeur: caracDmg,
        note: e.coteDeForce !== null && e.forMod > e.coteDeForce
          ? `FOR +${e.forMod} plafonnée par la côte de Force de l'arc (max +${e.coteDeForce})`
          : undefined,
      }] : []),
      ...(alteration > 0 ? [{ label: labelAlteration, valeur: alteration }] : []),
      ...ligneEcartee,
      ...damageItems.map(ligneDon),
    ],
    ecartes: ecarte ? [ecarte] : [],
  }
}

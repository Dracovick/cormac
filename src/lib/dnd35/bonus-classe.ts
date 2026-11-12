/**
 * Les bonus chiffrés que les POUVOIRS DE CLASSE apportent à la fiche.
 *
 * `feat-bonuses.ts` fait ce travail pour les dons. Un pouvoir de classe n'est
 * pas un don : il ne figure pas dans la liste des dons du personnage, donc rien
 * ne le ramassait. Le Bretteur de Guerriers & Harceleurs en a quatre qui
 * touchent des chiffres — c'est ce qui a motivé ce module.
 *
 * ⭐ Même principe que `dons-effets.ts` : ce fichier est la SOURCE des bonus,
 * et les marqueurs affichés sur la fiche en DÉRIVENT par les mêmes fonctions.
 * Une table écrite à côté finirait par annoncer un bonus que le calcul
 * n'applique pas.
 *
 * ── Les paliers, mesurés au niveau de la CLASSE, pas du personnage ───────────
 * Un Bretteur 2 / Roublard 8 a la Grâce +1, pas +2 : c'est son niveau de
 * Bretteur qui compte. Toutes les fonctions prennent donc le niveau de classe.
 */
import type { BonusItem } from './feat-bonuses'
import type { EffetDon } from './dons-effets'

export const NOM_BRETTEUR = 'Bretteur'

/** Niveau atteint dans une classe donnée, 0 si le personnage ne l'a pas. */
export function niveauDeClasse(
  classes: { nom: string; niveau: number }[],
  nomClasse: string,
): number {
  return classes
    .filter(c => c.nom === nomClasse)
    .reduce((max, c) => Math.max(max, c.niveau), 0)
}

/**
 * Grâce (Bretteur 2) : bonus de COMPÉTENCE aux jets de Réflexes.
 * +1 au niveau 2, +2 au niveau 11, +3 au niveau 20.
 */
export function graceBretteur(niveauBretteur: number): number {
  if (niveauBretteur >= 20) return 3
  if (niveauBretteur >= 11) return 2
  if (niveauBretteur >= 2) return 1
  return 0
}

/**
 * Bonus d'esquive (Bretteur 5) : +1 à la CA contre les attaques de corps à
 * corps d'UN adversaire désigné pendant son action. +1 par palier de cinq
 * niveaux ensuite (+2 au 10e, +3 au 15e, +4 au 20e).
 *
 * ⛔ Conditionnel : il ne va JAMAIS dans le total de CA. Il vise un seul
 * adversaire, choisi en cours de round — exactement comme le don Esquive, que
 * le Grimoire traite déjà hors total.
 */
export function esquiveBretteur(niveauBretteur: number): number {
  if (niveauBretteur >= 20) return 4
  if (niveauBretteur >= 15) return 3
  if (niveauBretteur >= 10) return 2
  if (niveauBretteur >= 5) return 1
  return 0
}

/** Frappe perspicace (Bretteur 3) : le mod. d'INT s'ajoute aux dégâts. */
export function aFrappePerspicace(niveauBretteur: number): boolean {
  return niveauBretteur >= 3
}

/**
 * Une armure portée éteint-elle les pouvoirs du Bretteur ?
 *
 * Grâce, Frappe perspicace et Bonus d'esquive se perdent « en armure
 * intermédiaire ou lourde, ou sous une charge intermédiaire ou lourde ».
 *
 * ⚠ Mesuré le 2026-11-12 : la colonne `armor.type` n'est renseignée que sur
 * **10 lignes** du Grimoire, et avec trois vocabulaires — « Légère »,
 * « Armure lourde » et « armure », qui ne dit rien du tout. On ne peut donc pas
 * conclure d'un `type` muet que l'armure est légère ; on éteint seulement quand
 * la donnée l'AFFIRME. La note affichée sur la fiche porte la condition pour
 * que le joueur tranche le reste à la table.
 *
 * ⛔ La charge n'entre PAS dans ce test, et c'est délibéré : l'encombrement du
 * Grimoire pèse les armes, les armures et l'équipement courant saisi (voir
 * `poidsTotal` sur la fiche), mais il ne peut rien peser de ce qui n'a pas été
 * inscrit — et une ligne d'équipement sans poids saisi ne compte pas. Éteindre
 * un pouvoir sur une charge qu'on sait incomplète rendrait un faux négatif
 * impossible à comprendre à la table.
 */
export function armureEteintBretteur(
  typesArmuresPortees: (string | null | undefined)[],
): string | null {
  for (const t of typesArmuresPortees) {
    const n = (t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (n.includes('intermediaire') || n.includes('moyenne') || n.includes('lourd')) return t ?? null
  }
  return null
}

export interface BonusDeClasse {
  /** Niveau de Bretteur retenu, pour que l'appelant puisse l'afficher. */
  niveauBretteur: number
  /** Nom de l'armure qui éteint les pouvoirs, null si aucune ne le fait. */
  armureBloquante: string | null
  /** À ajouter aux lignes de Réflexes — même forme que les bonus de dons. */
  reflexes: BonusItem[]
  /** Conditionnels : affichés, JAMAIS comptés dans le total de CA. */
  caConditionnelle: BonusItem[]
}

export function getBonusClasse(
  classes: { nom: string; niveau: number }[],
  typesArmuresPortees: (string | null | undefined)[] = [],
): BonusDeClasse {
  const niveauBretteur = niveauDeClasse(classes, NOM_BRETTEUR)
  const armureBloquante = armureEteintBretteur(typesArmuresPortees)
  const r: BonusDeClasse = { niveauBretteur, armureBloquante, reflexes: [], caConditionnelle: [] }

  const grace = graceBretteur(niveauBretteur)
  if (grace > 0 && !armureBloquante) {
    r.reflexes.push({
      label: 'Bretteur : Grâce',
      value: grace,
      conditional: 'perdu en armure intermédiaire ou lourde, ou sous une charge intermédiaire ou lourde',
    })
  }

  const esquive = esquiveBretteur(niveauBretteur)
  if (esquive > 0 && !armureBloquante) {
    r.caConditionnelle.push({
      label: "Bretteur : bonus d'esquive",
      value: esquive,
      conditional: 'contre les attaques de corps à corps d’un seul adversaire désigné pendant son action — à ajouter à la main',
    })
  }

  return r
}

/**
 * Contexte d'une fiche, pour juger ce que ses pouvoirs de classe lui apportent
 * VRAIMENT. Même rôle que `ContexteFiche` dans `dons-effets.ts`.
 */
export type ContexteCapacite = {
  forMod: number
  dexMod: number
  intMod: number
  /** Au moins une arme de corps à corps de la fiche accepte Attaque en finesse. */
  uneArmeEligible: boolean
  /** Nom de l'armure portée qui éteint les pouvoirs, null si aucune. */
  armureBloquante: string | null
}

/**
 * Ce que le Grimoire CALCULE d'un pouvoir de classe, pouvoir par pouvoir.
 *
 * Même contrat que `effetsDuDon` et même rendu à l'écran (`EffetsDon`) : la
 * fiche doit répondre à « le chiffre de la case l'inclut-il déjà? » pour un
 * pouvoir de classe comme pour un don. Les quatre statuts sont les mêmes.
 *
 * ⭐ Dérivé, pas décrit : les valeurs viennent de `graceBretteur` et
 * `esquiveBretteur` — les fonctions mêmes qui alimentent les totaux. Une table
 * écrite à côté annoncerait un jour un bonus que le calcul n'applique pas.
 *
 * Un pouvoir absent de cette fonction rend un tableau vide, et l'appelant
 * affiche « aucun calcul automatique — à appliquer à la table ». C'est le cas
 * de la Charge acrobatique, de la Tenaille améliorée, de la Chance et des deux
 * critiques : des règles de jeu qu'aucune case de fiche ne porte.
 */
export function effetsCapaciteClasse(
  nomClasse: string,
  nomCapacite: string,
  niveauClasse: number,
  ctx: ContexteCapacite,
): EffetDon[] {
  if (nomClasse !== NOM_BRETTEUR) return []
  const effets: EffetDon[] = []
  const bloque = ctx.armureBloquante

  if (nomCapacite === 'Attaque en finesse') {
    if (!ctx.uneArmeEligible) {
      effets.push({
        statut: 'inactif',
        ou: 'Attaque',
        quoi: 'DEX au lieu de FOR',
        note: 'aucune arme de corps à corps de la fiche ne l’accepte : il faut une arme légère, une rapière, un fouet, une chaîne cloutée ou le combat à mains nues',
      })
    } else if (ctx.dexMod > ctx.forMod) {
      effets.push({
        statut: 'compte',
        ou: 'Attaque (armes légères)',
        quoi: `DEX +${ctx.dexMod} au lieu de FOR +${ctx.forMod}`,
        note: 'le don est offert par la classe au 1er niveau — il n’a pas à être saisi dans les dons',
      })
    } else {
      effets.push({
        statut: 'inactif',
        ou: 'Attaque',
        quoi: 'DEX au lieu de FOR',
        note: `la Force +${ctx.forMod} vaut mieux que la Dextérité +${ctx.dexMod} : le livre dit « peut choisir », la fiche garde le meilleur des deux`,
      })
    }
  }

  if (nomCapacite === 'Grâce') {
    const v = graceBretteur(niveauClasse)
    if (v > 0 && !bloque) {
      effets.push({ statut: 'compte', ou: 'Réflexes', quoi: `+${v}` })
    } else if (v > 0 && bloque) {
      effets.push({
        statut: 'inactif',
        ou: 'Réflexes',
        quoi: `+${v}`,
        note: `éteint : « ${bloque} » est portée, et la Grâce se perd en armure intermédiaire ou lourde`,
      })
    }
  }

  if (nomCapacite === 'Frappe perspicace') {
    if (!aFrappePerspicace(niveauClasse)) return effets
    if (bloque) {
      effets.push({
        statut: 'inactif',
        ou: 'Dégâts',
        quoi: `+${ctx.intMod} (INT)`,
        note: `éteint : « ${bloque} » est portée, et la Frappe perspicace se perd en armure intermédiaire ou lourde`,
      })
    } else if (!ctx.uneArmeEligible) {
      effets.push({
        statut: 'inactif',
        ou: 'Dégâts',
        quoi: 'mod. d’INT',
        note: 'aucune arme de corps à corps de la fiche ne l’accepte : il faut une arme utilisable avec Attaque en finesse',
      })
    } else if (ctx.intMod <= 0) {
      effets.push({
        statut: 'inactif',
        ou: 'Dégâts',
        quoi: 'mod. d’INT',
        note: `l'Intelligence du personnage ne donne aucun bonus (mod. ${ctx.intMod >= 0 ? '+' : ''}${ctx.intMod})`,
      })
    } else {
      effets.push({
        statut: 'compte',
        ou: 'Dégâts (armes légères)',
        quoi: `+${ctx.intMod}`,
        note: 'sans effet sur les créatures insensibles aux coups critiques — à retirer contre elles',
      })
    }
  }

  if (nomCapacite === "Bonus d'esquive") {
    const v = esquiveBretteur(niveauClasse)
    if (v > 0 && !bloque) {
      effets.push({
        statut: 'main',
        ou: 'Classe d’armure',
        quoi: `+${v}`,
        note: 'contre les attaques de corps à corps d’un seul adversaire, désigné pendant son action',
      })
    } else if (v > 0 && bloque) {
      effets.push({
        statut: 'inactif',
        ou: 'Classe d’armure',
        quoi: `+${v}`,
        note: `éteint : « ${bloque} » est portée, et le bonus d'esquive se perd en armure intermédiaire ou lourde`,
      })
    }
  }

  return effets
}

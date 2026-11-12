/**
 * « Est-ce que les calculs tiennent compte des dons? » — la réponse, don par don.
 *
 * Demande d'André le 2026-11-12 : « est-ce que les calculs tiennent compte des
 * dons. il faut voir ces modifications sur la page du personnage. »
 *
 * Le Grimoire lit bel et bien certains dons — mais rien ne le disait à l'écran.
 * Un don qui ajoute +4 à l'initiative et un don purement narratif s'affichaient
 * exactement pareil : nom, 📖, 🔍, une phrase de description. Impossible de
 * savoir si le chiffre de la case était déjà à jour ou s'il fallait l'ajouter
 * soi-même à la table. Dans le doute, on compte deux fois ou pas du tout.
 *
 * ── Pourquoi ce module DÉRIVE du moteur au lieu de le décrire ────────────────
 * La tentation était d'écrire une table « nom du don → ce qu'il fait ». Elle
 * aurait divergé du moteur au premier changement, et une fiche qui annonce un
 * bonus que le calcul n'applique pas est pire que pas d'annonce du tout : elle
 * se trompe avec autorité.
 *
 * Alors on appelle les VRAIES fonctions de calcul avec le don seul, et on lit
 * ce qui en sort. Si `getFeatPassiveBonuses(['Volonté de fer'])` rend
 * `volonte: [+2]`, c'est que le moteur l'ajoute : la fiche peut le dire.
 * Si une regex change, l'affichage suit sans qu'on y touche.
 *
 * ── Les quatre statuts ───────────────────────────────────────────────────────
 * `compte`      le chiffre affiché sur la fiche l'inclut DÉJÀ — ne rien ajouter.
 * `main`        reconnu, affiché dans le détail, mais hors du total (Esquive,
 *               Mobilité : conditionnels, c'est au joueur de les ajouter).
 * `informatif`  le moteur le connaît sans l'appliquer (Robustesse : le pv max
 *               de la fiche est saisi à la main, le don sert à élargir la plage
 *               attendue par le contrôle de cohérence).
 * `inactif`     reconnu, mais sans effet SUR CETTE FICHE — Attaque en finesse
 *               quand la Force du personnage dépasse sa Dextérité. Le dire
 *               évite la question « pourquoi mon don ne change rien? ».
 *
 * Un don qui ne rend AUCUN effet n'est pas forcément cassé : la grande majorité
 * des 302 dons sont des choix tactiques (Attaque en puissance), des capacités
 * à usage (Tir de précision) ou des conditions de jeu qu'un chiffre de fiche ne
 * peut pas porter. L'appelant les présente comme « à appliquer à la table ».
 */
import { extraitCibleDon, getFeatPassiveBonuses, getFeatWeaponBonuses } from './feat-bonuses'
import { aAttaqueEnFinesse, aLameDombre } from './attaque'

export type StatutEffet = 'compte' | 'main' | 'informatif' | 'inactif'

export type EffetDon = {
  statut: StatutEffet
  /** Où le chiffre apparaît sur la fiche : « Initiative », « Attaque (Dague) ». */
  ou: string
  /** Ce que le moteur en fait : « +4 », « DEX au lieu de FOR ». */
  quoi: string
  /** Précision affichée sous la ligne. */
  note?: string
}

/**
 * De quoi juger Attaque en finesse sur CETTE fiche : le don remplace la Force
 * par la Dextérité « si le personnage le choisit » (SRD), donc le Grimoire garde
 * le meilleur des deux. Sans ce contexte, on ne peut pas dire si le don agit.
 */
export type ContexteFiche = {
  forMod: number
  dexMod: number
  /** Au moins une arme de la fiche accepte le don (légère, rapière, fouet, chaîne cloutée). */
  uneArmeEligible: boolean
  /**
   * Au moins une arme de corps à corps de la fiche est une arme de prédilection
   * de la discipline Main d'ombre — la condition de Lame d'ombre. Sans elle, le
   * don est porté sans jamais pouvoir agir, et la fiche doit le dire.
   */
  uneArmeMainDombre: boolean
}

/** Majuscule initiale — les cibles de dons sont normalisées en minuscules. */
function capitale(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Île de lames (*Island of Blades*), posture de Main d'ombre niveau 1.
 *
 * Reconnue au nom, français comme anglais, sans accent ni casse : la fiche de
 * Duncan Darkvale la portait sous « Island of Blade (Tome of Battle Stance) »,
 * saisi à la main, et le pluriel d'« Blades » y manquait.
 */
export function estIleDeLames(nom: string): boolean {
  const n = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return /ile de lames|island\s*of\s*blades?/.test(n)
}

/** Les quatre chiffres de fiche que les dons passifs savent augmenter. */
const SAUVEGARDES: { cle: 'initiative' | 'vigueur' | 'reflexes' | 'volonte'; ou: string }[] = [
  { cle: 'initiative', ou: 'Initiative' },
  { cle: 'vigueur', ou: 'Vigueur' },
  { cle: 'reflexes', ou: 'Réflexes' },
  { cle: 'volonte', ou: 'Volonté' },
]

/**
 * Nom d'arme impossible, passe a `getFeatWeaponBonuses` pour les dons qui ne
 * ciblent aucune arme : sans lui, un don sans parenthese pourrait apparier par
 * hasard une arme qui s'appellerait comme lui.
 *
 * (Ecrit en sequence d'echappement, et non en octet nul litteral : un NUL brut
 * fait passer tout le fichier pour binaire aux yeux de grep, qui cesse alors
 * d'en afficher la moindre ligne. Paye le 2026-11-12.)
 */
const SENTINELLE_SANS_ARME = '\u0000'

/** Tir à bout portant ne cible pas une arme : il vaut pour toutes celles qui tirent. */
const EST_TBP = (label: string) => label === 'TBP'

export function effetsDuDon(nom: string, ctx?: ContexteFiche): EffetDon[] {
  const effets: EffetDon[] = []

  // ── Bonus passifs : on interroge le moteur avec ce don seul.
  const p = getFeatPassiveBonuses([nom])

  for (const { cle, ou } of SAUVEGARDES) {
    for (const b of p[cle]) effets.push({ statut: 'compte', ou, quoi: `+${b.value}` })
  }

  for (const b of p.caConditionnelle) {
    effets.push({
      statut: 'main',
      ou: 'Classe d’armure',
      quoi: `+${b.value}`,
      // La note du moteur finit par « — à ajouter à la main », parce qu'elle
      // sert aussi au panneau de CA, où rien d'autre ne le dit. Ici le statut
      // le dit déjà : on ne l'écrit pas deux fois de suite.
      note: b.conditional?.replace(/\s*—\s*à ajouter à la main\s*$/, ''),
    })
  }

  for (const c of p.competences) {
    effets.push({
      statut: 'compte',
      ou: c.skillNoms.join(' et '),
      quoi: `+${c.item.value}`,
    })
  }

  for (const b of p.pv) {
    effets.push({
      statut: 'informatif',
      ou: 'Points de vie',
      quoi: `+${b.value}`,
      note: 'le pv maximum de la fiche est saisi à la main — le don sert au contrôle de cohérence, il n’ajoute rien au chiffre',
    })
  }

  // ── Bonus d'arme : le don porte sa cible dans son nom (« Arme de prédilection
  // (Dague) »). On la passe comme nom d'arme pour que l'appariement du moteur
  // réussisse, et on lit ce qu'il accorde. Le sentinelle évite qu'un don sans
  // cible apparie par hasard une arme qui s'appellerait comme lui.
  const cible = extraitCibleDon(nom)
  const w = getFeatWeaponBonuses([nom], cible ?? SENTINELLE_SANS_ARME, true)
  const porteeArme = cible ? ` (${capitale(cible)})` : ' (armes à distance)'

  for (const b of w.attackItems) {
    effets.push({
      statut: 'compte',
      ou: `Attaque${EST_TBP(b.label) ? ' (armes à distance)' : porteeArme}`,
      quoi: `+${b.value}`,
      note: b.conditional ? `seulement à ${b.conditional} — le total l’inclut déjà, à retirer au-delà` : undefined,
    })
  }
  for (const b of w.damageItems) {
    effets.push({
      statut: 'compte',
      ou: `Dégâts${EST_TBP(b.label) ? ' (armes à distance)' : porteeArme}`,
      quoi: `+${b.value}`,
      note: b.conditional ? `seulement à ${b.conditional} — le total l’inclut déjà, à retirer au-delà` : undefined,
    })
  }

  // ── Attaque en finesse : le seul don dont l'effet dépend de la fiche entière
  // (les caractéristiques et les armes portées), pas de son propre nom.
  if (aAttaqueEnFinesse([nom])) {
    if (!ctx) {
      effets.push({ statut: 'compte', ou: 'Attaque (armes légères)', quoi: 'DEX au lieu de FOR' })
    } else if (!ctx.uneArmeEligible) {
      effets.push({
        statut: 'inactif',
        ou: 'Attaque',
        quoi: 'DEX au lieu de FOR',
        note: 'aucune arme de la fiche ne l’accepte : il faut une arme légère, une rapière, un fouet, une chaîne cloutée ou le combat à mains nues',
      })
    } else if (ctx.dexMod > ctx.forMod) {
      effets.push({
        statut: 'compte',
        ou: 'Attaque (armes légères)',
        quoi: `DEX +${ctx.dexMod} au lieu de FOR +${ctx.forMod}`,
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

  // ── Lame d'ombre (Shadow Blade, Tome of Battle p. 32) : le mod. de DEX s'ajoute aux
  // dégâts, en plus de la Force — mais seulement en posture de la discipline
  // Main d'ombre, et avec une de ses armes de prédilection. Le chiffre vient du
  // même module que le calcul des lignes d'armes (`aLameDombre` y est défini),
  // et il reste HORS du total pour la même raison que le bonus d'esquive du
  // Bretteur : une posture s'adopte en combat, une fiche est au repos.
  if (aLameDombre([nom])) {
    if (!ctx) {
      effets.push({ statut: 'main', ou: 'Dégâts (armes de Main d’ombre)', quoi: 'mod. de DEX' })
    } else if (!ctx.uneArmeMainDombre) {
      effets.push({
        statut: 'inactif',
        ou: 'Dégâts',
        quoi: 'mod. de DEX',
        note: 'aucune arme de corps à corps de la fiche n’est une arme de prédilection de la discipline Main d’ombre : dague, épée courte, sai, siangham, chaîne cloutée ou combat à mains nues',
      })
    } else if (ctx.dexMod <= 0) {
      effets.push({
        statut: 'inactif',
        ou: 'Dégâts',
        quoi: 'mod. de DEX',
        note: `la Dextérité du personnage ne donne aucun bonus (mod. ${ctx.dexMod >= 0 ? '+' : ''}${ctx.dexMod})`,
      })
    } else {
      effets.push({
        statut: 'main',
        ou: 'Dégâts (armes de Main d’ombre)',
        quoi: `+${ctx.dexMod}`,
        note: 'seulement en posture de la discipline Main d’ombre, avec une de ses armes de prédilection — la ligne de l’arme donne le total avec et sans',
      })
    }
  }

  // ── Île de lames (Island of Blades, p. 78) : une POSTURE de Main d'ombre, pas un don
  // — mais le Grimoire n'a pas de section pour les manœuvres martiales, et une
  // fiche la porte dans ses dons. Elle n'ouvre aucun calcul : elle rend la prise
  // en tenaille accessible sans contrainte de position. Le +2 affiché est celui
  // de la tenaille du Manuel, pas un bonus de plus — c'est écrit dans la note,
  // parce qu'un chiffre nu se lirait comme un cumul.
  //
  // ⚠ Seul endroit de ce module qui ne DÉRIVE de rien : il n'y a pas de calcul
  // à interroger, le Grimoire ne modélise pas le positionnement. Assumé et
  // borné à une règle de table, jamais à un total de fiche.
  if (estIleDeLames(nom)) {
    effets.push({
      statut: 'main',
      ou: 'Attaque (corps à corps)',
      quoi: '+2',
      note: 'le +2 de la prise en tenaille du Manuel, que la posture accorde dès qu’un allié est adjacent au même adversaire, quel que soit le positionnement — plusieurs adversaires à la fois',
    })
  }

  return effets
}

/** Le moteur lit-il ce don, à quelque titre que ce soit ? */
export function donEstLu(nom: string, ctx?: ContexteFiche): boolean {
  return effetsDuDon(nom, ctx).length > 0
}

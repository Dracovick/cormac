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
  /**
   * Nom et famille de l'entrée de CATALOGUE rattachée, quand la ligne
   * d'inventaire n'en porte pas. 160 des 198 lignes d'armes des fiches
   * viennent de FileMaker avec `famille` NULL et un nom libre anglais
   * (« Rapier +2 », « Mace (light) +3 ») : leur `catalogue_id` est le seul
   * endroit où l'on sait quelle arme c'est.
   *
   * ⛔ Servent UNIQUEMENT à juger l'éligibilité à Attaque en finesse. Les
   * brancher sur `estArmeADistance` ferait basculer des dizaines de lignes
   * du BAB de corps à corps à celui de projectiles d'un coup : c'est un
   * arbitrage d'André, pas un effet de bord.
   */
  nomCatalogue?: string | null
  familleCatalogue?: string | null
  /** Dé de l'arme, « 1d8 ». Peut être nul sur une ligne d'inventaire. */
  degats: string | null | undefined
  /** Champ `bonus_magique` de la ligne d'inventaire. */
  bonusArme: number
  /** Champ `bonus_munitions` : flèches +2, carreaux +1… */
  bonusMunitions: number | null
  /** Côte de Force d'un arc composite : plafonne la FOR aux dégâts. */
  coteDeForce: number | null
  /**
   * Attaque en finesse : la caractéristique CHOISIE par le joueur pour le jet
   * d'attaque de cette ligne d'arme.
   *
   *   null / absent — automatique : le meilleur des deux, comme avant 0016 ;
   *   'dex'         — la Dextérité, même si la Force est meilleure ;
   *   'for'         — la Force, même si la Dextérité est meilleure.
   *
   * Le Manuel dit « PEUT CHOISIR » : décider à la place du joueur est un
   * défaut commode, pas la règle. Ignoré à distance et sur une arme non
   * éligible — le livre n'y autorise aucun choix.
   */
  caracAttaque?: 'for' | 'dex' | null
  /** Noms des dons du personnage. */
  dons: string[]
  bbaBrutCorps: number
  bbaBrutDistance: number
  forMod: number
  dexMod: number
  /**
   * Niveau de Bretteur (Guerriers & Harceleurs, p. 11). Deux de ses pouvoirs
   * touchent cette ligne d'arme :
   *   niv.1 — Attaque en finesse OFFERTE, qu'il ait saisi le don ou non ;
   *   niv.3 — Frappe perspicace : le mod. d'INT s'ajoute aux dégâts.
   * 0 ou absent : le personnage n'est pas Bretteur, rien ne change.
   */
  niveauBretteur?: number
  /** Modificateur d'Intelligence — ne sert qu'à la Frappe perspicace. */
  intMod?: number
  /**
   * Armure portée qui éteint les pouvoirs du Bretteur (intermédiaire ou
   * lourde), son nom pour l'afficher. Null ou absent : rien n'est éteint.
   */
  armureBloquanteBretteur?: string | null
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
  /** La DEX a-t-elle effectivement remplacé la FOR sur cette ligne ? */
  finesseAppliquee: boolean
  /**
   * Le personnage peut-il choisir sa caractéristique d'attaque sur cette ligne
   * (don ou Bretteur + arme éligible + corps à corps) ? C'est la condition
   * d'affichage du sélecteur au formulaire comme de la mention sur la fiche.
   */
  choixFinessePossible: boolean
  /** Le choix retenu, et s'il vient du joueur ou du défaut automatique. */
  caracAttaqueRetenue: 'for' | 'dex'
  caracAttaqueChoisieParLeJoueur: boolean
  /** Le personnage tient-il Attaque en finesse de sa classe (Bretteur 1) ? */
  finesseOfferteParClasse: boolean
  /** L'arme accepte-t-elle Attaque en finesse (donc la Frappe perspicace) ? */
  armeEligibleAFinesse: boolean
  /** Le mod. d'INT a-t-il été ajouté aux dégâts (Bretteur 3) ? */
  perspicaceAppliquee: boolean
  /**
   * Lame d'ombre (*Shadow Blade*, Tome of Battle) : le mod. de DEX aux dégâts,
   * et ce que donnerait la ligne de dégâts avec lui.
   *
   * ⛔ JAMAIS compris dans `degatsMod` ni dans `degatsTexte` : il ne vaut que
   * tant que le personnage se tient dans une posture de la discipline Main
   * d'ombre, ce qu'une fiche au repos ne peut pas affirmer. Null quand le don
   * est absent, l'arme hors discipline, ou la Dextérité sans bonus.
   */
  lameDombre: { bonus: number; degatsTexte: string } | null
  /** Contributions écartées par le non-cumul, à afficher barrées. */
  ecartes: BonusEcarte[]
}

/** Minuscules, sans accent — les noms de dons et d'armes sont du texte libre. */
function sansAccent(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Le personnage porte-t-il Attaque en finesse ?
 *
 * Les noms de dons sont du texte libre importé de FileMaker : le même don
 * s'écrit « Weapon finesse (dagger) », « Weapon Finesse (peut utiliser le
 * bonus de Dex sur jets d'attaque) », « 3rd level feat: Weapon finesse
 * (dagger) » ou « Acuité martiale (Dague) » selon la fiche. On reconnaît
 * aussi « Acuité martiale », l'ancienne traduction maison du sélecteur.
 */
export function aAttaqueEnFinesse(dons: string[]): boolean {
  return dons.some(d => /attaque en finesse|acuite martiale|weapon\s*finesse/.test(sansAccent(d)))
}

/**
 * L'arme accepte-t-elle Attaque en finesse ?
 *
 * SRD 3.5 VF, Attaque en finesse : « Lorsqu'il utilise une arme légère, une
 * rapière, un fouet ou une chaîne cloutée (et que cette arme est destinée à
 * une créature de sa catégorie de taille), le personnage peut choisir
 * d'appliquer son bonus de Dextérité à ses jets d'attaque plutôt que celui de
 * Force. […] Les armes naturelles sont toujours considérées comme étant des
 * armes légères. »
 *
 * ⚠ Le don ne se choisit PAS arme par arme : c'est la règle de la 3.0, et le
 * Grimoire l'appliquait encore (le sélecteur ouvrait une liste d'armes).
 *
 * La famille du livre porte le maniement (« Arme courante — corps à corps
 * légère »). Les trois exceptions nommées ne sont pas légères : on les
 * reconnaît au nom, celui de la ligne comme celui du catalogue.
 */
const EXCEPTIONS_FINESSE = ['rapiere', 'fouet', 'chaine cloutee']

export function armeEligibleFinesse(
  nom: string,
  nomCatalogue: string | null | undefined,
  famille: string | null | undefined,
): boolean {
  const f = sansAccent(famille ?? '')
  // « corps à corps légère », et le combat à mains nues (armes naturelles).
  if (f.includes('legere') || f.includes('mains nues')) return true
  const noms = [nom, nomCatalogue ?? ''].map(sansAccent)
  return EXCEPTIONS_FINESSE.some(e => noms.some(n => n.includes(e)))
}

/**
 * Lame d'ombre (*Shadow Blade*, Tome of Battle) — le personnage a-t-il le don ?
 *
 * « While you are in a Shadow Hand stance and attack with one of the
 *   discipline's preferred weapons, you can add your Dexterity modifier as a
 *   bonus on melee damage for attacks made with the weapon. »
 *
 * ⚠ C'est un bonus AUX DÉGÂTS, qui s'AJOUTE à la Force — pas un remplacement
 * comme Attaque en finesse, et pas un bonus à l'attaque. La fiche française
 * que consulte André (regles-donjons-dragons.com) le résume en « appliquer son
 * modificateur de Dextérité aux attaques au corps à corps », ce que le livre ne
 * dit pas : signalé le 2026-11-12, le Grimoire suit le livre.
 *
 * ⛔ Hors du total, toujours : le bonus n'existe QUE tant que le personnage se
 * tient dans une posture de la discipline Main d'ombre. Une posture s'adopte
 * et se quitte en combat, par une action rapide — aucun chiffre de fiche au
 * repos ne peut l'affirmer. Même traitement que le bonus d'esquive du Bretteur.
 *
 * Le nom est du texte libre : on accepte le français comme l'anglais, et les
 * deux apostrophes (droite et typographique) via le point.
 */
export function aLameDombre(dons: string[]): boolean {
  return dons.some(d => /lame d.ombre|shadow\s*blade/.test(sansAccent(d)))
}

/**
 * L'arme est-elle une arme de prédilection de la discipline Main d'ombre ?
 *
 * Tome of Battle, discipline Shadow Hand : dague, épée courte, sai, siangham,
 * chaîne cloutée, attaque à mains nues. Compétence clé : Discrétion.
 *
 * ⚠ Testé au MOT, pas en sous-chaîne : « sai » apparaît dans trop de mots
 * français pour qu'un `includes` soit sûr. Et comme pour l'éligibilité à la
 * finesse, on regarde le nom de la ligne ET celui de l'entrée de catalogue
 * rattachée — 160 des 198 lignes d'armes des fiches portent un nom libre
 * anglais venu de FileMaker (« Short sword +1 »).
 */
const MOTIFS_MAIN_DOMBRE = [
  /\bdagues?\b/, /\bdaggers?\b/,
  /\bepees? courtes?\b/, /\bshort\s*swords?\b/,
  /\bsai\b/, /\bsianghams?\b/,
  /\bchaines? cloutees?\b/, /\bspiked\s*chains?\b/,
]

export function armeMainDombre(
  nom: string,
  nomCatalogue: string | null | undefined,
  famille: string | null | undefined,
): boolean {
  const f = sansAccent(famille ?? '')
  if (f.includes('mains nues')) return true
  const noms = [nom, nomCatalogue ?? ''].map(sansAccent)
  if (noms.some(n => /\bmains nues\b|\bunarmed\b/.test(n))) return true
  return MOTIFS_MAIN_DOMBRE.some(m => noms.some(n => m.test(n)))
}

export function calculeArme(e: EntreeArme): CalculArme {
  const estADistance = estArmeADistance(e.famille, e.portee)
  const bbaBrut = estADistance ? e.bbaBrutDistance : e.bbaBrutCorps

  // Attaque en finesse : au corps à corps, avec une arme qui l'accepte, la DEX
  // remplace la FOR si elle est meilleure. Le livre dit « peut choisir » — à la
  // table on prend toujours le meilleur des deux, et la ligne de détail nomme
  // le don pour que le choix reste lisible.
  //
  // Le Bretteur l'a d'office au 1er niveau, don saisi ou non : sa fiche doit
  // calculer juste même si le joueur n'a rien inscrit dans ses dons.
  const bretteur = e.niveauBretteur ?? 0
  const finesseOfferte = bretteur >= 1
  const armeFinesse = armeEligibleFinesse(e.nom, e.nomCatalogue, e.famille ?? e.familleCatalogue)
  const choixPossible =
    !estADistance && (aAttaqueEnFinesse(e.dons) || finesseOfferte) && armeFinesse

  // Le choix du joueur l'emporte, y compris quand il donne le plus petit
  // total : « peut choisir » veut dire qu'on peut choisir moins bien. Sans
  // choix saisi (NULL, le cas de toutes les lignes d'avant 0016), on garde le
  // meilleur des deux — le comportement d'hier, à l'identique.
  const choixJoueur = choixPossible ? (e.caracAttaque ?? null) : null
  const finesse = choixPossible && (choixJoueur === 'dex' || (choixJoueur === null && e.dexMod > e.forMod))
  const caracAtk = estADistance || finesse ? e.dexMod : e.forMod

  // Frappe perspicace (Bretteur 3) : le modificateur d'INTELLIGENCE s'ajoute
  // aux dégâts, EN PLUS de la Force, avec toute arme utilisable avec Attaque en
  // finesse. L'armure intermédiaire ou lourde l'éteint.
  //
  // ⚠ Elle suit l'ÉLIGIBILITÉ de l'arme, pas le basculement sur la DEX : un
  // Bretteur à forte Force garde la FOR à l'attaque et touche quand même son
  // bonus d'INT aux dégâts. Les lier ferait disparaître le bonus sur la moitié
  // des fiches sans que rien ne le dise.
  const frappePerspicace =
    bretteur >= 3 &&
    !estADistance &&
    armeFinesse &&
    !e.armureBloquanteBretteur &&
    (e.intMod ?? 0) > 0

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

  const bonusPerspicace = frappePerspicace ? (e.intMod ?? 0) : 0

  const attaque = bbaBrut + caracAtk + alteration + donsAtk
  const degatsMod = alteration + caracDmg + donsDmg + bonusPerspicace
  const deArme = e.degats ?? '—'

  // Lame d'ombre : le mod. de DEX s'ajoute aux dégâts de corps à corps avec une
  // arme de prédilection de la discipline Main d'ombre — mais SEULEMENT en
  // posture de cette discipline. Calculé ici pour que la fiche puisse l'écrire,
  // délibérément tenu HORS de `degatsMod` : un total qui l'inclurait annoncerait
  // comme acquis un bonus qui dépend d'une action rapide en combat.
  const bonusLameDombre =
    aLameDombre(e.dons) &&
    !estADistance &&
    armeMainDombre(e.nom, e.nomCatalogue, e.famille ?? e.familleCatalogue) &&
    e.dexMod > 0
      ? e.dexMod
      : 0
  const modAvecLame = degatsMod + bonusLameDombre

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
      {
        label: estADistance ? 'DEX' : finesse ? 'DEX (Attaque en finesse)' : 'FOR',
        valeur: caracAtk,
        note: finesse
          ? `${finesseOfferte && !aAttaqueEnFinesse(e.dons) ? 'Bretteur niv.1 : Attaque en finesse offerte' : 'don Attaque en finesse'} — la DEX remplace la FOR +${e.forMod} sur une arme légère (rapière, fouet et chaîne cloutée comprises)${choixJoueur === 'dex' ? ' · choix du joueur' : ''}`
          : choixPossible
            ? `Attaque en finesse : la DEX +${e.dexMod} est permise sur cette arme${choixJoueur === 'for' ? ', le joueur garde la FOR' : e.dexMod === e.forMod ? ' (même valeur)' : ' mais elle est moins bonne'}`
            : undefined,
      },
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
      ...(bonusPerspicace > 0 ? [{
        label: 'Bretteur : Frappe perspicace (INT)',
        valeur: bonusPerspicace,
        note: 'sans effet sur les créatures insensibles aux coups critiques ; perdu en armure intermédiaire ou lourde',
      }] : []),
    ],
    finesseAppliquee: finesse,
    choixFinessePossible: choixPossible,
    caracAttaqueRetenue: estADistance || finesse ? 'dex' : 'for',
    caracAttaqueChoisieParLeJoueur: choixJoueur !== null,
    finesseOfferteParClasse: finesseOfferte,
    armeEligibleAFinesse: armeFinesse,
    perspicaceAppliquee: frappePerspicace,
    lameDombre: bonusLameDombre > 0
      ? {
          bonus: bonusLameDombre,
          degatsTexte: modAvecLame === 0 ? deArme : `${deArme}${modAvecLame > 0 ? '+' : ''}${modAvecLame}`,
        }
      : null,
    ecartes: ecarte ? [ecarte] : [],
  }
}

// LA TAILLE DU PERSONNAGE — ce qu'elle modifie, et où.
//
// André, le 2026-11-16 : « Est-ce que les caractéristiques de grandeurs sont
// prises en compte dans la Classe d'armure ? Exemple, un Halfelin comme
// Azadrielle Pétales de Lune est de petite taille, elle a donc la classe
// d'armure de modifié face à un adversaire de taille moyenne. »
//
// Réponse mesurée avant d'écrire : NON, nulle part. Ni la CA, ni l'attaque, ni
// la Discrétion, ni la charge transportable ne regardaient `races.taille` —
// pourtant renseignée sur les 32 races du catalogue.
//
// ⛔ UNE PRÉCISION QUI CHANGE LA RÈGLE : le modificateur ne dépend PAS de la
// taille de l'adversaire. Il s'applique TOUJOURS, contre n'importe qui. Seule
// la LUTTE utilise un « modificateur de taille spécial » qui, lui, se compare
// à la taille de l'autre (+4 par catégorie au-dessus de M) — et il REMPLACE
// l'habituel au lieu de s'y ajouter. La lutte n'est pas calculée par le
// Grimoire; ce module ne couvre donc que le modificateur ordinaire.
//
// ── Relevé au SRD 3.5 VF (dépôt orey/DD-3e, RTF en cp1252) ──────────────────
//   Attaque, chap. Combat :
//     « Bonus de base à l'attaque + modificateur de Force + modificateur de
//       taille » — et le modificateur de Dextérité à distance.
//   Classe d'armure, chap. Combat :
//     « La CA se calcule de la façon suivante : 10 + bonus d'armure + bonus de
//       bouclier + modificateur de Dextérité + modificateur de taille. »
//   Discrétion, chap. Compétences :
//     « Les créatures d'une autre catégorie de taille que M voient leur test de
//       Discrétion s'accompagner des modificateurs suivants : taille I : +16,
//       taille Min : +12, taille TP : +8, taille P : +4, taille G : −4,
//       taille TG : −8, taille Gig : −12, taille C : −16. »
//   Charge, chap. Poids transportable :
//     « les créatures bipèdes plus petites transportent un poids moins
//       important […] : petite (P) : 3/4, très petite (TP) : 1/2,
//       minuscule (Min) : 1/4, infime (I) : 1/8 » — et pour les plus grandes,
//       « grande (G) : 2, très grande (TG) : 4, gigantesque (Gig) : 8 et
//       colossale (C) : 16 ».
//
// ⚠⚠ LES SIGNES ONT FAILLI ÊTRE FAUX. Dans ces RTF, le signe moins est le mot
// de contrôle `\endash` — un déshabillage qui efface les `\mot` le fait
// disparaître sans trace, et la table ressortait « Colossal (C) | 8 » au lieu
// de « −8 ». Le témoin qui l'a révélé : « Petit (P) | +1 » portait son `+` en
// clair alors que les grandes tailles n'avaient aucun signe. Deux lignes de la
// même table écrites différemment = l'extraction mange quelque chose.

export type CategorieTaille =
  | 'Infime' | 'Minuscule' | 'Très petite' | 'Petite' | 'Moyenne'
  | 'Grande' | 'Très grande' | 'Gigantesque' | 'Colossale'

type FicheTaille = {
  /** CA et jets d'attaque. Table : modificateurs de taille. */
  modificateur: number
  /** Tests de Discrétion. */
  discretion: number
  /** Multiplicateur de la charge transportable d'un bipède. */
  charge: number
  /** L'abréviation du livre, affichée entre parenthèses sur la fiche. */
  abrege: string
}

export const TAILLES: Record<CategorieTaille, FicheTaille> = {
  'Infime':      { modificateur: +8, discretion: +16, charge: 1 / 8, abrege: 'I' },
  'Minuscule':   { modificateur: +4, discretion: +12, charge: 1 / 4, abrege: 'Min' },
  'Très petite': { modificateur: +2, discretion: +8,  charge: 1 / 2, abrege: 'TP' },
  'Petite':      { modificateur: +1, discretion: +4,  charge: 3 / 4, abrege: 'P' },
  'Moyenne':     { modificateur: 0,  discretion: 0,   charge: 1,     abrege: 'M' },
  'Grande':      { modificateur: -1, discretion: -4,  charge: 2,     abrege: 'G' },
  'Très grande': { modificateur: -2, discretion: -8,  charge: 4,     abrege: 'TG' },
  'Gigantesque': { modificateur: -4, discretion: -12, charge: 8,     abrege: 'Gig' },
  'Colossale':   { modificateur: -8, discretion: -16, charge: 16,    abrege: 'C' },
}

/**
 * La catégorie écrite en base (`races.taille`) vers celle du livre.
 *
 * ⚠ La colonne est un `varchar(20)` libre, avec un défaut à 'Moyenne'. Les
 * 32 races du catalogue ne portent aujourd'hui que 'Moyenne' et 'Petite'
 * (mesuré le 2026-11-16), mais rien n'empêche une saisie au masculin, abrégée,
 * ou accentuée autrement. On accepte donc les trois formes plutôt que la seule
 * qui existe aujourd'hui.
 *
 * ⛔ Une valeur inconnue — ou NULL, le cas des 3 fiches sans race — rend
 * `null`, et l'appelant ne compte AUCUN modificateur. Deviner « Moyenne »
 * donnerait le même chiffre mais mentirait sur la fiche : le détail affiché
 * dirait « taille (Moyenne) » d'un personnage dont on ignore la taille.
 */
export function categorieTaille(brut: string | null | undefined): CategorieTaille | null {
  if (!brut) return null
  const n = brut.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Les formes rencontrées ou plausibles, par catégorie. L'ordre importe :
  // « tres petite » doit être testé avant « petite ».
  const formes: [CategorieTaille, string[]][] = [
    ['Infime', ['infime', 'i']],
    ['Minuscule', ['minuscule', 'min']],
    ['Très petite', ['tres petite', 'tres petit', 'tp']],
    ['Petite', ['petite', 'petit', 'p']],
    ['Moyenne', ['moyenne', 'moyen', 'm']],
    ['Grande', ['grande', 'grand', 'g']],
    ['Très grande', ['tres grande', 'tres grand', 'tg']],
    ['Gigantesque', ['gigantesque', 'gig']],
    ['Colossale', ['colossale', 'colossal', 'c']],
  ]
  // ⚠ « tres petite » contient « petite » : on cherche l'égalité, jamais
  // l'inclusion. Un `includes` classerait TP en P et lui donnerait +1 au lieu
  // de +2.
  for (const [cat, mots] of formes) if (mots.includes(n)) return cat
  return null
}

/** Le modificateur de taille à la CA et aux jets d'attaque. 0 si inconnue. */
export function modificateurTaille(brut: string | null | undefined): number {
  const cat = categorieTaille(brut)
  return cat ? TAILLES[cat].modificateur : 0
}

/** Le modificateur de taille aux tests de Discrétion. 0 si inconnue. */
export function modificateurDiscretion(brut: string | null | undefined): number {
  const cat = categorieTaille(brut)
  return cat ? TAILLES[cat].discretion : 0
}

/**
 * Le multiplicateur de charge transportable. 1 si la taille est inconnue —
 * c'est-à-dire le comportement d'avant, pour qu'une fiche sans race ne voie pas
 * ses seuils bouger.
 */
export function multiplicateurCharge(brut: string | null | undefined): number {
  const cat = categorieTaille(brut)
  return cat ? TAILLES[cat].charge : 1
}

/** « Petite (P) » — pour la ligne de détail de la fiche et la bande du papier. */
export function libelleTaille(brut: string | null | undefined): string | null {
  const cat = categorieTaille(brut)
  return cat ? `${cat} (${TAILLES[cat].abrege})` : null
}

/** « +1 », « −1 », « +0 » — le signe est porteur de sens, on ne l'omet jamais. */
export function signe(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`
}

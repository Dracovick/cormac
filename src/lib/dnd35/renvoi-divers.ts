import { type BonusItem, sommeBonus } from './feat-bonuses'

/**
 * LE RENVOI DES CASES « DIVERS » DE LA FEUILLE IMPRIMÉE
 *
 * Le tableau des jets de sauvegarde et la case d'initiative du papier ont une
 * colonne « Divers » qui portait le vide alors que leurs totaux comptaient déjà
 * les dons de sauvegarde, Science de l'initiative, le bonus saisi à la fiche et
 * la Grâce du Bretteur. La case porte maintenant le chiffre — et ce renvoi dit
 * d'où il vient, dans la bande de titre du tableau.
 *
 * ⚠ Il DOIT tenir sur une seule ligne. La bande est la seule place gratuite de
 * la page : dès que le texte boucle, la bande grandit et la feuille la plus
 * serrée gagne une page entière. Mesuré au PDF le 12 novembre 2026 sur la
 * feuille de Lucky [20] (4 pages) : 155 caractères tiennent, 160 non.
 *
 * ⛔ Et la largeur mesurée à l'écran ne vaut rien pour en juger : la bande y
 * fait 779 px contre ~652 px à l'impression. Un renvoi de 604 px tenait sur une
 * ligne à l'écran — hauteur de bande inchangée, 21 px — et bouclait pourtant sur
 * le papier, qui sortait une page de plus. Seul le PDF juge.
 *
 * D'où trois formes, de la plus bavarde à la plus sûre. La dernière tient
 * toujours : quatre jets et leur total font une soixantaine de caractères.
 */
export interface JetDivers {
  /** Le libellé court du jet : « Init. », « Réflexes », « Vigueur », « Volonté ». */
  jet: string
  sources: BonusItem[]
}

/** 155 caractères tiennent à l'impression ; 145 garde la marge d'une police substituée. */
export const SEUIL_RENVOI_DIVERS = 145

const signe = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
/** « don : Volonté de fer » → « Volonté de fer » : la section Dons et Pouvoirs le dit déjà. */
const nomCourt = (label: string) => label.replace(/^don\s*:\s*/i, '')
/** La condition réduite à sa première proposition, et « intermédiaire » abrégé. */
const conditionCourte = (c: string) =>
  c.split(',')[0].replace(/interm[ée]diaire/gi, 'interm.').trim()

export function renvoiCasesDivers(
  jets: JetDivers[],
  seuil: number = SEUIL_RENVOI_DIVERS,
): string | null {
  const retenus = jets.filter(j => j.sources.length > 0)
  if (retenus.length === 0) return null

  const assemble = (f: (s: BonusItem) => string) =>
    'Divers — ' + retenus.map(({ jet, sources }) => `${jet} : ${sources.map(f).join(', ')}`).join(' · ')

  const avecCondition = assemble(s =>
    `${nomCourt(s.label)} ${signe(s.value)}${s.conditional ? ` (${conditionCourte(s.conditional)})` : ''}`)
  if (avecCondition.length <= seuil) return avecCondition

  const sansCondition = assemble(s => `${nomCourt(s.label)} ${signe(s.value)}`)
  if (sansCondition.length <= seuil) return sansCondition

  // Repli garanti : le jet et son total, sans nommer les sources.
  return 'Divers — '
    + retenus.map(({ jet, sources }) => `${jet} ${signe(sommeBonus(sources))}`).join(' · ')
    + ' — détail à l’écran'
}

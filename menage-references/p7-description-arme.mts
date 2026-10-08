/**
 * La description d'une entrée du catalogue d'armes, telle qu'elle est stockée.
 *
 * Extrait de p7-armes-semer.mts pour que le semis (p7) et la seconde passe
 * sur les six fiches qui portaient une note d'André (p9) écrivent exactement
 * le même texte. Deux copies auraient dérivé, et le catalogue se serait
 * retrouvé avec deux formes de fiche selon le script qui l'a touchée.
 */
export type EntreeArme = {
  nom: string; famille: string; prix: number | null
  degatsP: string | null; degats: string | null
  critMin: number | null; critMult: number | null
  portee: number | null; poids: number | null; type: string | null
  description: string; allonge?: boolean; double?: boolean; nonLetal?: boolean
}

/** La description finale porte les notes de table du livre. */
export function descriptionComplete(e: EntreeArme): string {
  const notes: string[] = []
  if (e.allonge) notes.push('Arme à allonge.')
  if (e.double) notes.push('Arme double.')
  if (e.nonLetal) notes.push('Inflige des dégâts non-létaux.')
  const bloc = notes.length ? `\n\n*${notes.join(' ')}*` : ''
  const degP = e.degatsP ? `\n\n*Dégâts pour une arme de taille P : ${e.degatsP}.*` : ''
  return `${e.description}${bloc}${degP}\n\n*[Manuel des Joueurs, table 7-5 et chapitre 7]*`
}

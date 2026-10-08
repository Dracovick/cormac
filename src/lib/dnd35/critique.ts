/**
 * La ligne de critique d'une arme — une seule façon de l'écrire dans tout le
 * Grimoire, et une seule façon de la relire.
 *
 * Le Manuel n'écrit jamais « 20-20 » : une arme qui ne critique que sur un 20
 * naturel porte son multiplicateur seul (« ×3 » pour la lance, l'arc long…).
 * La zone n'apparaît que lorsqu'elle est élargie (« 19-20/×2 », « 18-20/×2 »).
 */

/** « 19-20/×2 » quand la zone est élargie, « ×2 » quand elle est de 20 seul. */
export function formatCritique(min: number | null | undefined, mult: number | null | undefined): string {
  const m = min ?? 20
  const x = mult ?? 2
  return m > 1 && m < 20 ? `${m}-20/×${x}` : `×${x}`
}

/**
 * Relit une saisie libre : « 19-20/×2 », « 19/×2 », « 20-20 ×3 », « ×3 », « x3 ».
 * Le multiplicateur est obligatoire — sans lui on ne devine rien (null).
 * Une zone absente vaut 20, comme à la table.
 */
export function parseCritique(saisie: string): { min: number; mult: number } | null {
  const mult = saisie.match(/[×x]\s*(\d+)/i)
  if (!mult) return null
  const zone = saisie.match(/(\d+)\s*-\s*20/) ?? saisie.match(/^\s*(\d+)\s*\//)
  const min = zone ? parseInt(zone[1]) : 20
  return { min: min >= 1 && min <= 20 ? min : 20, mult: parseInt(mult[1]) }
}

/** Remet une saisie (ou un gabarit du catalogue) dans la forme canonique. */
export function normaliserCritique(saisie: string): string {
  const lu = parseCritique(saisie)
  return lu ? formatCritique(lu.min, lu.mult) : saisie
}

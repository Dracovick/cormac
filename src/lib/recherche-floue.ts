import { normaliserNom } from '@/lib/noms'

/**
 * Recherche tolérante dans un catalogue de noms — le moteur des champs à
 * suggestions (potions d'abord, armes/objets ensuite).
 *
 * Tolère ce qu'un joueur tape vraiment en pleine partie :
 *   - casse et accents        « potion »      trouve « Potion »
 *   - singulier/pluriel       « soin »        trouve « soins »
 *   - mots incomplets         « gran »        trouve « grands »
 *   - coquilles proches       « posion »      trouve « potion »
 *
 * Chaque mot tapé doit se retrouver dans le nom (dans n'importe quel ordre) :
 * c'est ce qui permet « soins importants » comme « importants soins ».
 */

/** Distance de Levenshtein, bornée : abandonne dès que `max` est dépassé. */
function distanceBornee(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let ligneMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < ligneMin) ligneMin = cur[j]
    }
    if (ligneMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** Retire la marque du pluriel — « soins » et « soin » désignent la même potion. */
function singulier(mot: string): string {
  return mot.length > 3 && (mot.endsWith('s') || mot.endsWith('x')) ? mot.slice(0, -1) : mot
}

function decoupe(texte: string): string[] {
  // Apostrophes et parenthèses séparent aussi : « Fiole d'eau Bénite » doit
  // répondre à « eau benite », « Potion Xenaton (verte) » à « xenaton verte ».
  return normaliserNom(texte).split(/[\s'’()]+/).filter(m => m.length > 1).map(singulier)
}

/** 2 = préfixe exact, 1 = coquille tolérée, 0 = pas de correspondance. */
function scoreMot(requete: string, cible: string): number {
  if (cible.startsWith(requete)) return 2
  const tolerance = requete.length >= 7 ? 2 : requete.length >= 4 ? 1 : 0
  if (tolerance === 0) return 0
  // Comparer aussi au préfixe de la cible : « posio » doit trouver « potion ».
  const tronque = cible.slice(0, Math.max(requete.length, Math.min(cible.length, requete.length + tolerance)))
  return distanceBornee(requete, tronque, tolerance) <= tolerance ? 1 : 0
}

export type ResultatFlou<T> = { item: T; score: number }

/** Score d'une requête contre UN nom : 0 si un mot tapé reste introuvable. */
function scoreNom(motsRequete: string[], motsNom: string[]): number {
  let total = 0
  for (const q of motsRequete) {
    let meilleur = 0
    for (const t of motsNom) {
      const s = scoreMot(q, t)
      if (s > meilleur) meilleur = s
      if (meilleur === 2) break
    }
    if (meilleur === 0) return 0
    total += meilleur
  }
  // Petit bonus quand le nom commence par le premier mot tapé.
  if (motsNom[0].startsWith(motsRequete[0])) total += 1
  return total
}

/**
 * Filtre et trie `items` selon la saisie. Chaque mot tapé doit correspondre à
 * un mot du nom — ou d'un même alias (ancien nom que les joueurs tapent encore
 * par réflexe) — et les meilleures correspondances remontent en tête.
 */
export function chercherFloue<T>(
  saisie: string,
  items: T[],
  nomDe: (item: T) => string,
  limite = 8,
  aliasDe?: (item: T) => string[],
): T[] {
  const motsRequete = decoupe(saisie)
  if (motsRequete.length === 0) return []
  const resultats: ResultatFlou<T>[] = []
  for (const item of items) {
    const motsNom = decoupe(nomDe(item))
    if (motsNom.length === 0) continue
    let score = scoreNom(motsRequete, motsNom)
    // Un alias reconnu propose le nom officiel, mais derrière un match direct.
    for (const alias of aliasDe?.(item) ?? []) {
      const motsAlias = decoupe(alias)
      if (motsAlias.length === 0) continue
      const s = scoreNom(motsRequete, motsAlias)
      if (s > 0 && s - 1 > score) score = s - 1
    }
    if (score <= 0) continue
    resultats.push({ item, score })
  }
  resultats.sort((a, b) => b.score - a.score || nomDe(a.item).localeCompare(nomDe(b.item), 'fr'))
  return resultats.slice(0, limite).map(r => r.item)
}

/** Vrai si la saisie correspond déjà, aux accents et à la casse près, à un nom du catalogue. */
export function existeAuCatalogue<T>(saisie: string, items: T[], nomDe: (item: T) => string): boolean {
  const cible = normaliserNom(saisie)
  if (!cible) return false
  return items.some(i => normaliserNom(nomDe(i)) === cible)
}

// ─── Monnaies du Grimoire ────────────────────────────────────────────────────
// Les six monnaies déjà en place dans le projet. Les taux sont ceux du Manuel
// des Joueurs 3.5 (chapitre 7, table Pièces de monnaie), la pièce d'or servant
// de référence.
//
// ⚠ Le MITHRAL (PM) est une monnaie maison. Aucun taux de change n'est défini
// nulle part dans le projet — la page d'aide le décrit comme « monnaie de
// prestige ». `enPo: null` le tient donc HORS des totaux convertis : mieux vaut
// ne rien afficher qu'un chiffre inventé.

export type UniteMonnaie = 'pp' | 'po' | 'pe' | 'pa' | 'pc' | 'pm'

export const UNITES_MONNAIE: { code: UniteMonnaie; label: string; nom: string; enPo: number | null }[] = [
  { code: 'pp', label: 'PP', nom: 'Platine',   enPo: 10 },
  { code: 'po', label: 'PO', nom: 'Or',        enPo: 1 },
  { code: 'pe', label: 'PE', nom: 'Électrum',  enPo: 0.5 },
  { code: 'pa', label: 'PA', nom: 'Argent',    enPo: 0.1 },
  { code: 'pc', label: 'PC', nom: 'Cuivre',    enPo: 0.01 },
  { code: 'pm', label: 'PM', nom: 'Mithral',   enPo: null },
]

export function uniteInfo(code: string) {
  return UNITES_MONNAIE.find(u => u.code === code) ?? UNITES_MONNAIE[1]
}

/** Étiquette courte d'une unité : « po » → « p.o. » */
export function uniteCourte(code: string) {
  return `p.${code.slice(1)}.`
}

/** Valeur convertie en pièces d'or. `null` si l'unité n'a pas de taux (mithral). */
export function enPieceOr(valeur: number, unite: string): number | null {
  const taux = uniteInfo(unite).enPo
  return taux === null ? null : valeur * taux
}

export type GemmeValeur = { quantite: number; valeur: number; unite: string }

/**
 * Total d'un lot de gemmes.
 * - `po` : somme convertie en pièces d'or des gemmes dont l'unité a un taux.
 * - `horsTotal` : ce qui n'a pas pu être converti (mithral), unité par unité,
 *   pour l'afficher à part plutôt que de le perdre en silence.
 */
export function totalGemmes(gemmes: GemmeValeur[]): { po: number; horsTotal: { unite: string; total: number }[] } {
  let po = 0
  const hors = new Map<string, number>()
  for (const g of gemmes) {
    const qte = g.quantite || 0
    const val = g.valeur || 0
    if (qte <= 0 || val === 0) continue
    const converti = enPieceOr(val * qte, g.unite)
    if (converti === null) hors.set(g.unite, (hors.get(g.unite) ?? 0) + val * qte)
    else po += converti
  }
  return { po, horsTotal: [...hors.entries()].map(([unite, total]) => ({ unite, total })) }
}

/** Formatage court d'un montant en po : 1 234,5 po (sans décimales inutiles). */
export function formatPo(n: number) {
  const arrondi = Math.round(n * 100) / 100
  return arrondi.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

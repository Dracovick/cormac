// ─── Équipement courant : les règles de saisie, en un seul endroit ───────────
// La corde, le miroir, les outils de voleur, les rations. Demandé par André le
// 2026-11-12, modifiable depuis la fiche ET depuis le formulaire (drizzle/0017).
//
// Trois écrans parlent de cet équipement — la fiche, le formulaire de
// modification, la feuille imprimée — et ils doivent dire la MÊME chose. Les
// garde-fous et le formatage vivent donc ici, hors du fichier 'use server' :
// une action serveur ne peut exporter que des fonctions async, ce qui les
// rendait intestables. Une règle recopiée dans trois écrans est une règle qui
// finit par diverger dans deux d'entre eux.

import { UNITES_MONNAIE } from '@/lib/dnd35/monnaie'

export const MAX_NOM_EQUIPEMENT = 200
export const MAX_EMPLACEMENT_EQUIPEMENT = 100
export const MAX_NOTE_EQUIPEMENT = 500
/** Une pièce ne pèse pas 10 tonnes et ne vaut pas le trésor d'un dragon entier. */
export const MAX_POIDS_EQUIPEMENT = 9_999
export const MAX_VALEUR_EQUIPEMENT = 99_999_999
export const MAX_QUANTITE_EQUIPEMENT = 99_999

/** Ce que le navigateur envoie : tout est douteux jusqu'à vérification. */
export type SaisieEquipement = {
  nom?: string | null
  quantite?: number | string | null
  emplacement?: string | null
  valeur?: number | string | null
  unite?: string | null
  poids?: number | string | null
  notes?: string | null
}

/** Ce qui part en base. `null` = non renseigné, et le reste ainsi. */
export type ValeursEquipement = {
  nom: string
  quantite: number
  emplacement: string | null
  valeur: string | null
  unite: string
  poids: string | null
  notes: string | null
}

function nettoie(s: string | undefined | null, max: number): string {
  return (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function quantiteEquipement(n: unknown): number {
  const v = typeof n === 'string' ? Number(n.replace(/[^\d-]/g, '')) : Number(n)
  if (!Number.isFinite(v)) return 1
  return Math.min(MAX_QUANTITE_EQUIPEMENT, Math.max(1, Math.trunc(v)))
}

/**
 * Un nombre décimal, ou `null`.
 *
 * ⛔ `null` ne se replie JAMAIS sur 0, et c'est la règle centrale de tout ce
 * fichier : « non pesé » n'est pas « ne pèse rien ». Un 0 par défaut ferait
 * entrer un sac à dos de 0 kg dans la charge portée comme s'il avait été mesuré,
 * et afficherait « 0 po » sur un objet dont personne n'a fixé le prix.
 *
 * ⚠ La virgule est acceptée : on tape « 1,5 » au Québec, pas « 1.5 ».
 */
export function decimalEquipement(n: unknown, max: number): number | null {
  if (n == null) return null
  const t = typeof n === 'string' ? n.replace(',', '.').trim() : n
  if (t === '') return null
  const v = Number(t)
  if (!Number.isFinite(v) || v < 0 || v > max) return null
  return Math.round(v * 100) / 100
}

export function uniteEquipement(code: string | undefined | null): string {
  return UNITES_MONNAIE.some(u => u.code === code) ? (code as string) : 'po'
}

/** Les valeurs à écrire en base, à partir de ce que le navigateur a envoyé. */
export function valeursEquipement(ligne: SaisieEquipement): ValeursEquipement {
  const valeur = decimalEquipement(ligne.valeur, MAX_VALEUR_EQUIPEMENT)
  const poids = decimalEquipement(ligne.poids, MAX_POIDS_EQUIPEMENT)
  return {
    nom: nettoie(ligne.nom, MAX_NOM_EQUIPEMENT),
    quantite: quantiteEquipement(ligne.quantite),
    emplacement: nettoie(ligne.emplacement, MAX_EMPLACEMENT_EQUIPEMENT) || null,
    valeur: valeur != null ? valeur.toString() : null,
    unite: uniteEquipement(ligne.unite),
    poids: poids != null ? poids.toString() : null,
    notes: nettoie(ligne.notes, MAX_NOTE_EQUIPEMENT) || null,
  }
}

/** Une ligne telle qu'un écran la lit. */
export type LigneEquipement = {
  quantite?: number | null
  poids?: number | null
}

/**
 * Le poids du LOT en kilogrammes : poids à la pièce × quantité.
 * `0` quand la ligne n'est pas pesée — l'appelant doit alors compter la ligne
 * parmi les non pesées plutôt que de la croire sans poids.
 */
export function poidsLotEquipement(l: LigneEquipement): number {
  if (l.poids == null) return 0
  return l.poids * (l.quantite != null && l.quantite > 0 ? l.quantite : 1)
}

/** Le poids total des lignes PESÉES, et le compte de celles qui ne le sont pas. */
export function poidsEquipement(lignes: LigneEquipement[]): { total: number; nonPesees: number } {
  let total = 0
  let nonPesees = 0
  for (const l of lignes) {
    if (l.poids == null) nonPesees++
    else total += poidsLotEquipement(l)
  }
  return { total: Math.round(total * 100) / 100, nonPesees }
}

/**
 * Un nombre tel qu'on l'écrit sur une fiche : « 2,5 », « 5 », « 0 ».
 * Virgule décimale, zéros décoratifs retirés — une feuille de personnage
 * n'affiche pas « 5,00 kg ».
 */
export function nombreLisible(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '').replace('.', ',') || '0'
}

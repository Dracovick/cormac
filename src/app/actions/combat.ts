'use server'

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { and, desc, eq, gte, isNotNull, lt } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logJournal } from '@/lib/journal'
import { marquerRound } from '@/app/actions/journal'
import { decalageQuebec, COUPURE_JOURNEE_H } from '@/lib/journal-format'
import { getFeatPassiveBonuses, sommeBonus } from '@/lib/dnd35/feat-bonuses'
import { calculeBonusEffetsCarac } from '@/lib/dnd35/spell-effects'

// ─── Ordre d'initiative (vue du MJ) ──────────────────────────────────────────
// L'app ne lance aucun dé : les joueurs lancent leur vrai d20, le MJ entre les
// résultats bruts, et le modificateur de chaque fiche (DEX, dons, divers) est
// ajouté automatiquement. Un seul combat actif à la fois; le journal garde la
// trace (début, rounds, fin, bilan) via les mêmes marqueurs qu'avant.

export type Combattant = {
  cle: string               // identifiant stable dans le combat (c0, c1…)
  nom: string
  personnageId: number | null // null = adversaire du MJ
  mod: number               // modificateur d'initiative complet
  jet: number               // d20 brut entré par le MJ
  total: number             // jet + mod
  agi: boolean              // a déjà agi — sinon « pris au dépourvu » (PHB 3.5)
}

export type CombatActif = {
  id: number
  round: number
  tourIndex: number
  combattants: Combattant[]
}

function lireCombattants(json: string): Combattant[] {
  try {
    const liste = JSON.parse(json)
    return Array.isArray(liste) ? liste : []
  } catch {
    return []
  }
}

export async function getCombatActif(): Promise<CombatActif | null> {
  const [c] = await getDb()
    .select()
    .from(schema.combats)
    .where(eq(schema.combats.statut, 'actif'))
    .orderBy(desc(schema.combats.id))
    .limit(1)
  if (!c) return null
  return { id: c.id, round: c.round, tourIndex: c.tourIndex, combattants: lireCombattants(c.combattants) }
}

async function sauverCombat(id: number, c: Pick<CombatActif, 'round' | 'tourIndex' | 'combattants'>) {
  await getDb()
    .update(schema.combats)
    .set({ round: c.round, tourIndex: c.tourIndex, combattants: JSON.stringify(c.combattants), updatedAt: new Date() })
    .where(and(eq(schema.combats.id, id), eq(schema.combats.statut, 'actif')))
  revalidatePath('/partie')
}

// ─── Personnages proposés au panneau de préparation ──────────────────────────
// Le modificateur d'initiative est recalculé comme sur la fiche : mod de DEX
// (base + magique + race + effets de sorts actifs) + dons passifs + divers.
export type PersonnageInitiative = {
  id: number
  nom: string
  mod: number
  actif: boolean   // a agi dans la journée ludique consultée
  detail: string   // ex. « DEX +5 · don +4 · divers +1 »
}

export async function getPersonnagesInitiative(dateStr: string): Promise<PersonnageInitiative[]> {
  const db = getDb()
  const debut = new Date(`${dateStr}T${String(COUPURE_JOURNEE_H).padStart(2, '0')}:00:00${decalageQuebec(dateStr)}`)
  const fin = new Date(debut.getTime() + 24 * 3600_000)
  const [persos, featsRows, effetsDex, actifs] = await Promise.all([
    db.select({
      id: schema.characters.id,
      nom: schema.characters.nom,
      dexBase: schema.characterAbilityScores.dexBase,
      dexMagique: schema.characterAbilityScores.dexMagique,
      bonusDexRace: schema.races.bonusDex,
      initiativeBonus: schema.characterCombatStats.initiativeBonus,
    })
      .from(schema.characters)
      .leftJoin(schema.characterAbilityScores, eq(schema.characterAbilityScores.personnageId, schema.characters.id))
      .leftJoin(schema.characterCombatStats, eq(schema.characterCombatStats.personnageId, schema.characters.id))
      .leftJoin(schema.races, eq(schema.characters.raceId, schema.races.id)),
    db.select({
      personnageId: schema.characterFeats.personnageId,
      nom: schema.feats.nom,
    })
      .from(schema.characterFeats)
      .innerJoin(schema.feats, eq(schema.characterFeats.featId, schema.feats.id)),
    db.select({
      id: schema.characterSpellEffects.id,
      personnageId: schema.characterSpellEffects.personnageId,
      nom: schema.characterSpellEffects.nom,
      cible: schema.characterSpellEffects.cible,
      typeBonus: schema.characterSpellEffects.typeBonus,
      valeur: schema.characterSpellEffects.valeur,
    })
      .from(schema.characterSpellEffects)
      .where(eq(schema.characterSpellEffects.cible, 'DEX')),
    db.selectDistinct({ id: schema.characterJournal.personnageId })
      .from(schema.characterJournal)
      .where(and(
        isNotNull(schema.characterJournal.personnageId),
        gte(schema.characterJournal.createdAt, debut),
        lt(schema.characterJournal.createdAt, fin)
      )),
  ])

  const featsPar = new Map<number, string[]>()
  for (const f of featsRows) {
    const liste = featsPar.get(f.personnageId) ?? []
    liste.push(f.nom)
    featsPar.set(f.personnageId, liste)
  }
  const effetsPar = new Map<number, typeof effetsDex>()
  for (const e of effetsDex) {
    const liste = effetsPar.get(e.personnageId) ?? []
    liste.push(e)
    effetsPar.set(e.personnageId, liste)
  }
  const actifsIds = new Set(actifs.map(a => a.id))

  return persos
    .map(p => {
      const { bonus } = calculeBonusEffetsCarac(effetsPar.get(p.id) ?? [])
      const dexT = (p.dexBase ?? 10) + (p.dexMagique ?? 0) + (p.bonusDexRace ?? 0) + bonus.DEX
      const dexMod = Math.floor((dexT - 10) / 2)
      const dons = sommeBonus(getFeatPassiveBonuses(featsPar.get(p.id) ?? []).initiative)
      const divers = p.initiativeBonus ?? 0
      const morceaux = [`DEX ${dexMod >= 0 ? '+' : ''}${dexMod}`]
      if (dons !== 0) morceaux.push(`don +${dons}`)
      if (divers !== 0) morceaux.push(`divers ${divers > 0 ? '+' : ''}${divers}`)
      return {
        id: p.id,
        nom: p.nom,
        mod: dexMod + dons + divers,
        actif: actifsIds.has(p.id),
        detail: morceaux.join(' · '),
      }
    })
    .sort((a, b) => Number(b.actif) - Number(a.actif) || a.nom.localeCompare(b.nom, 'fr'))
}

// ─── Déroulement du combat ───────────────────────────────────────────────────

export type EntrantCombat = { nom: string; personnageId: number | null; mod: number; jet: number }

function entrantValide(e: EntrantCombat): boolean {
  return e.nom.trim().length > 0
    && Number.isInteger(e.jet) && e.jet >= 1 && e.jet <= 50
    && Number.isInteger(e.mod) && e.mod >= -20 && e.mod <= 50
}

// Tri du PHB 3.5 : total décroissant; à égalité, le modificateur d'initiative le
// plus élevé agit en premier. Égalité parfaite : ordre de saisie (le MJ départage
// d'un jet et ajuste avec ↑↓ — l'écran signale le cas).
function trierCombat(liste: Combattant[]): Combattant[] {
  return [...liste].sort((a, b) => b.total - a.total || b.mod - a.mod)
}

export async function demarrerCombat(entrants: EntrantCombat[]) {
  const propres = entrants.filter(entrantValide).slice(0, 40)
  if (propres.length === 0) return
  const db = getDb()
  // Un seul combat actif : un combat oublié en cours est clos sans bilan
  await db.update(schema.combats).set({ statut: 'termine', updatedAt: new Date() })
    .where(eq(schema.combats.statut, 'actif'))

  const combattants = trierCombat(propres.map((e, i) => ({
    cle: `c${i}`,
    nom: e.nom.trim().slice(0, 100),
    personnageId: e.personnageId,
    mod: e.mod,
    jet: e.jet,
    total: e.jet + e.mod,
    agi: false,
  })))
  await db.insert(schema.combats).values({ combattants: JSON.stringify(combattants) })

  await logJournal(null, 'round', 'Début du combat — round 1', 1)
  const ordre = combattants.map(c => `${c.nom} ${c.total}`).join(', ')
  await logJournal(null, 'note', `⚔ Ordre d'initiative — ${ordre}`)
  revalidatePath('/partie')
}

export async function tourSuivant() {
  const combat = await getCombatActif()
  if (!combat || combat.combattants.length === 0) return
  const courant = combat.combattants[combat.tourIndex]
  if (courant) courant.agi = true
  let tourIndex = combat.tourIndex + 1
  let round = combat.round
  if (tourIndex >= combat.combattants.length) {
    tourIndex = 0
    round += 1
    await logJournal(null, 'round', `Round ${round}`, round)
  }
  await sauverCombat(combat.id, { round, tourIndex, combattants: combat.combattants })
}

// Monte ou descend un combattant d'un rang (départage d'égalité, action retardée).
// Le marqueur ▶ reste sur la même POSITION : descendre le combattant courant passe
// le tour au suivant — c'est exactement « retarder » du PHB 3.5.
export async function deplacerCombattant(cle: string, direction: -1 | 1) {
  const combat = await getCombatActif()
  if (!combat) return
  const i = combat.combattants.findIndex(c => c.cle === cle)
  const j = i + direction
  if (i < 0 || j < 0 || j >= combat.combattants.length) return
  const liste = combat.combattants
  ;[liste[i], liste[j]] = [liste[j], liste[i]]
  await sauverCombat(combat.id, { round: combat.round, tourIndex: combat.tourIndex, combattants: liste })
}

export async function retirerCombattant(cle: string) {
  const combat = await getCombatActif()
  if (!combat) return
  const i = combat.combattants.findIndex(c => c.cle === cle)
  if (i < 0) return
  const liste = combat.combattants.filter(c => c.cle !== cle)
  let tourIndex = combat.tourIndex
  if (i < tourIndex) tourIndex -= 1
  if (tourIndex >= liste.length) tourIndex = 0
  await sauverCombat(combat.id, { round: combat.round, tourIndex, combattants: liste })
}

// Un renfort en plein combat : il s'insère au rang de son total d'initiative
// (règle du nouveau venu) et reste « pris au dépourvu » jusqu'à sa première action.
export async function ajouterCombattant(entrant: EntrantCombat) {
  if (!entrantValide(entrant)) return
  const combat = await getCombatActif()
  if (!combat) return
  const n = combat.combattants.reduce((max, c) => Math.max(max, parseInt(c.cle.slice(1), 10) || 0), 0) + 1
  const nouveau: Combattant = {
    cle: `c${n}`,
    nom: entrant.nom.trim().slice(0, 100),
    personnageId: entrant.personnageId,
    mod: entrant.mod,
    jet: entrant.jet,
    total: entrant.jet + entrant.mod,
    agi: false,
  }
  const liste = combat.combattants
  let pos = liste.findIndex(c => c.total < nouveau.total || (c.total === nouveau.total && c.mod < nouveau.mod))
  if (pos < 0) pos = liste.length
  liste.splice(pos, 0, nouveau)
  let tourIndex = combat.tourIndex
  if (pos <= tourIndex) tourIndex += 1 // le tour courant ne change pas de main
  await sauverCombat(combat.id, { round: combat.round, tourIndex, combattants: liste })
}

export async function terminerCombat() {
  const combat = await getCombatActif()
  if (!combat) return
  await getDb().update(schema.combats).set({ statut: 'termine', updatedAt: new Date() })
    .where(eq(schema.combats.id, combat.id))
  // Mêmes marqueurs qu'avant : « Fin du combat » + bilan (dégâts, sorts, rounds)
  await marquerRound('fin')
  revalidatePath('/partie')
}

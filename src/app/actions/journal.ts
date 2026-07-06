'use server'

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { and, desc, eq, gt, gte, isNotNull, isNull, like, lt, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logJournal } from '@/lib/journal'
import { decalageQuebec, COUPURE_JOURNEE_H } from '@/lib/journal-format'

export type EntreeJournal = {
  id: number
  personnageId: number | null
  type: string
  description: string
  valeur: number | null
  createdAt: Date
}

export type EntreeJournalPartie = EntreeJournal & { nomPersonnage: string | null }

// ─── Attaque à l'arme (bouton ⚔ au bout de chaque arme) ─────────────────────
export async function logAttaque(
  personnageId: number,
  nomArme: string,
  resultat: 'touche' | 'rate' | null,
  degats: number | null
) {
  let description = `Attaque avec ${nomArme}`
  if (resultat === 'touche') {
    description += degats && degats > 0 ? ` — touché, ${degats} dégâts` : ' — touché'
  } else if (resultat === 'rate') {
    description += ' — raté'
  }
  await logJournal(personnageId, 'attaque', description, degats ?? null)
  revalidatePath(`/personnage/${personnageId}`)
}

// ─── Marqueurs de combat (globaux : personnage_id null, partagés par la table) ──
export async function marquerRound(action: 'debut' | 'suivant' | 'fin') {
  if (action === 'debut') {
    await logJournal(null, 'round', 'Début du combat — round 1', 1)
  } else if (action === 'fin') {
    const bilan = await calculerBilanCombat()
    await logJournal(null, 'round', 'Fin du combat', null)
    if (bilan) await logJournal(null, 'bilan', bilan.texte, bilan.rounds)
  } else {
    // Round suivant : reprend le dernier numéro de round et l'incrémente
    const [dernier] = await getDb()
      .select({ valeur: schema.characterJournal.valeur })
      .from(schema.characterJournal)
      .where(eq(schema.characterJournal.type, 'round'))
      .orderBy(desc(schema.characterJournal.id))
      .limit(1)
    const n = dernier?.valeur != null ? dernier.valeur + 1 : 1
    await logJournal(null, 'round', `Round ${n}`, n)
  }
  revalidatePath('/partie')
}

// ─── Bilan de combat : statistiques depuis le dernier « Début du combat » ─────
// Appelé au 🕊 Fin — dégâts infligés/subis et sorts par personnage, nombre de rounds.
async function calculerBilanCombat(): Promise<{ texte: string; rounds: number } | null> {
  const db = getDb()
  const [debut] = await db
    .select({ id: schema.characterJournal.id })
    .from(schema.characterJournal)
    .where(and(
      eq(schema.characterJournal.type, 'round'),
      like(schema.characterJournal.description, 'Début du combat%')
    ))
    .orderBy(desc(schema.characterJournal.id))
    .limit(1)
  if (!debut) return null

  const entrees = await db
    .select({
      personnageId: schema.characterJournal.personnageId,
      type: schema.characterJournal.type,
      description: schema.characterJournal.description,
      valeur: schema.characterJournal.valeur,
      nom: schema.characters.nom,
    })
    .from(schema.characterJournal)
    .leftJoin(schema.characters, eq(schema.characterJournal.personnageId, schema.characters.id))
    .where(gt(schema.characterJournal.id, debut.id))

  let rounds = 1
  const stats = new Map<number, { nom: string; infliges: number; touches: number; rates: number; subis: number; sorts: number }>()
  for (const e of entrees) {
    if (e.type === 'round' && e.valeur != null) rounds = Math.max(rounds, e.valeur)
    if (e.personnageId == null) continue
    let s = stats.get(e.personnageId)
    if (!s) {
      s = { nom: e.nom ?? `#${e.personnageId}`, infliges: 0, touches: 0, rates: 0, subis: 0, sorts: 0 }
      stats.set(e.personnageId, s)
    }
    if (e.type === 'attaque') {
      if (e.description.includes('— touché')) { s.touches++; s.infliges += e.valeur ?? 0 }
      else if (e.description.includes('— raté')) s.rates++
    } else if (e.type === 'pv' && (e.valeur ?? 0) < 0) {
      s.subis += -(e.valeur ?? 0)
    } else if (e.type === 'sort') {
      s.sorts++
    }
  }
  if (stats.size === 0) return null

  const lignes = [...stats.values()].map(s => {
    const morceaux: string[] = []
    if (s.touches || s.rates) {
      morceaux.push(`${s.infliges} dégâts infligés (${s.touches} touché${s.touches > 1 ? 's' : ''}${s.rates ? `, ${s.rates} raté${s.rates > 1 ? 's' : ''}` : ''})`)
    }
    if (s.subis) morceaux.push(`${s.subis} subis`)
    if (s.sorts) morceaux.push(`${s.sorts} sort${s.sorts > 1 ? 's' : ''}`)
    return `${s.nom} : ${morceaux.length ? morceaux.join(', ') : 'a observé prudemment'}`
  })
  return {
    texte: `Bilan du combat — ${rounds} round${rounds > 1 ? 's' : ''}\n${lignes.join('\n')}`,
    rounds,
  }
}

// ─── État du groupe : PV actuels des personnages actifs d'une journée ─────────
export type EtatPersonnage = { id: number; nom: string; pvActuels: number | null; pvMax: number | null }

export async function getEtatGroupe(dateStr: string): Promise<EtatPersonnage[]> {
  const debut = new Date(`${dateStr}T${String(COUPURE_JOURNEE_H).padStart(2, '0')}:00:00${decalageQuebec(dateStr)}`)
  const fin = new Date(debut.getTime() + 24 * 3600_000)
  return getDb()
    .selectDistinct({
      id: schema.characters.id,
      nom: schema.characters.nom,
      pvActuels: schema.characterCombatStats.pvActuels,
      pvMax: schema.characterCombatStats.pvMax,
    })
    .from(schema.characterJournal)
    .innerJoin(schema.characters, eq(schema.characterJournal.personnageId, schema.characters.id))
    .leftJoin(schema.characterCombatStats, eq(schema.characterCombatStats.personnageId, schema.characters.id))
    .where(and(
      isNotNull(schema.characterJournal.personnageId),
      gte(schema.characterJournal.createdAt, debut),
      lt(schema.characterJournal.createdAt, fin)
    ))
}

// ─── Note du Maître de jeu (globale : visible par toute la table) ────────────
// Multiligne : sert autant aux petites remarques qu'aux résumés de fin de partie.
export async function ajouterNoteMJ(texte: string) {
  const t = texte.trim().slice(0, 4000)
  if (!t) return
  await logJournal(null, 'note', t)
  revalidatePath('/partie')
}

// ─── Suppression d'une entrée depuis la vue du MJ (toute entrée) ─────────────
export async function supprimerEntreePartie(id: number) {
  await getDb().delete(schema.characterJournal).where(eq(schema.characterJournal.id, id))
  revalidatePath('/partie')
}

// ─── Lecture du journal d'un personnage (+ marqueurs globaux de round) ────────
export async function getJournal(personnageId: number, limite = 300): Promise<EntreeJournal[]> {
  return getDb()
    .select()
    .from(schema.characterJournal)
    .where(or(
      eq(schema.characterJournal.personnageId, personnageId),
      isNull(schema.characterJournal.personnageId)
    ))
    .orderBy(desc(schema.characterJournal.id))
    .limit(limite)
}

// ─── Suppression d'une entrée (erreur de saisie) ─────────────────────────────
// Ne touche pas à l'état du personnage : c'est une gomme à effacer, pas un « annuler ».
export async function supprimerEntreeJournal(id: number, personnageId: number) {
  await getDb().delete(schema.characterJournal).where(
    and(
      eq(schema.characterJournal.id, id),
      or(
        eq(schema.characterJournal.personnageId, personnageId),
        isNull(schema.characterJournal.personnageId)
      )
    )
  )
  revalidatePath(`/personnage/${personnageId}`)
}

// ─── Journal du MJ : tous les personnages d'une journée ludique ───────────────
// La journée ludique va de 6 h du matin (heure du Québec) à 6 h le lendemain :
// une soirée qui déborde après minuit reste dans la même chronologie.
export async function getJournalPartie(dateStr: string): Promise<EntreeJournalPartie[]> {
  const debut = new Date(`${dateStr}T${String(COUPURE_JOURNEE_H).padStart(2, '0')}:00:00${decalageQuebec(dateStr)}`)
  const fin = new Date(debut.getTime() + 24 * 3600_000)
  return getDb()
    .select({
      id: schema.characterJournal.id,
      personnageId: schema.characterJournal.personnageId,
      type: schema.characterJournal.type,
      description: schema.characterJournal.description,
      valeur: schema.characterJournal.valeur,
      createdAt: schema.characterJournal.createdAt,
      nomPersonnage: schema.characters.nom,
    })
    .from(schema.characterJournal)
    .leftJoin(schema.characters, eq(schema.characterJournal.personnageId, schema.characters.id))
    .where(and(
      gte(schema.characterJournal.createdAt, debut),
      lt(schema.characterJournal.createdAt, fin)
    ))
    // Antichronologique : la dernière action en haut, le MJ n'a jamais à scroller
    .orderBy(desc(schema.characterJournal.id))
}

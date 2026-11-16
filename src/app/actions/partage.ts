'use server'

// ─── Le lien de partage d'une histoire : le créer, le révoquer ───────────────
// André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire.
// Lorsque je copie le lien de la page ce lien amène à l'accueil du site. »
//
// Ces deux actions sont des POST, donc soumises au mot de passe par le
// middleware — seul un GET sur `/histoire/<jeton>` en est exempté. Celui qui
// reçoit un lien de lecture ne peut donc ni en créer un autre, ni révoquer.
//
// La forme du jeton et l'alphabet vivent dans `@/lib/partage` : un fichier
// 'use server' ne peut exporter que des fonctions async, et le middleware (qui
// tourne sur Edge) a besoin du même préfixe.

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cheminPartage, nouveauJeton } from '@/lib/partage'

export type ResultatPartage = { ok: boolean; message: string; chemin?: string }

/**
 * Ouvrir le partage d'une histoire — ou retrouver le lien déjà ouvert.
 *
 * ⛔ Idempotent exprès : si un lien circule déjà, on le RENVOIE au lieu d'en
 * fabriquer un second. Deux clics sur « Partager » ne doivent pas périmer le
 * lien qu'on vient de coller dans un message — c'est précisément le geste
 * qu'André va faire.
 */
export async function ouvrirPartage(personnageId: number): Promise<ResultatPartage> {
  if (!Number.isInteger(personnageId) || personnageId <= 0) {
    return { ok: false, message: 'Personnage inconnu.' }
  }

  const db = getDb()

  // ⚠ L'existence du personnage est vérifiée AVANT d'insérer : la clé
  // étrangère le refuserait de toute façon, mais avec une erreur de base brute
  // à l'écran au lieu d'une phrase.
  const [personnage] = await db
    .select({ id: schema.characters.id })
    .from(schema.characters)
    .where(eq(schema.characters.id, personnageId))
  if (!personnage) return { ok: false, message: 'Personnage inconnu.' }

  const [existant] = await db
    .select({ jeton: schema.characterStoryShares.jeton })
    .from(schema.characterStoryShares)
    .where(eq(schema.characterStoryShares.personnageId, personnageId))

  if (existant) {
    return { ok: true, message: 'Lien de partage déjà ouvert', chemin: cheminPartage(existant.jeton) }
  }

  const jeton = nouveauJeton()
  await db.insert(schema.characterStoryShares).values({ personnageId, jeton })

  revalidatePath(`/personnage/${personnageId}/histoire`)
  return { ok: true, message: 'Lien de partage créé', chemin: cheminPartage(jeton) }
}

/**
 * Couper le lien. Définitif : le jeton est effacé, pas désactivé.
 *
 * ⭐ Un nouveau partage donnera une AUTRE adresse — celui à qui on avait donné
 * l'ancienne ne reviendra jamais dessus. C'est ce qu'on attend d'une
 * révocation, et c'est pour ça que la table ne porte pas de drapeau « actif ».
 */
export async function revoquerPartage(personnageId: number): Promise<ResultatPartage> {
  if (!Number.isInteger(personnageId) || personnageId <= 0) {
    return { ok: false, message: 'Personnage inconnu.' }
  }

  const retires = await getDb()
    .delete(schema.characterStoryShares)
    .where(eq(schema.characterStoryShares.personnageId, personnageId))
    .returning({ jeton: schema.characterStoryShares.jeton })

  revalidatePath(`/personnage/${personnageId}/histoire`)

  if (retires.length === 0) return { ok: false, message: 'Aucun lien de partage à couper.' }
  return { ok: true, message: 'Lien de partage révoqué — l’ancienne adresse ne répond plus' }
}

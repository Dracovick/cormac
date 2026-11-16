import { getDb } from '@/db'
import { asc, eq } from 'drizzle-orm'
import * as schema from '@/db/schema'

// ─── Ce que la page d'histoire a besoin de savoir, et rien de plus ───────────
// ⛔ Volontairement PAS `getCharacter()` : cette fonction-là ramène les
// caractéristiques, les sorts, les armes, les dons, le butin, les langues et les
// compagnons — une quinzaine de requêtes dont la page d'histoire n'affiche rien.
// Elle n'a besoin que d'un bandeau d'identité et des chapitres.

export type ChapitreHistoire = {
  id: number
  titre: string
  contenu: string
  ordre: number
  signature: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type HistoirePersonnage = {
  id: number
  nom: string
  surnom: string | null
  photoUrl: string | null
  race: string | null
  /** « Roublard 3 / Bretteur 2 » — le sous-titre du bandeau. */
  classes: string
  /** Le résumé court de la fiche, pour proposer de le reprendre en chapitre. */
  historique: string | null
  chapitres: ChapitreHistoire[]
  /**
   * Le jeton du lien de partage public, s'il en existe un (drizzle/0019).
   * NULL = aucun lien ne circule pour cette histoire.
   */
  jetonPartage: string | null
}

export async function getHistoire(id: number): Promise<HistoirePersonnage | null> {
  const db = getDb()

  const [personnage] = await db
    .select({
      id: schema.characters.id,
      nom: schema.characters.nom,
      surnom: schema.characters.surnom,
      photoUrl: schema.characters.photoUrl,
      historique: schema.characters.historique,
      race: schema.races.nom,
    })
    .from(schema.characters)
    .leftJoin(schema.races, eq(schema.characters.raceId, schema.races.id))
    .where(eq(schema.characters.id, id))

  if (!personnage) return null

  const [classes, chapitres, partages] = await Promise.all([
    db.select({ nom: schema.classes.nom, niveau: schema.characterClasses.niveau })
      .from(schema.characterClasses)
      .innerJoin(schema.classes, eq(schema.characterClasses.classeId, schema.classes.id))
      .where(eq(schema.characterClasses.personnageId, id)),

    db.select()
      .from(schema.characterStoryChapters)
      .where(eq(schema.characterStoryChapters.personnageId, id))
      // ⚠ `id` en second critère : deux chapitres peuvent partager un rang (ajoutés
      // à la même seconde depuis deux appareils), et sans ce départage leur ordre
      // d'affichage changerait d'un chargement à l'autre.
      .orderBy(asc(schema.characterStoryChapters.ordre), asc(schema.characterStoryChapters.id)),

    db.select({ jeton: schema.characterStoryShares.jeton })
      .from(schema.characterStoryShares)
      .where(eq(schema.characterStoryShares.personnageId, id)),
  ])

  return {
    ...personnage,
    classes: classes.map(c => `${c.nom} ${c.niveau}`).join(' / '),
    chapitres,
    jetonPartage: partages[0]?.jeton ?? null,
  }
}

/**
 * Juste ce qu'il faut à la FICHE pour annoncer l'histoire : combien de chapitres,
 * et quand on y a touché la dernière fois. Deux colonnes, pas la prose entière —
 * la fiche est déjà la page la plus lourde du Grimoire.
 */
export async function getApercuHistoire(id: number): Promise<{ nb: number; dernier: Date | null }> {
  const lignes = await getDb()
    .select({
      updatedAt: schema.characterStoryChapters.updatedAt,
    })
    .from(schema.characterStoryChapters)
    .where(eq(schema.characterStoryChapters.personnageId, id))

  const dernier = lignes.reduce<Date | null>((max, l) => {
    if (!l.updatedAt) return max
    return !max || l.updatedAt > max ? l.updatedAt : max
  }, null)

  return { nb: lignes.length, dernier }
}

/**
 * L'HISTOIRE PAR SON JETON DE PARTAGE — la porte publique.
 *
 * André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire. »
 * Cette fonction sert `/histoire/<jeton>`, la seule adresse du Grimoire qui
 * s'ouvre sans mot de passe (drizzle/0019).
 *
 * ⚠ La forme du jeton est vérifiée par l'appelant AVANT d'arriver ici
 * (`estJetonBienForme`) : un segment d'URL quelconque ne part pas en requête.
 * ⛔ Rend `null` — donc un 404 — pour un jeton inconnu ou révoqué. Jamais un
 * message qui distinguerait « jamais existé » de « révoqué » : les deux doivent
 * se ressembler vu du dehors.
 */
export async function getHistoireParJeton(jeton: string): Promise<HistoirePersonnage | null> {
  const [partage] = await getDb()
    .select({ personnageId: schema.characterStoryShares.personnageId })
    .from(schema.characterStoryShares)
    .where(eq(schema.characterStoryShares.jeton, jeton))

  if (!partage) return null
  return getHistoire(partage.personnageId)
}

/**
 * Ce jeton de partage existe-t-il ? Une ligne, pas l'histoire entière.
 *
 * Sert à `/api/pdf` avant de lancer Chromium : le middleware laisse passer sur
 * la seule FORME du jeton, et lancer un navigateur serverless pour 24
 * caractères inventés serait un robinet ouvert.
 */
export async function partageExiste(jeton: string): Promise<boolean> {
  const lignes = await getDb()
    .select({ id: schema.characterStoryShares.id })
    .from(schema.characterStoryShares)
    .where(eq(schema.characterStoryShares.jeton, jeton))
  return lignes.length > 0
}

import { pgTable, serial, varchar, text, integer, bigint } from 'drizzle-orm/pg-core'

/**
 * Les livres de jeu consultables en entier — un rayon de la Grande Bibliothèque
 * pour les ouvrages qu'on ne dépouille pas en fiches.
 *
 * Le PDF vit dans Vercel Blob (`url`), pas dans le dépôt : les quatre volumes
 * de l'Encyclopedia Magica pèsent 180 Mo ensemble. Voir drizzle/0012.
 */
export const gameBooks = pgTable('game_books', {
  id: serial('id').primaryKey(),
  /** Clé stable, aussi le nom du fichier dans le Blob : un retéléversement écrase. */
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  titre: varchar('titre', { length: 200 }).notNull(),
  volume: integer('volume'),
  /** « A – D » : la tranche alphabétique couverte par le volume. */
  tranche: varchar('tranche', { length: 40 }),
  /** Code ISO 639-1 — 'en' pour l'Encyclopedia Magica, qui est en anglais. */
  langue: varchar('langue', { length: 5 }).notNull().default('fr'),
  pages: integer('pages'),
  tailleOctets: bigint('taille_octets', { mode: 'number' }),
  url: text('url').notNull(),
  /**
   * Ce que vaut la RECHERCHE dans ce fichier : 'fiable' | 'partielle' |
   * 'inutilisable'. Un scan sans OCR exploitable ne se cherche pas, quel que
   * soit le lecteur — le dire évite qu'un joueur conclue que le mot n'est pas
   * dans le livre.
   */
  qualiteRecherche: varchar('qualite_recherche', { length: 20 }),
  /** Le taux de mots nets mesuré, pour que le verdict ci-dessus soit vérifiable. */
  tauxOcr: integer('taux_ocr'),
  /**
   * Regroupe les volumes d'un même ouvrage. Explicite, et pas déduit du slug :
   * la seconde copie du volume 3 porte « -3-partiel » et doit rester dans la
   * même collection. Voir drizzle/0012.
   */
  collection: varchar('collection', { length: 80 }),
  /**
   * Empreinte courte du fichier (SHA-256 tronqué) — la version servie aux liens
   * sous « ?v= ». ⚠ Le Blob met en cache 30 jours et un retéléversement écrit au
   * MÊME chemin : sans ce paramètre, remplacer un volume serait invisible
   * pendant un mois. Voir drizzle/0012.
   */
  version: varchar('version', { length: 32 }),
  note: text('note'),
  ordre: integer('ordre').notNull().default(0),
})

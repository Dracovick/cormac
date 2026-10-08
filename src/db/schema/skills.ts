import { pgTable, serial, varchar, text, boolean, integer } from 'drizzle-orm/pg-core'

export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
  nomEn: varchar('nom_en', { length: 100 }),
  caracteristique: varchar('caracteristique', { length: 10 }).notNull(),
  formationRequise: boolean('formation_requise').default(false),
  description: text('description'),
  // La table contient deux populations : le catalogue du Manuel (les 36
  // compétences du chapitre 4) et les lignes de fiche importées de FileMaker —
  // spécialisations (« Artisanat (alchimie) »), vestiges de la 3.0
  // (« Dissimulation », « Scrutation »), et ce qui n'est pas une compétence
  // (« Volonté », qui est un jet de sauvegarde).
  // Seul le catalogue est publié à la Bibliothèque. Voir drizzle/0009.
  estCatalogue: boolean('est_catalogue').notNull().default(false),
  // Pour une ligne de fiche : l'entrée de catalogue qui porte ses règles
  // (« Connaissances (religion) » → Connaissances). NULL tant que le
  // rattachement n'est pas décidé, et NULL pour toujours sur ce qui n'est pas
  // une compétence. Le lien est une référence : il ne remplace aucune valeur.
  catalogueId: integer('catalogue_id'),
  // Le malus d'armure aux tests s'applique-t-il ? 9 compétences sur 36.
  malusArmure: boolean('malus_armure').notNull().default(false),
})

import { pgTable, serial, varchar, text, boolean, integer } from 'drizzle-orm/pg-core'

export const feats = pgTable('feats', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull().unique(),
  categorie: varchar('categorie', { length: 100 }),
  prerequis: text('prerequis'),
  description: text('description'),
  effetMecanique: text('effet_mecanique'),
  // La table contient deux populations : le catalogue du Manuel (table 5-1) et
  // les lignes de fiche importées de FileMaker — capacités de classe, traits
  // raciaux, pouvoirs de créature, marqueurs de progression, séparateurs.
  // Seul le catalogue est publié à la Bibliothèque. Voir drizzle/0008.
  estCatalogue: boolean('est_catalogue').notNull().default(false),
  // Pour une ligne de fiche : l'entrée de catalogue qui porte les règles du don
  // (« Weapon focus (dagger) » → Arme de prédilection). NULL tant que le
  // rattachement n'est pas décidé, et NULL pour toujours sur ce qui n'est pas
  // un don. Le lien est une référence : il ne remplace aucune valeur saisie.
  catalogueId: integer('catalogue_id'),
})

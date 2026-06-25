import { pgTable, serial, varchar, text } from 'drizzle-orm/pg-core'

export const feats = pgTable('feats', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull().unique(),
  categorie: varchar('categorie', { length: 100 }),
  prerequis: text('prerequis'),
  description: text('description'),
  effetMecanique: text('effet_mecanique'),
})

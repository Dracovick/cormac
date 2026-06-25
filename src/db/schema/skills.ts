import { pgTable, serial, varchar, text, boolean } from 'drizzle-orm/pg-core'

export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
  nomEn: varchar('nom_en', { length: 100 }),
  caracteristique: varchar('caracteristique', { length: 10 }).notNull(),
  formationRequise: boolean('formation_requise').default(false),
  description: text('description'),
})

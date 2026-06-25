import { pgTable, serial, varchar, text, integer } from 'drizzle-orm/pg-core'

export const spells = pgTable('spells', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  ecole: varchar('ecole', { length: 100 }),
  composantes: varchar('composantes', { length: 50 }),
  portee: varchar('portee', { length: 100 }),
  duree: varchar('duree', { length: 100 }),
  zoneEffet: varchar('zone_effet', { length: 100 }),
  jetDeSauvegarde: varchar('jet_de_sauvegarde', { length: 100 }),
  resistanceMagique: varchar('resistance_magique', { length: 50 }),
  description: text('description'),
})

export const spellClassLevels = pgTable('spell_class_levels', {
  id: serial('id').primaryKey(),
  sortId: integer('sort_id').notNull().references(() => spells.id),
  classeId: integer('classe_id').notNull(),
  niveau: integer('niveau').notNull(),
})

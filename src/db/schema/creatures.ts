import { pgTable, serial, varchar, text, integer } from 'drizzle-orm/pg-core'

export const creatureTypes = pgTable('creature_types', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
})

export const creatures = pgTable('creatures', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  typeId: integer('type_id').references(() => creatureTypes.id),
  taille: varchar('taille', { length: 20 }),
  deVie: varchar('de_vie', { length: 30 }),
  ca: integer('ca'),
  deplacement: integer('deplacement'),
  for: integer('for'),
  dex: integer('dex'),
  con: integer('con'),
  int: integer('int'),
  sag: integer('sag'),
  cha: integer('cha'),
  attaques: text('attaques'),
  competences: text('competences'),
  dons: text('dons'),
  description: text('description'),
})

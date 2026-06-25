import { pgTable, serial, varchar, text, integer, numeric, boolean } from 'drizzle-orm/pg-core'

export const weaponCategories = pgTable('weapon_categories', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
})

export const weapons = pgTable('weapons', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  categorieId: integer('categorie_id').references(() => weaponCategories.id),
  degats: varchar('degats', { length: 30 }),
  critiqueMin: integer('critique_min').default(20),
  critiqueMult: integer('critique_mult').default(2),
  portee: integer('portee'),
  typeDegats: varchar('type_degats', { length: 50 }),
  taille: varchar('taille', { length: 20 }),
  poids: numeric('poids', { precision: 6, scale: 2 }),
  prix: numeric('prix', { precision: 10, scale: 2 }),
  description: text('description'),
})

export const armor = pgTable('armor', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  type: varchar('type', { length: 50 }),
  bonusArmure: integer('bonus_armure').default(0),
  maxDex: integer('max_dex'),
  malusCompetence: integer('malus_competence').default(0),
  risqueEchecMagique: integer('risque_echec_magique').default(0),
  deplacement: integer('deplacement'),
  poids: numeric('poids', { precision: 6, scale: 2 }),
  prix: numeric('prix', { precision: 10, scale: 2 }),
})

export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  categorie: varchar('categorie', { length: 100 }),
  poids: numeric('poids', { precision: 6, scale: 2 }),
  prix: numeric('prix', { precision: 10, scale: 2 }),
  description: text('description'),
})

export const magicItems = pgTable('magic_items', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  type: varchar('type', { length: 100 }),
  emplacement: varchar('emplacement', { length: 100 }),
  bonus: integer('bonus'),
  auraMagique: varchar('aura_magique', { length: 100 }),
  niveauLanceur: integer('niveau_lanceur'),
  prix: numeric('prix', { precision: 10, scale: 2 }),
  description: text('description'),
})

export const potions = pgTable('potions', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  sortEffet: varchar('sort_effet', { length: 200 }),
  niveau: integer('niveau'),
  chargesMax: integer('charges_max').default(1),
  description: text('description'),
})

export const gems = pgTable('gems', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  valeurBase: numeric('valeur_base', { precision: 10, scale: 2 }),
  description: text('description'),
})

export const artObjects = pgTable('art_objects', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  valeur: numeric('valeur', { precision: 10, scale: 2 }),
  description: text('description'),
})

import { pgTable, serial, varchar, text, integer, boolean } from 'drizzle-orm/pg-core'

export const races = pgTable('races', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
  bonusFor: integer('bonus_for').default(0),
  bonusDex: integer('bonus_dex').default(0),
  bonusCon: integer('bonus_con').default(0),
  bonusInt: integer('bonus_int').default(0),
  bonusSag: integer('bonus_sag').default(0),
  bonusCha: integer('bonus_cha').default(0),
  taille: varchar('taille', { length: 20 }).default('Moyenne'),
  deplacementBase: integer('deplacement_base').default(9),
  visionNocturne: boolean('vision_nocturne').default(false),
  description: text('description'),
})

export const racialFeatures = pgTable('racial_features', {
  id: serial('id').primaryKey(),
  raceId: integer('race_id').notNull().references(() => races.id),
  nom: varchar('nom', { length: 200 }).notNull(),
  description: text('description'),
})

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
  deVie: varchar('de_vie', { length: 10 }).notNull(),
  bbaProgression: varchar('bba_progression', { length: 20 }).notNull(),
  vigueurProgression: varchar('vigueur_progression', { length: 20 }).notNull(),
  reflexesProgression: varchar('reflexes_progression', { length: 20 }).notNull(),
  volonteProgression: varchar('volonte_progression', { length: 20 }).notNull(),
  competencesParNiveau: integer('competences_par_niveau').notNull(),
  description: text('description'),
})

export const classFeatures = pgTable('class_features', {
  id: serial('id').primaryKey(),
  classeId: integer('classe_id').notNull().references(() => classes.id),
  niveau: integer('niveau').notNull(),
  nom: varchar('nom', { length: 200 }).notNull(),
  description: text('description'),
})

export const classSkillList = pgTable('class_skill_list', {
  id: serial('id').primaryKey(),
  classeId: integer('classe_id').notNull().references(() => classes.id),
  skillId: integer('skill_id').notNull(),
})

export const gods = pgTable('gods', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
  alignement: varchar('alignement', { length: 30 }),
  domaines: text('domaines'),
  armeDePreference: varchar('arme_de_preference', { length: 100 }),
  description: text('description'),
})

export const clans = pgTable('clans', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull().unique(),
  raceId: integer('race_id').references(() => races.id),
  description: text('description'),
})

export const languages = pgTable('languages', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
  script: varchar('script', { length: 100 }),
})

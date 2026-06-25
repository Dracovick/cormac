import { pgTable, serial, varchar, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core'
import { races, classes, clans, gods } from './references'
import { creatures } from './creatures'

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  surnom: varchar('surnom', { length: 200 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  raceId: integer('race_id').references(() => races.id),
  sexe: varchar('sexe', { length: 20 }),
  taille: varchar('taille', { length: 20 }),
  poids: integer('poids'),
  yeux: varchar('yeux', { length: 50 }),
  cheveux: varchar('cheveux', { length: 50 }),
  age: integer('age'),
  alignement: varchar('alignement', { length: 50 }),
  dieuId: integer('dieu_id').references(() => gods.id),
  clanId: integer('clan_id').references(() => clans.id),
  xp: integer('xp').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const characterClasses = pgTable('character_classes', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  classeId: integer('classe_id').notNull().references(() => classes.id),
  niveau: integer('niveau').notNull().default(1),
})

export const characterAbilityScores = pgTable('character_ability_scores', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  forBase: integer('for_base').default(10),
  forMagique: integer('for_magique').default(0),
  dexBase: integer('dex_base').default(10),
  dexMagique: integer('dex_magique').default(0),
  conBase: integer('con_base').default(10),
  conMagique: integer('con_magique').default(0),
  intBase: integer('int_base').default(10),
  intMagique: integer('int_magique').default(0),
  sagBase: integer('sag_base').default(10),
  sagMagique: integer('sag_magique').default(0),
  chaBase: integer('cha_base').default(10),
  chaMagique: integer('cha_magique').default(0),
})

export const characterCombatStats = pgTable('character_combat_stats', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  pvMax: integer('pv_max').default(0),
  pvActuels: integer('pv_actuels').default(0),
  caBase: integer('ca_base').default(10),
  caArme: integer('ca_arme').default(0),
  caBouclier: integer('ca_bouclier').default(0),
  caNaturelle: integer('ca_naturelle').default(0),
  caDeflexion: integer('ca_deflexion').default(0),
  caDivers: integer('ca_divers').default(0),
  deplacement: integer('deplacement').default(9),
  karma: integer('karma').default(0),
  initiativeBonus: integer('initiative_bonus').default(0),
  bbaCorpsACorps: integer('bba_corps_a_corps').default(0),
  bbaProjectiles: integer('bba_projectiles').default(0),
})

export const characterSavingThrows = pgTable('character_saving_throws', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  reflexesBase: integer('reflexes_base').default(0),
  reflexesMagique: integer('reflexes_magique').default(0),
  vigueurBase: integer('vigueur_base').default(0),
  vigueurMagique: integer('vigueur_magique').default(0),
  volonteBase: integer('volonte_base').default(0),
  volonteMagique: integer('volonte_magique').default(0),
})

export const characterSkills = pgTable('character_skills', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  skillId: integer('skill_id').notNull(),
  rangsInvestis: integer('rangs_investis').default(0),
  modifDivers: integer('modif_divers').default(0),
})

export const characterFeats = pgTable('character_feats', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  featId: integer('feat_id').notNull(),
  notes: text('notes'),
})

export const characterWeapons = pgTable('character_weapons', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  armeId: integer('arme_id').notNull(),
  bonusMagique: integer('bonus_magique').default(0),
  proprietesSpeciales: text('proprietes_speciales'),
  quantite: integer('quantite').default(1),
})

export const characterArmor = pgTable('character_armor', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  armureId: integer('armure_id').notNull(),
  bonusMagique: integer('bonus_magique').default(0),
  estPortee: integer('est_portee').default(1),
})

export const characterMagicItems = pgTable('character_magic_items', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  objetId: integer('objet_id').notNull(),
  emplacement: varchar('emplacement', { length: 100 }),
  notes: text('notes'),
})

export const characterPotions = pgTable('character_potions', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  potionId: integer('potion_id').notNull(),
  chargesRestantes: integer('charges_restantes').default(1),
  notes: text('notes'),
})

export const characterCurrency = pgTable('character_currency', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  po: numeric('po', { precision: 10, scale: 2 }).default('0'),
  pa: numeric('pa', { precision: 10, scale: 2 }).default('0'),
  pc: numeric('pc', { precision: 10, scale: 2 }).default('0'),
  pe: numeric('pe', { precision: 10, scale: 2 }).default('0'),
  pm: numeric('pm', { precision: 10, scale: 2 }).default('0'),
})

export const characterLanguages = pgTable('character_languages', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  langueId: integer('langue_id').notNull(),
})

export const characterSpells = pgTable('character_spells', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  sortId: integer('sort_id').notNull(),
  estPrepare: integer('est_prepare').default(0),
  estConnu: integer('est_connu').default(1),
})

export const characterCreatures = pgTable('character_creatures', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  creatureId: integer('creature_id').references(() => creatures.id),
  nomPersonnalise: varchar('nom_personnalise', { length: 200 }),
  role: varchar('role', { length: 50 }),
})

export const characterCompanions = pgTable('character_companions', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  nom: varchar('nom', { length: 200 }).notNull(),
  race: varchar('race', { length: 100 }),
  classe: varchar('classe', { length: 100 }),
  joueur: varchar('joueur', { length: 200 }),
  notes: text('notes'),
})

export const characterNotes = pgTable('character_notes', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  titre: varchar('titre', { length: 200 }),
  contenu: text('contenu').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

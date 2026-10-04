import { pgTable, serial, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core'

// Ordre d'initiative de la vue du MJ (/partie). Un seul combat « actif » à la fois;
// les combattants (PJ et adversaires mêlés) vivent en JSON dans la ligne : le combat
// est un état de table éphémère, pas une donnée de campagne — le journal garde la trace.
export const combats = pgTable('combats', {
  id: serial('id').primaryKey(),
  statut: varchar('statut', { length: 20 }).notNull().default('actif'), // actif | termine
  round: integer('round').notNull().default(1),
  tourIndex: integer('tour_index').notNull().default(0),
  combattants: text('combattants').notNull().default('[]'), // JSON : Combattant[] (voir actions/combat.ts)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

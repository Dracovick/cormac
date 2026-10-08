/**
 * Applique drizzle/0010_objets_catalogue.sql.
 * Idempotent : toutes les instructions sont IF NOT EXISTS.
 *
 * Usage : npx tsx menage-references/p14-migration.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

await sql`ALTER TABLE magic_items ADD COLUMN IF NOT EXISTS est_catalogue boolean DEFAULT false NOT NULL`
await sql`ALTER TABLE magic_items ADD COLUMN IF NOT EXISTS catalogue_id integer`
await sql`CREATE INDEX IF NOT EXISTS magic_items_est_catalogue_idx ON magic_items (est_catalogue)`

const c = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='magic_items' ORDER BY ordinal_position` as any[]
console.log('colonnes magic_items :', c.map((x: any) => x.column_name).join(', '))

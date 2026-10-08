/**
 * Applique drizzle/0009_competences_catalogue.sql.
 * Idempotent : toutes les instructions sont IF NOT EXISTS.
 *
 * Usage : npx tsx menage-references/p11-migration.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

await sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS est_catalogue boolean DEFAULT false NOT NULL`
await sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS catalogue_id integer`
await sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS malus_armure boolean DEFAULT false NOT NULL`
await sql`CREATE INDEX IF NOT EXISTS skills_est_catalogue_idx ON skills (est_catalogue)`
await sql`ALTER TABLE class_skill_list ADD COLUMN IF NOT EXISTS "precision" varchar(80)`
await sql`CREATE UNIQUE INDEX IF NOT EXISTS class_skill_list_unique_idx ON class_skill_list (classe_id, skill_id, COALESCE("precision", ''))`

for (const table of ['skills', 'class_skill_list']) {
  const c = await sql`SELECT column_name FROM information_schema.columns WHERE table_name=${table} ORDER BY ordinal_position` as any[]
  console.log(`colonnes ${table} : ${c.map((x: any) => x.column_name).join(', ')}`)
}

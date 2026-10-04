// Applique la migration 0005 : table "combats" (ordre d'initiative de la vue du MJ).
// Idempotent — CREATE TABLE IF NOT EXISTS, relançable sans dommage.
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  const [key, ...vals] = line.split('=')
  if (key?.trim() && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim()
}

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL non défini')
  const sql = neon(url)

  await sql`CREATE TABLE IF NOT EXISTS "combats" (
    "id" serial PRIMARY KEY NOT NULL,
    "statut" varchar(20) DEFAULT 'actif' NOT NULL,
    "round" integer DEFAULT 1 NOT NULL,
    "tour_index" integer DEFAULT 0 NOT NULL,
    "combattants" text DEFAULT '[]' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`

  const check = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'combats' ORDER BY ordinal_position
  `
  console.log('colonnes de combats :', check.map(c => c.column_name).join(', '))
}

migrate().catch(e => { console.error(e); process.exit(1) })

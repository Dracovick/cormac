// Applique la migration 0003 : table character_gems (gemmes du trésor).
// Idempotent — relançable sans dommage.
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

  await sql`
    CREATE TABLE IF NOT EXISTS character_gems (
      id serial PRIMARY KEY NOT NULL,
      personnage_id integer NOT NULL REFERENCES characters(id),
      nom varchar(200) NOT NULL,
      quantite integer DEFAULT 1,
      valeur numeric(12, 2) DEFAULT '0',
      unite varchar(4) DEFAULT 'po',
      notes text
    )
  `
  const cols = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'character_gems' ORDER BY ordinal_position
  `
  console.log('✓ character_gems :', cols.map((c: any) => `${c.column_name} (${c.data_type})`).join(', '))

  const n = await sql`SELECT count(*)::int AS n FROM character_gems`
  console.log('✓ lignes existantes :', n[0].n)
}

migrate().catch(e => { console.error(e); process.exit(1) })

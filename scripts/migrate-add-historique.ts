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
  await sql`ALTER TABLE characters ADD COLUMN IF NOT EXISTS historique TEXT`
  console.log('✓ Colonne historique ajoutée à la table characters')
}

migrate().catch(e => { console.error(e); process.exit(1) })

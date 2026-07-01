import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  const [key, ...vals] = line.split('=')
  if (key?.trim() && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim()
}

async function check() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL non défini')
  const sql = neon(url)

  const colExists = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'historique'
  `
  console.log('Colonne historique existe:', colExists.length > 0 ? 'OUI' : 'NON')

  const chars = await sql`SELECT id, nom, historique FROM characters ORDER BY nom`
  console.log('\nPersonnages:')
  for (const c of chars) {
    console.log(` - [${c.id}] ${c.nom}: historique = ${c.historique === null ? 'NULL' : c.historique === '' ? 'VIDE' : JSON.stringify(c.historique)}`)
  }
}

check().catch(e => { console.error(e); process.exit(1) })

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'
const envPath = resolve(process.cwd(), '.env.local')
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const [key, ...vals] = line.split('=')
  if (key?.trim() && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim()
}
const sql = neon(process.env.DATABASE_URL!)
const [a] = await sql`SELECT count(DISTINCT sort_id) AS couverts FROM spell_class_levels`
const [b] = await sql`SELECT count(*) AS total FROM spells`
console.log('sorts avec au moins une classe:', a.couverts, '/ total:', b.total)

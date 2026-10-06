import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'
const envPath = resolve(process.cwd(), '.env.local')
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const [key, ...vals] = line.split('=')
  if (key?.trim() && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim()
}
const sql = neon(process.env.DATABASE_URL!)
const rows = await sql`
  SELECT c.nom, count(*) AS n
  FROM spell_class_levels scl JOIN classes c ON c.id = scl.classe_id
  GROUP BY c.nom ORDER BY c.nom`
for (const r of rows) console.log(r.nom, r.n)

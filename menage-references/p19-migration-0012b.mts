import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'
for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (k?.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL!)
await sql`ALTER TABLE game_books ADD COLUMN IF NOT EXISTS collection varchar(80)`
await sql`UPDATE game_books SET collection = 'encyclopedia-magica' WHERE collection IS NULL`
const r = await sql`SELECT slug, collection, volume FROM game_books ORDER BY ordre`
console.log(JSON.stringify(r))

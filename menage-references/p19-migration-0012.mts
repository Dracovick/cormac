/** Applique drizzle/0012_livres_de_jeu.sql (les migrations 0006+ le sont à la main). */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'
for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (k?.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim()
}
const sql = neon(process.env.DATABASE_URL!)
const ddl = readFileSync(resolve(process.cwd(), 'drizzle/0012_livres_de_jeu.sql'), 'utf-8')
  .split('\n').filter(l => !l.trimStart().startsWith('--')).join('\n').trim()
await sql.query(ddl)
const cols = await sql`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns WHERE table_name = 'game_books' ORDER BY ordinal_position
`
console.log('game_books :')
for (const c of cols as any[]) console.log(`  ${c.column_name} ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}`)

/** Ajoute game_books.version et la remplit depuis l'empreinte des fichiers locaux. */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createHash } from 'crypto'
for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (k?.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL!)
await sql`ALTER TABLE game_books ADD COLUMN IF NOT EXISTS version varchar(32)`

const FICHIERS: Record<string, string> = {
  'encyclopedia-magica-1': 'Encyclopedia Magica Volume 1.pdf',
  'encyclopedia-magica-2': 'Encyclopedia Magica Volume 2 D-P.pdf',
  'encyclopedia-magica-3': 'Encyclopedia Magica Volume 3.pdf',
  'encyclopedia-magica-4': 'Encyclopedia Magica Volume 4.pdf',
  'encyclopedia-magica-3-partiel': 'tsr02157 - Encyclopedia Magica Vol III.pdf',
}
for (const [slug, f] of Object.entries(FICHIERS)) {
  const h = createHash('sha256').update(readFileSync(resolve(process.cwd(), 'Livres de jeu en PDF', f))).digest('hex').slice(0, 12)
  const r = await sql`UPDATE game_books SET version = ${h} WHERE slug = ${slug} RETURNING slug, version`
  console.log(`  ${slug} → ${h} ${(r as any[]).length ? '✓' : '⛔ aucune ligne'}`)
}

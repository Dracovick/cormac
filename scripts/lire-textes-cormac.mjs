/**
 * TOUT CE QUE LA BASE PORTE COMME TEXTE SUR LA FICHE [1] CORMAC.
 *
 *   node scripts/lire-textes-cormac.mjs
 *
 * Avant de dire à André « il n'y a pas de texte », il faut avoir LU ce qu'il y a.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()
  .replace(/\r/g, '')
  .replace(/^["']|["']$/g, '')
const sql = neon(url)

const f = await sql`SELECT id, nom, historique, notes FROM characters WHERE id = 1`
console.log('=== characters [1] ===')
console.log(JSON.stringify(f[0], null, 2))

const n = await sql`
  SELECT id, titre, contenu, created_at FROM character_notes WHERE personnage_id = 1 ORDER BY id`
console.log('\n=== character_notes de [1] ===')
for (const r of n) console.log(`--- [${r.id}] ${r.titre ?? ''} (${r.created_at})\n${r.contenu}`)
if (n.length === 0) console.log('  (aucune)')

/* Et les notes de TOUTES les fiches qui parlent de Cormac, où qu'elles soient. */
const ailleurs = await sql`
  SELECT personnage_id, id, titre, length(contenu) AS n FROM character_notes
  WHERE contenu ILIKE '%cormac%' ORDER BY personnage_id, id`
console.log('\n=== notes de personnage mentionnant « cormac » ===')
for (const r of ailleurs) console.log(`  fiche ${r.personnage_id} note ${r.id} « ${r.titre} » ${r.n} car.`)

const gb = await sql`SELECT id, titre, note FROM game_books WHERE note ILIKE '%cormac%'`
console.log('\n=== game_books mentionnant « cormac » ===')
for (const r of gb) console.log(`--- [${r.id}] ${r.titre}\n${r.note}`)

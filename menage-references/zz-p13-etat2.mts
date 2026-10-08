import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

console.log('=== [192] = ? ===')
console.log(JSON.stringify(await sql`SELECT id, nom, est_catalogue FROM skills WHERE id = 192`))

const persos = [4, 62, 79, 76, 60, 64, 50]
console.log('\n=== classes et niveaux des 7 porteurs ===')
const rows = await sql`
  SELECT c.id, c.nom, c.niveau, c.classe, c.race, c.intelligence_base
  FROM characters c WHERE c.id = ANY(${persos}) ORDER BY c.id`
for (const r of rows as any[]) console.log(`${r.id} ${r.nom} — ${r.classe} niv ${r.niveau} (${r.race})`)

console.log('\n=== classes multiples ? ===')
const cc = await sql`SELECT * FROM character_classes WHERE personnage_id = ANY(${persos}) ORDER BY personnage_id`
console.log(JSON.stringify(cc, null, 1))

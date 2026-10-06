// Phase 2 Bibliothèque — inventaire des objets magiques existants (lecture seule)
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const rows = await sql`select id, nom, type, prix, description is not null as a_desc from magic_items order by type, nom` as any[]
let type = ''
for (const r of rows) {
  const t = r.type ?? '(sans type)'
  if (t !== type) { type = t; console.log(`\n== ${t} ==`) }
  console.log(`  [${r.id}] ${r.nom}${r.a_desc ? '' : ' (sans desc)'}`)
}
console.log(`\nTotal : ${rows.length}`)

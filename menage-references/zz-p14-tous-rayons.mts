import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const tables = ['spells','potions','magic_items','weapons','armor','feats','skills']
for (const t of tables) {
  const r = await sql.query(`SELECT count(*)::int n, count(*) FILTER (WHERE description IS NULL OR btrim(description)='')::int vides FROM ${t}`)
  console.log(`${t.padEnd(14)} total ${String(r[0].n).padStart(5)}  sans description ${r[0].vides}`)
}
console.log('\n--- potions sans description')
console.log((await sql`SELECT id, nom, sort_effet FROM potions WHERE description IS NULL OR btrim(description)='' ORDER BY nom`).map(x => `[${x.id}] ${x.nom} | ${x.sort_effet ?? '—'}`).join('\n'))
console.log('\n--- armes sans description (catalogue seulement)')
console.log((await sql`SELECT id, nom FROM weapons WHERE (description IS NULL OR btrim(description)='') AND est_catalogue = true ORDER BY nom`).map(x => `[${x.id}] ${x.nom}`).join('\n'))
console.log('\n--- armures sans description')
console.log((await sql`SELECT id, nom FROM armor WHERE description IS NULL OR btrim(description)='' ORDER BY nom`).map(x => `[${x.id}] ${x.nom}`).join('\n'))

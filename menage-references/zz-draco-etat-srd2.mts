import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

for (const t of ['weapons','armor','magic_items']) {
  const cols = await sql.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND table_schema='public' ORDER BY ordinal_position`, [t]) as any[]
  const n = await sql.query(`SELECT count(*)::int c FROM ${t}`) as any[]
  const hasDesc = cols.some(c=>c.column_name==='description')
  const d = hasDesc ? (await sql.query(`SELECT count(*)::int c FROM ${t} WHERE description IS NULL OR description=''`) as any[])[0].c : '(pas de colonne)'
  console.log(`${t.toUpperCase().padEnd(12)} ${String(n[0].c).padStart(4)} lignes, sans description : ${d}`)
  console.log(`   colonnes : ${cols.map(c=>c.column_name).join(', ')}`)
}
const cat = await sql`SELECT categorie, count(*)::int c, count(*) FILTER (WHERE description IS NULL OR description='')::int vides FROM feats GROUP BY 1 ORDER BY 2 DESC` as any[]
console.log('\nDONS par categorie :')
for (const c of cat) console.log(`   ${String(c.categorie ?? '(aucune)').padEnd(32)} ${String(c.c).padStart(4)}  dont vides ${c.vides}`)

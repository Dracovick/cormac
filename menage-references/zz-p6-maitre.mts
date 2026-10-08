import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const motif of ['%morts-vivants%', '%brise%']) {
  console.log(`\n=== ${motif} ===`)
  const r = await sql`SELECT id, nom, ecole, portee, duree FROM spells WHERE nom ILIKE ${motif} ORDER BY nom` as any[]
  for (const s of r) console.log(`[${s.id}] ${s.nom.padEnd(42)} | ${s.ecole ?? '—'} | portée ${s.portee ?? '—'} | durée ${s.duree ?? '—'}`)
}
const p = await sql`SELECT count(*)::int n FROM personnage_sorts ps JOIN spells s ON s.id = ps.sort_id WHERE s.id IN (670, 430)` as any[]
console.log(`\nporteurs de [670] et [430] : ${p[0].n}`)

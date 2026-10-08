import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const id of [670, 430]) {
  const r = await sql`SELECT id, nom, ecole, portee, duree, description FROM spells WHERE id = ${id}` as any[]
  const s = r[0]
  console.log(`\n=== [${s.id}] ${s.nom} | école ${s.ecole ?? '—'} | portée ${s.portee ?? '—'} | durée ${s.duree ?? '—'}`)
  console.log(String(s.description ?? '(vide)').replace(/\s+/g,' ').slice(0, 400))
}

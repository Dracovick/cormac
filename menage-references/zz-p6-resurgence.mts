import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, ecole, composantes, portee, duree, zone_effet, jet_de_sauvegarde, resistance_magique, description
  FROM spells WHERE nom IN ('Résurgence','Résurgence de groupe','Fureur vertueuse des fidèles') ORDER BY nom` as any[]
for (const s of r) {
  console.log(`\n[${s.id}] ${s.nom}`)
  console.log(`  ${s.ecole ?? '—'} | comp ${s.composantes ?? '—'} | portée ${s.portee ?? '—'} | durée ${s.duree ?? '—'}`)
  console.log(`  zone ${s.zone_effet ?? '—'} | jds ${s.jet_de_sauvegarde ?? '—'} | rm ${s.resistance_magique ?? '—'}`)
  console.log(`  desc : ${String(s.description ?? '').replace(/\s+/g,' ').slice(0,200)}`)
}

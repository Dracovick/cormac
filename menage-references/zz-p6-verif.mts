import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ids = [43, 215, 293, 204]
const r = await sql`SELECT id, nom, composantes, portee, duree, zone_effet, jet_de_sauvegarde, resistance_magique, description FROM spells WHERE id = ANY(${ids}) ORDER BY id` as any[]
for (const s of r) {
  console.log(`\n[${s.id}] ${s.nom}`)
  console.log(`   composantes ${s.composantes ?? '—'} | portée ${s.portee ?? '—'} | durée ${s.duree ?? '—'}`)
  console.log(`   zone ${s.zone_effet ?? '—'} | jds ${s.jet_de_sauvegarde ?? '—'} | rm ${s.resistance_magique ?? '—'}`)
  const d = String(s.description).replace(/\s+/g,' ')
  console.log(`   desc : ${d.slice(0, 150)}`)
  const n = d.indexOf('*Blocs techniques repris de')
  if (n >= 0) console.log(`   note : ${d.slice(n)}`)
}
const t = await sql`SELECT count(*)::int total,
  count(*) FILTER (WHERE (portee IS NULL OR trim(portee)='') OR (duree IS NULL OR trim(duree)=''))::int incomplets FROM spells` as any[]
console.log(`\nbase : ${t[0].total} sorts | incomplets : ${t[0].incomplets}`)

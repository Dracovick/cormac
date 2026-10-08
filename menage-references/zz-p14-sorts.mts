import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const m of ['identification','téléportation','résurrection','soins modérés','flamme éternelle','lumière éternelle','invisibilité','soins importants','soins légers','lenteur','inertie','détection']) {
  const r = await sql`SELECT id, nom FROM spells WHERE lower(nom) LIKE ${'%'+m+'%'} ORDER BY nom LIMIT 6`
  console.log(`--- ${m}: ` + (r.length ? r.map(x => `[${x.id}] ${x.nom}`).join(' · ') : 'AUCUN'))
}

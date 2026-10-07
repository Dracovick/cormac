import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const m of ['Châtiment','Courroux','Marteau','maudite','Ténèbres','Blessure grave','Blessure importante','Contrôle mineur','sans erreur']) {
  const r = await sql`SELECT id, nom FROM spells WHERE nom ILIKE ${'%'+m+'%'} ORDER BY nom LIMIT 8`
  console.log(`${m} → ${r.map((x:any)=>'['+x.id+'] '+x.nom).join(' | ') || 'AUCUN'}`)
}
const t = await sql`SELECT count(*)::int total,
  count(*) FILTER (WHERE description IS NULL OR trim(description)='')::int sans_desc,
  count(*) FILTER (WHERE portee IS NULL OR trim(portee)='')::int sans_portee,
  count(*) FILTER (WHERE duree IS NULL OR trim(duree)='')::int sans_duree FROM spells`
console.table(t)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const t = await sql`SELECT count(*)::int total, count(*) FILTER (WHERE est_catalogue)::int cat,
  count(*) FILTER (WHERE est_catalogue AND (description IS NULL OR description=''))::int cat_sans_desc,
  count(*) FILTER (WHERE NOT est_catalogue)::int inv FROM weapons` as any[]
console.log(JSON.stringify(t[0]))
const f = await sql`SELECT famille, count(*)::int c FROM weapons WHERE est_catalogue GROUP BY 1 ORDER BY 1` as any[]
for (const x of f) console.log(`  ${x.famille.padEnd(44)} ${x.c}`)
const ids = await sql`SELECT id, nom FROM weapons WHERE est_catalogue AND nom IN ('Urgrosh nain','Filet','Fouet','Épée longue','Arbalète Légère') ORDER BY nom` as any[]
console.log('ids :', ids.map(x=>`${x.nom}=${x.id}`).join(' · '))
// les porteurs n'ont rien perdu
const p = await sql`SELECT count(*)::int liens, count(DISTINCT arme_id)::int armes FROM character_weapons` as any[]
console.log('character_weapons :', JSON.stringify(p[0]))

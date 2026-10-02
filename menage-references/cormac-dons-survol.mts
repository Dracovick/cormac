import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const rows = await sql`select f.nom, count(*) as n, string_agg(c.nom, ', ' order by c.nom) as persos
  from character_feats cf
  join feats f on f.id = cf.feat_id
  join characters c on c.id = cf.personnage_id
  group by f.nom
  order by f.nom` as any[]
console.log(`${rows.length} dons distincts pris par des personnages :`)
for (const r of rows) console.log(`  ${r.nom} — ${r.n} : ${r.persos}`)

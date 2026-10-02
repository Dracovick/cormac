import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const rows = await sql`select c.id, c.nom, cs.initiative_bonus
  from characters c
  join character_feats cf on cf.personnage_id = c.id
  join feats f on f.id = cf.feat_id
  left join character_combat_stats cs on cs.personnage_id = c.id
  where f.nom ilike '%science de l%initiative%'
  order by c.id` as any[]
console.log(`${rows.length} personnage(s) avec Science de l'initiative :`)
for (const r of rows) console.log(`  [${r.id}] ${r.nom} — divers stocké: ${r.initiative_bonus}`)

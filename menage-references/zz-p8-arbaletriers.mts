import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`
  SELECT c.id, c.nom, w.id aid, w.nom arme FROM character_weapons cw
  JOIN weapons w ON w.id = cw.arme_id JOIN characters c ON c.id = cw.personnage_id
  WHERE w.id IN (14, 2, 162) ORDER BY w.id, c.id` as any[]
for (const x of r) console.log(`#${x.id} ${x.nom} → [${x.aid}] ${x.arme}`)

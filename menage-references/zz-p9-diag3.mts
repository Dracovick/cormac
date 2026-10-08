import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT c.id, c.nom, w.id wid, w.nom warme, w.portee, w.famille
  FROM character_weapons cw JOIN characters c ON c.id=cw.personnage_id JOIN weapons w ON w.id=cw.arme_id
  WHERE w.id IN (4,172) ORDER BY w.id, c.nom` as any[]
for (const x of r) console.log(`[${x.wid}] ${x.warme.padEnd(16)} → ${x.nom} (perso ${x.id})`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, est_catalogue, degats, critique_min, portee FROM weapons WHERE id IN (4,7,8) ORDER BY id` as any[]
for (const w of r) console.log(`[${w.id}] cat=${w.est_catalogue?'O':'N'} ${w.nom} — ${w.degats}, crit ${w.critique_min}-20, portée ${w.portee}`)

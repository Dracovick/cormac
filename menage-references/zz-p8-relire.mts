import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id,nom,critique_min,critique_mult,portee FROM weapons WHERE id IN (14,11,2,162) ORDER BY id` as any[]
for (const w of r) console.log(`[${w.id}] ${w.nom} — crit ${w.critique_min}-20/x${w.critique_mult} — portée ${w.portee}`)

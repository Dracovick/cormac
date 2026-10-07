import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, zone_effet, duree FROM spells WHERE zone_effet ~ '^[^:]{0,60}:' ORDER BY nom`
for (const s of r as any[]) console.log(`[${s.id}] ${s.nom}\n    zone : ${s.zone_effet}\n    durée: ${s.duree}`)

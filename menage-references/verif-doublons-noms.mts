import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const rows = await sql`select id, nom from characters where id in (5, 85, 52, 56) order by id` as any[]
for (const r of rows) console.log(`[${r.id}] ${r.nom}`)

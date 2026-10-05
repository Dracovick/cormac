import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const rows = await sql`select nom from spells order by nom` as any[]
console.log(rows.map(r=>r.nom).join(' | '))
console.log('Total:', rows.length)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const c = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='character_weapons' ORDER BY ordinal_position` as any[]
console.log(c.map(x=>`${x.column_name}:${x.data_type}`).join(' · '))

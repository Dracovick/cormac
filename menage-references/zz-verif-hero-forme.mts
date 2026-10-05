import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const cols = await sql`select column_name from information_schema.columns where table_name='potions'` as any[]
console.log('colonnes potions:', cols.map(c=>c.column_name).join(', '))
const rows = await sql`select * from potions where id in (25,26)` as any[]
console.log(JSON.stringify(rows, null, 1))
const cp = await sql`select cp.*, c.nom as perso from character_potions cp left join characters c on c.id = cp.personnage_id where cp.potion_id in (25,26)` as any[]
console.log('porteurs:', JSON.stringify(cp, null, 1))

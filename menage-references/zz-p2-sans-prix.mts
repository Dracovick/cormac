import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`select id, nom, type from magic_items where prix is null and type in ('Anneau','Baguette','Bâton','Sceptre','Objet merveilleux') order by id` as any[]
for (const x of r) console.log(`[${x.id}] ${x.nom} (${x.type})`)

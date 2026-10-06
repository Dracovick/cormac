import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`select id, nom, de_vie, bba_progression, vigueur_progression, reflexes_progression, volonte_progression, competences_par_niveau from classes order by id` as any[]
for (const c of r) console.log(JSON.stringify(c))

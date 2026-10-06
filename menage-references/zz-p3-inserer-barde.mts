import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const deja = await sql`select id from classes where nom='Barde'` as any[]
if (deja.length) { console.log('Barde existe déjà :', deja[0].id); process.exit(0) }
const r = await sql`insert into classes (nom, de_vie, bba_progression, vigueur_progression, reflexes_progression, volonte_progression, competences_par_niveau)
  values ('Barde','d6','moyenne','faible','bon','bon',6) returning id` as any[]
console.log('Barde créé, id', r[0].id)

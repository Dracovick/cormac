import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, ecole, portee, duree, left(description, 700) d FROM spells WHERE nom ILIKE 'Neutralisation du poison%'`
for (const x of r) console.log(JSON.stringify(x, null, 1))
console.log('--- niveaux de classe')
console.log(await sql`SELECT classe, niveau FROM spell_class_levels WHERE spell_id = (SELECT id FROM spells WHERE nom='Neutralisation du poison' LIMIT 1)`)

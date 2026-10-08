import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const cible = process.argv[2] ?? 'Maîtres de la Nature'
const r = await sql`SELECT id, nom, ecole, portee, duree, description FROM spells
  WHERE ((portee IS NULL OR trim(portee)='') OR (duree IS NULL OR trim(duree)=''))
  ORDER BY nom` as any[]
const liste = r.filter(s => String(s.description ?? '').trim().endsWith(`[${cible}]`))
console.log(`${cible} : ${liste.length} sorts incomplets\n`)
for (const s of liste) console.log(`[${s.id}] ${s.nom}`)

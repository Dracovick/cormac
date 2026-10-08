import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`
  SELECT w.id, w.nom, w.degats, w.portee,
    (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = w.id) p
  FROM weapons w WHERE NOT w.est_catalogue ORDER BY w.nom` as any[]
for (const w of r) console.log(`${String(w.id).padStart(3)} | ${w.p} | ${(w.degats??'—').padEnd(10)} | ${w.nom}`)
console.log(`\n${r.length} lignes d'inventaire`)

import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT c.id, c.nom, m.id oid, m.nom objet, m.catalogue_id
  FROM character_magic_items cm JOIN characters c ON c.id = cm.personnage_id JOIN magic_items m ON m.id = cm.objet_id
  WHERE m.id IN (57, 51, 49, 278, 42, 56, 63) ORDER BY m.id`
for (const x of r) console.log(`perso #${x.id} ${x.nom} → [${x.oid}] ${x.objet} (catalogue_id ${x.catalogue_id ?? '—'})`)

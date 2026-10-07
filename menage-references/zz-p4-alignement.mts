import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, (description IS NOT NULL AND trim(description)<>'') a_fiche
  FROM spells WHERE nom ~* '^(cercle magique contre|protection contre (le|la) (loi|bien|chaos|mal)|rejet (de la|du)|detection (de la|du) (loi|bien|chaos|mal)|détection (de la|du) (Loi|Bien|Chaos|Mal))'
  ORDER BY nom`
console.table(r)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT s.id, s.nom, c.nom classe, scl.niveau,
   (s.description IS NULL OR trim(s.description)='') nue
  FROM spells s LEFT JOIN spell_class_levels scl ON scl.sort_id=s.id
  LEFT JOIN classes c ON c.id=scl.classe_id
  WHERE s.nom ILIKE '%téléportation suprême%' OR s.nom ILIKE '%Contrôle des morts-vivants%'
     OR s.nom ILIKE '%Blessure importante de groupe%' OR s.nom ILIKE '%Blessure légère de groupe%'
  ORDER BY s.nom, scl.niveau`
console.table(r)

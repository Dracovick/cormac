import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
// Un personnage qui porte à la fois une arme rattachée et une non rattachée :
// la meilleure preuve visuelle du 📖 et de son absence voulue.
const r = await sql`
  SELECT c.id, c.nom,
    count(*) FILTER (WHERE w.catalogue_id IS NOT NULL OR w.est_catalogue)::int avec,
    count(*) FILTER (WHERE w.catalogue_id IS NULL AND NOT w.est_catalogue)::int sans
  FROM character_weapons cw JOIN weapons w ON w.id = cw.arme_id JOIN characters c ON c.id = cw.personnage_id
  GROUP BY c.id, c.nom HAVING count(*) FILTER (WHERE w.catalogue_id IS NOT NULL) > 0
    AND count(*) FILTER (WHERE w.catalogue_id IS NULL AND NOT w.est_catalogue) > 0
  ORDER BY avec DESC, sans DESC LIMIT 6` as any[]
for (const c of r) console.log(`#${c.id} ${c.nom} — ${c.avec} avec 📖, ${c.sans} sans`)

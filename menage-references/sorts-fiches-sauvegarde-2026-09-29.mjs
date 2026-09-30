// Sauvegarde AVANT le chantier « fiches de sorts » du 2026-09-29 :
// zone_effet varchar->text + completion des tronquees + remplissage des
// portee/duree/composantes NULL + 8 descriptions manquantes.
// Produit sorts-fiches-sauvegarde-2026-09-29.json (etat complet des lignes touchees).
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())

const rows = await sql`
  SELECT id, nom, ecole, composantes, portee, duree, zone_effet, jet_de_sauvegarde, resistance_magique, description
  FROM spells
  WHERE char_length(zone_effet) >= 100
     OR description IS NULL OR trim(description) = ''
     OR portee IS NULL OR trim(portee) = ''
     OR duree IS NULL OR trim(duree) = ''
     OR composantes IS NULL OR trim(composantes) = ''
  ORDER BY id
`
fs.writeFileSync(
  'X:/Claude-Tools/cormac/menage-references/sorts-fiches-sauvegarde-2026-09-29.json',
  JSON.stringify(rows, null, 1), 'utf8'
)
console.log(`sauvegarde : ${rows.length} lignes ecrites`)

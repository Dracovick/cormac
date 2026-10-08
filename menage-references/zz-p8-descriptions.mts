import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
// Le semis p7 ne remplit que le vide : une entrée ADOPTÉE qui avait déjà une
// description a gardé celle d'André. Combien, et lesquelles ?
const r = await sql`
  SELECT id, nom, description,
    (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = weapons.id) p
  FROM weapons WHERE est_catalogue ORDER BY nom` as any[]
const livre = r.filter(w => (w.description ?? '').includes('table 7-5'))
const ancienne = r.filter(w => !(w.description ?? '').includes('table 7-5'))
console.log(`catalogue : ${r.length} — description du livre : ${livre.length}, ancienne saisie : ${ancienne.length}`)
for (const w of ancienne) console.log(`  [${w.id}] ${w.nom}${w.p ? ` (${w.p} porteur·s)` : ''} : « ${(w.description ?? '(vide)').slice(0, 95)} »`)

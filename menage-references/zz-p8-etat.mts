import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const rows = await sql`
  SELECT w.id, w.nom, w.est_catalogue, w.famille, w.degats, w.critique_min, w.critique_mult,
         w.portee, w.type_degats, w.poids, w.prix,
         (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = w.id) porteurs
  FROM weapons w ORDER BY w.est_catalogue DESC, w.nom` as any[]

const cat = rows.filter(r => r.est_catalogue)
const inv = rows.filter(r => !r.est_catalogue)
console.log(`catalogue=${cat.length}  inventaire=${inv.length}  total=${rows.length}`)
console.log(`inventaire avec porteurs=${inv.filter(r=>r.porteurs>0).length}  sans porteur=${inv.filter(r=>r.porteurs===0).length}`)

// Les 4 corrections visées : où sont-elles ?
for (const nom of ['Arbalète légère','Épée courte','Arc long composite','Arc court composite']) {
  const m = rows.filter(r => r.nom.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(
    nom.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(' ')[0]))
  console.log(`\n--- recherche « ${nom} » ---`)
  for (const r of m) console.log(`  [${r.id}] cat=${r.est_catalogue?'O':'N'} « ${r.nom} » dég=${r.degats} crit=${r.critique_min}/x${r.critique_mult} portée=${r.portee} porteurs=${r.porteurs}`)
}

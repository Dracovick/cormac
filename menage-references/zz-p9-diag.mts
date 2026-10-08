import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const rows = await sql`
  SELECT w.id, w.nom, w.est_catalogue, w.famille, w.degats, w.critique_min, w.critique_mult,
         w.portee, w.type_degats, w.poids, w.prix, w.catalogue_id,
         (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = w.id) porteurs
  FROM weapons w ORDER BY w.est_catalogue DESC, w.nom` as any[]

const cat = rows.filter(r => r.est_catalogue)
const inv = rows.filter(r => !r.est_catalogue)
console.log(`catalogue=${cat.length} inventaire=${inv.length}`)
console.log('\n=== CATALOGUE PORTÉ PAR UN PERSONNAGE (risque « la saisie fait foi ») ===')
for (const r of cat.filter(r=>r.porteurs>0)) console.log(`  [${r.id}] « ${r.nom} » portée=${r.portee} dég=${r.degats} porteurs=${r.porteurs}`)
console.log(`total = ${cat.filter(r=>r.porteurs>0).length}`)

console.log('\n=== PORTÉE des 5 armes lançables au catalogue ===')
for (const n of ['Gourdin','Dague','Trident','Lance','Marteau léger','Dard','Bolas','Arc long','Hachette']) {
  const m = cat.find(r=>r.nom===n)
  console.log(`  ${n.padEnd(16)} → ${m ? `portée=${m.portee} porteurs=${m.porteurs}` : 'ABSENT du catalogue'}`)
}

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const noms = ['Cercle magique contre la Loi','Cercle magique contre le Bien','Cercle magique contre le Chaos','Cercle magique contre le Mal',
 'Détection de la Loi','Détection du Bien','Détection du Chaos','Détection du Mal',
 'Protection contre la Loi','Protection contre le Bien','Protection contre le Chaos','Protection contre le Mal',
 'Rejet de la Loi','Rejet du Bien','Rejet du Chaos','Rejet du Mal']
const r = await sql`SELECT s.id, s.nom, s.ecole, s.portee, s.duree, length(s.description) desc_len,
  (SELECT string_agg(c.nom||' '||scl.niveau, ', ' ORDER BY c.nom) FROM spell_class_levels scl JOIN classes c ON c.id=scl.classe_id WHERE scl.sort_id=s.id) classes,
  (SELECT count(*)::int FROM character_spells cs WHERE cs.sort_id=s.id) porteurs
  FROM spells s WHERE s.nom = ANY(${noms}) ORDER BY s.nom` as any[]
for (const x of r) console.log(`[${x.id}] ${x.nom}\n    ${x.ecole ?? '⚠ SANS ÉCOLE'} | portée ${x.portee ?? '—'} | durée ${x.duree ?? '—'} | desc ${x.desc_len ?? 0} car. | ${x.classes}${x.porteurs?` | ${x.porteurs} porteur(s)`:''}`)
console.log(`\n${r.length}/16 versions`)
const t = await sql`SELECT count(*)::int sorts, count(*) FILTER (WHERE description IS NULL OR trim(description)='')::int sans_desc FROM spells` as any[]
console.log(`base : ${t[0].sorts} sorts | sans description : ${t[0].sans_desc}`)

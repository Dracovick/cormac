import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const noms = ['Endurance',"Endurance de l'ours",'Soins critiques de groupe','Soins intensifs de groupe','Mur de brouillard','Métamorphose des autres']
const r = await sql`SELECT s.id, s.nom, length(s.description) desc_len, s.ecole, s.portee,
  (SELECT string_agg(c.nom||' '||scl.niveau, ', ' ORDER BY c.nom) FROM spell_class_levels scl JOIN classes c ON c.id=scl.classe_id WHERE scl.sort_id=s.id) classes,
  (SELECT count(*)::int FROM character_spells cs WHERE cs.sort_id=s.id) porteurs
  FROM spells s WHERE s.nom = ANY(${noms}) ORDER BY s.nom` as any[]
for (const x of r) console.log(`[${x.id}] ${x.nom}\n    desc ${x.desc_len ?? 0} car. | ${x.ecole ?? 'sans école'} | ${x.classes ?? 'aucune classe'} | PORTEURS : ${x.porteurs}`)

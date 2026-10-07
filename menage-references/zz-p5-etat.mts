import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ids = [882,1202,1203,1045,78,853,1201,32,1096,1206,1207]
const r = await sql`SELECT s.id, s.nom, s.ecole,
  substring(s.description from 'version « ([^»]+) »') version_portee,
  (SELECT string_agg(c.nom||' '||scl.niveau, ', ' ORDER BY c.nom) FROM spell_class_levels scl JOIN classes c ON c.id=scl.classe_id WHERE scl.sort_id=s.id) classes,
  (SELECT count(*)::int FROM character_spells cs WHERE cs.sort_id=s.id) porteurs,
  length(s.description) taille_desc
  FROM spells s WHERE s.id = ANY(${ids}) ORDER BY s.nom`
for (const x of r as any[]) console.log(`[${x.id}] ${x.nom}\n    école: ${x.ecole} | classes: ${x.classes ?? '—'} | porteurs: ${x.porteurs} | desc ${x.taille_desc ?? 0} car.${x.version_portee ? ' | texte = version « '+x.version_portee+' »' : ''}`)

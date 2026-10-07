import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const t = await sql`SELECT count(*)::int total,
  count(*) FILTER (WHERE description IS NULL OR trim(description)='')::int sans_desc,
  count(*) FILTER (WHERE portee IS NULL OR trim(portee)='')::int sans_portee,
  count(*) FILTER (WHERE duree IS NULL OR trim(duree)='')::int sans_duree,
  count(*) FILTER (WHERE zone_effet ~* '^(cible|cibles|effet|zone d)\s*:')::int zone_prefixee
  FROM spells`
console.table(t)
const n = await sql`SELECT id, nom, ecole, portee, duree, jet_de_sauvegarde, left(description,70) debut
  FROM spells WHERE id IN (1216,1217,1218,1219,1220) ORDER BY id`
console.table(n)
const huit = await sql`SELECT s.id, s.nom, left(s.description,45) debut,
   (SELECT string_agg(c.nom||' '||scl.niveau, ', ') FROM spell_class_levels scl JOIN classes c ON c.id=scl.classe_id WHERE scl.sort_id=s.id) classes
  FROM spells s WHERE s.nom IN ('Repérage','Rage','Mur de pierre','Mur de fer','Rayons prismatiques','Entrave','Bouclier de la Loi','Collet') ORDER BY s.nom`
console.table(huit)

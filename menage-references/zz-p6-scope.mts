import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.log('— colonnes de spells —')
console.table(await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='spells' ORDER BY ordinal_position`)
console.log('— état général —')
console.table(await sql`SELECT count(*)::int total,
  count(*) FILTER (WHERE portee IS NULL OR trim(portee)='')::int sans_portee,
  count(*) FILTER (WHERE duree IS NULL OR trim(duree)='')::int sans_duree,
  count(*) FILTER (WHERE composantes IS NULL OR trim(composantes)='')::int sans_comp,
  count(*) FILTER (WHERE description IS NULL OR trim(description)='')::int sans_desc,
  count(*) FILTER (WHERE ecole IS NULL OR trim(ecole)='')::int sans_ecole
  FROM spells`)
console.log('— les incomplets : ont-ils des classes relevées? —')
console.table(await sql`SELECT (EXISTS (SELECT 1 FROM spell_class_levels scl WHERE scl.sort_id=s.id)) a_classes, count(*)::int n
  FROM spells s WHERE (portee IS NULL OR trim(portee)='') OR (duree IS NULL OR trim(duree)='') GROUP BY 1`)

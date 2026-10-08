import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`
  SELECT CASE WHEN id <= 72 THEN '01-72' WHEN id <= 276 THEN '73-276' ELSE '277-278' END AS tranche,
         type, count(*)::int n,
         count(*) FILTER (WHERE prix IS NOT NULL)::int prix,
         count(*) FILTER (WHERE description IS NULL OR btrim(description)='')::int vides
  FROM magic_items WHERE id <= 278 GROUP BY 1,2 ORDER BY 1, 3 DESC`
for (const x of r) console.log(`${x.tranche} | ${(x.type ?? '—').padEnd(32)} | n=${x.n} prix=${x.prix} vides=${x.vides}`)

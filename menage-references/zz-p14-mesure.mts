import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// Répartition : id <= 278 = lignes historiques d'André ; au-delà = semis GdM du 2026-10-06
const r = await sql`
  SELECT CASE WHEN id <= 278 THEN 'andre' ELSE 'semis' END AS origine,
         count(*)::int AS n,
         count(*) FILTER (WHERE description IS NULL OR btrim(description) = '')::int AS vides,
         count(*) FILTER (WHERE type IS NOT NULL)::int AS avec_type,
         count(*) FILTER (WHERE prix IS NOT NULL)::int AS avec_prix
  FROM magic_items GROUP BY 1`
console.log(r)

// Combien de lignes d'André portent un porteur ?
const p = await sql`
  SELECT count(DISTINCT m.id)::int AS objets_portes, count(*)::int AS lignes_fiche
  FROM magic_items m JOIN character_magic_items c ON c.objet_id = m.id`
console.log('portés', p)

// Les lignes d'André qui ONT une description (pour voir à quoi elles ressemblent)
const d = await sql`SELECT id, nom, type, left(description, 90) AS d FROM magic_items WHERE id <= 278 AND description IS NOT NULL AND btrim(description) <> '' ORDER BY id LIMIT 25`
for (const l of d) console.log(JSON.stringify(l))
const c = await sql`SELECT count(*)::int n FROM magic_items WHERE id <= 278`
console.log('lignes <=278 :', c[0].n)

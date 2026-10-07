import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.log('— les 4 sorts encore sans description —')
console.table(await sql`SELECT s.id, s.nom,
  (SELECT string_agg(c.nom||' '||scl.niveau,', ') FROM spell_class_levels scl JOIN classes c ON c.id=scl.classe_id WHERE scl.sort_id=s.id) classes
  FROM spells s WHERE s.description IS NULL OR trim(s.description)='' ORDER BY s.nom`)
console.log('— entrées groupées : la note de version est-elle là? —')
const g = await sql`SELECT id, nom, left(description, 150) debut FROM spells
  WHERE nom LIKE '%/%' AND (nom LIKE 'Cercle magique%' OR nom LIKE 'Détection de la Loi%' OR nom LIKE 'Protection contre la Loi%' OR nom LIKE 'Rejet de la Loi%') ORDER BY nom`
for (const r of g as any[]) console.log(`  [${r.id}] ${r.nom}\n      ${r.debut?.replace(/\n/g,' ⏎ ')}`)
console.log('\n— Courroux de l\'ordre : note du copiste en queue —')
const c = await sql`SELECT right(description, 200) fin FROM spells WHERE id = 1217`
console.log('  …' + (c as any[])[0].fin)

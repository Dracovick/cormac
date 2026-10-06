import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const classes = await sql`select c.id, c.nom, count(scl.id)::int n from classes c left join spell_class_levels scl on scl.classe_id=c.id group by c.id, c.nom order by n desc` as any[]
console.log('Classes :', classes.map(c=>`[${c.id}] ${c.nom}: ${c.n}`).join(' | '))
const sansClasse = await sql`select s.source, count(*)::int n from spells s where not exists (select 1 from spell_class_levels scl where scl.sort_id=s.id) group by s.source order by n desc` as any[]
console.log('Sorts SANS classes, par source :', JSON.stringify(sansClasse))
const avecClasse = await sql`select s.source, count(*)::int n from spells s where exists (select 1 from spell_class_levels scl where scl.sort_id=s.id) group by s.source order by n desc` as any[]
console.log('Sorts AVEC classes, par source :', JSON.stringify(avecClasse))

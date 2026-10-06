import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.log('--- magic_items par type:')
for (const r of await sql`select coalesce(type,'(nul)') as t, count(*)::int as n from magic_items group by 1 order by n desc` as any[]) console.log(`  ${r.t}: ${r.n}`)
console.log('--- weapons par categorie:')
for (const r of await sql`select coalesce(wc.nom,'(nulle)') as c, count(*)::int as n from weapons w left join weapon_categories wc on wc.id = w.categorie_id group by 1 order by n desc` as any[]) console.log(`  ${r.c}: ${r.n}`)
console.log('--- spells par ecole:')
for (const r of await sql`select coalesce(ecole,'(nulle)') as e, count(*)::int as n from spells group by 1 order by n desc` as any[]) console.log(`  ${r.e}: ${r.n}`)
console.log('--- feats par categorie:')
for (const r of await sql`select coalesce(categorie,'(nulle)') as c, count(*)::int as n from feats group by 1 order by n desc limit 15` as any[]) console.log(`  ${r.c}: ${r.n}`)
console.log('--- classes:')
for (const r of await sql`select id, nom from classes order by id` as any[]) console.log(`  [${r.id}] ${r.nom}`)
console.log('--- taille texte totale:')
const [sz] = await sql`select (select coalesce(sum(length(description)),0) from spells) as sp, (select coalesce(sum(length(description)),0) from magic_items) as mi, (select coalesce(sum(length(description)),0) from feats) as fe` as any[]
console.log(`  descriptions sorts: ${sz.sp} car., objets: ${sz.mi}, dons: ${sz.fe}`)

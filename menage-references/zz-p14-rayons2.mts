import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.log('--- armes : vides par statut de catalogue')
console.log(await sql`SELECT est_catalogue, count(*)::int n, count(*) FILTER (WHERE description IS NULL OR btrim(description)='')::int vides FROM weapons GROUP BY 1`)
console.log('--- armes du catalogue sans description')
console.log((await sql`SELECT id, nom FROM weapons WHERE (description IS NULL OR btrim(description)='') AND est_catalogue ORDER BY nom`).map(x=>`[${x.id}] ${x.nom}`).join(' · ') || '(aucune)')
console.log('\n--- potions sans description')
console.log((await sql`SELECT id, nom, sort_effet FROM potions WHERE description IS NULL OR btrim(description)='' ORDER BY nom`).map(x=>`[${x.id}] ${x.nom} | ${x.sort_effet ?? '—'}`).join('\n'))
console.log('\n--- sorts sans description')
console.log((await sql`SELECT id, nom, ecole FROM spells WHERE description IS NULL OR btrim(description)='' ORDER BY nom`).map(x=>`[${x.id}] ${x.nom} | ${x.ecole ?? '—'}`).join('\n'))
console.log('\n--- compétences / dons vides')
console.log(await sql`SELECT (SELECT count(*)::int FROM skills WHERE description IS NULL OR btrim(description)='') AS skills_vides, (SELECT count(*)::int FROM feats WHERE description IS NULL OR btrim(description)='') AS feats_vides`)

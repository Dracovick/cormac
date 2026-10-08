import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const skills = await sql`SELECT id, nom, caracteristique FROM skills ORDER BY nom` as any[]
console.log('TOTAL =', skills.length)
console.log('FIN DE LISTE (après Saut) :')
for (const s of skills.slice(76)) console.log(`[${s.id}]`, s.nom, '|', s.caracteristique)

const cs = await sql`SELECT count(*)::int n, count(distinct skill_id)::int d, count(distinct personnage_id)::int p FROM character_skills` as any[]
console.log('character_skills:', JSON.stringify(cs[0]))
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='class_skill_list'` as any[]
console.log('class_skill_list cols:', cols.map(c=>c.column_name).join(', '))
const csl = await sql`SELECT count(*)::int n, count(distinct skill_id)::int d FROM class_skill_list` as any[]
console.log('class_skill_list:', JSON.stringify(csl[0]))
// porteurs par compétence
const top = await sql`SELECT s.nom, count(*)::int n FROM character_skills cs JOIN skills s ON s.id=cs.skill_id GROUP BY s.nom ORDER BY n DESC LIMIT 15` as any[]
console.log('TOP porteurs:', top.map(t=>`${t.nom}(${t.n})`).join(', '))
// compétences sans aucun porteur
const zero = await sql`SELECT s.id, s.nom FROM skills s WHERE NOT EXISTS (SELECT 1 FROM character_skills cs WHERE cs.skill_id=s.id) ORDER BY s.nom` as any[]
console.log('SANS PORTEUR =', zero.length, ':', zero.map(z=>`[${z.id}] ${z.nom}`).join(' · '))

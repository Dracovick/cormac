import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const skills = await sql`SELECT id, nom, nom_en, caracteristique, formation_requise,
  (description IS NULL OR description = '') AS vide, length(description) AS len
  FROM skills ORDER BY nom` as any[]
console.log('TOTAL skills =', skills.length)
console.log('sans description =', skills.filter(s => s.vide).length)
for (const s of skills) console.log(`[${s.id}]`.padEnd(6), (s.nom||'').padEnd(38), (s.nom_en||'—').padEnd(26), (s.caracteristique||'?').padEnd(5), s.formation_requise ? 'FORM' : '    ', s.vide ? 'VIDE' : `desc:${s.len}`)

const cs = await sql`SELECT count(*)::int n, count(distinct skill_id)::int d, count(distinct personnage_id)::int p FROM character_skills` as any[]
console.log('character_skills:', JSON.stringify(cs[0]))
const csl = await sql`SELECT count(*)::int n, count(distinct skill_id)::int d, count(distinct classe)::int c FROM class_skill_list` as any[]
console.log('class_skill_list:', JSON.stringify(csl[0]))
const orph = await sql`SELECT count(*)::int n FROM character_skills cs WHERE NOT EXISTS (SELECT 1 FROM skills s WHERE s.id = cs.skill_id)` as any[]
console.log('character_skills orphelins:', orph[0].n)

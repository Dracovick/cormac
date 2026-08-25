import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const D = 'X:/Claude-Tools/cormac/menage-references/'
const skills = await sql`select * from skills order by id`
const cs = await sql`select * from character_skills order by id`
const races = await sql`select * from races order by id`
const rf = await sql`select * from racial_features order by id`
fs.writeFileSync(D+'export-avant-2.json', JSON.stringify({ horodatage:new Date().toISOString(), skills, character_skills:cs, races, racial_features:rf }, null, 1))

const q = v => v===null||v===undefined ? 'NULL' : (typeof v==='number'||typeof v==='boolean' ? String(v) : `'${String(v).replace(/'/g,"''")}'`)
const L = ['-- Restauration de l etat du ' + new Date().toISOString() + ' (avant le lot sur)',
 '-- Remet skills, character_skills, races et racial_features exactement dans leur etat d avant.',
 '-- Les entrees supprimees sont recreees avec leur id d origine.', '']
L.push('-- 1. recreer les entrees skills supprimees (ignore si elles existent encore)')
for (const s of skills) L.push(`INSERT INTO skills (id,nom,caracteristique,formation_requise${'description' in s ? ',description':''}) VALUES (${s.id},${q(s.nom)},${q(s.caracteristique)},${q(s.formation_requise)}${'description' in s ? ','+q(s.description):''}) ON CONFLICT (id) DO UPDATE SET nom=EXCLUDED.nom, caracteristique=EXCLUDED.caracteristique;`)
L.push('', '-- 2. remettre chaque lien character_skills sur son skill d origine')
for (const x of cs) L.push(`UPDATE character_skills SET skill_id=${q(x.skill_id)}, rangs_investis=${q(x.rangs_investis)}, modif_divers=${q(x.modif_divers)} WHERE id=${x.id};`)
L.push('', '-- 3. races')
for (const r of races) L.push(`UPDATE races SET nom=${q(r.nom)}, taille=${q(r.taille)}, deplacement_base=${q(r.deplacement_base)}, bonus_for=${q(r.bonus_for)}, bonus_dex=${q(r.bonus_dex)}, bonus_con=${q(r.bonus_con)}, bonus_int=${q(r.bonus_int)}, bonus_sag=${q(r.bonus_sag)}, bonus_cha=${q(r.bonus_cha)}, vision_nocturne=${q(r.vision_nocturne)} WHERE id=${r.id};`)
L.push('', '-- 4. racial_features : retirer ceux ajoutes a Petite-gens (id 11)')
L.push(`DELETE FROM racial_features WHERE race_id=11 AND id NOT IN (${rf.filter(x=>x.race_id===11).map(x=>x.id).join(',') || '0'});`)
L.push('', `-- etat d origine : ${skills.length} skills, ${cs.length} liens, ${races.length} races, ${rf.length} traits raciaux`)
fs.writeFileSync(D+'restauration-2.sql', L.join('\n'))
console.log(`skills ${skills.length} | character_skills ${cs.length} | races ${races.length} | racial_features ${rf.length}`)
console.log('lignes SQL :', L.length)

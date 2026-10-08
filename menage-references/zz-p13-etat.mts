import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const lignes = await sql`
  SELECT id, nom, caracteristique, formation_requise, est_catalogue, catalogue_id,
         malus_armure, (description IS NOT NULL) AS a_desc
  FROM skills
  WHERE nom ILIKE '%connaissance de la magie%' OR nom ILIKE '%art de la magie%'
  ORDER BY id`
console.log('=== LIGNES skills candidates ===')
console.log(JSON.stringify(lignes, null, 1))

for (const l of lignes as any[]) {
  const p = await sql`
    SELECT cs.id, cs.personnage_id, c.nom AS perso, cs.rangs_investis, cs.modif_divers
    FROM character_skills cs JOIN characters c ON c.id = cs.personnage_id
    WHERE cs.skill_id = ${l.id} ORDER BY c.nom`
  console.log(`\n--- [${l.id}] ${l.nom} : ${p.length} porteur(s)`)
  for (const x of p as any[]) console.log(`   perso ${x.personnage_id} ${x.perso} — rangs ${x.rangs_investis}, divers ${x.modif_divers} (ligne cs ${x.id})`)
}

const ids = (lignes as any[]).map(l => l.id)
if (ids.length >= 2) {
  const conflits = await sql`
    SELECT cs.personnage_id, c.nom AS perso, count(*) AS n,
           json_agg(json_build_object('skill', cs.skill_id, 'rangs', cs.rangs_investis, 'divers', cs.modif_divers)) AS lignes
    FROM character_skills cs JOIN characters c ON c.id = cs.personnage_id
    WHERE cs.skill_id = ANY(${ids}) GROUP BY cs.personnage_id, c.nom HAVING count(*) > 1`
  console.log('\n=== PERSOS QUI PORTENT LES DEUX ===')
  console.log(conflits.length === 0 ? 'aucun' : JSON.stringify(conflits, null, 1))
}

// Qui pointe vers ces lignes ailleurs ?
const refs = await sql`SELECT id, nom FROM skills WHERE catalogue_id = ANY(${ids})`
console.log('\n=== lignes skills rattachées à ces ids (catalogue_id) ===')
console.log(refs.length === 0 ? 'aucune' : JSON.stringify(refs))
const cls = await sql`SELECT * FROM class_skill_list WHERE skill_id = ANY(${ids})`
console.log('\n=== class_skill_list ===')
console.log(JSON.stringify(cls))

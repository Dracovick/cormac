/**
 * Photo de l'existant avant toute écriture : la table `skills` (88 lignes de
 * saisie FileMaker, aucune description), `class_skill_list` (vide) et les
 * porteurs. Lecture seule.
 *
 * Usage : npx tsx menage-references/p11-etat-base.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const colonnes = await sql`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_name IN ('skills','class_skill_list','character_skills','classes')
  ORDER BY table_name, ordinal_position` as any[]
console.log('=== COLONNES ===')
let courante = ''
for (const c of colonnes) {
  if (c.table_name !== courante) { courante = c.table_name; console.log(`\n${courante}`) }
  console.log(`  ${c.column_name} : ${c.data_type}`)
}

const [compte] = await sql`
  SELECT
    (SELECT count(*)::int FROM skills) skills,
    (SELECT count(*)::int FROM class_skill_list) class_skill_list,
    (SELECT count(*)::int FROM character_skills) character_skills,
    (SELECT count(*)::int FROM classes) classes,
    (SELECT count(*)::int FROM skills WHERE description IS NOT NULL AND description <> '') avec_description` as any[]
console.log('\n=== COMPTES ===')
console.log(compte)

console.log('\n=== CLASSES EN BASE ===')
const classes = await sql`SELECT id, nom FROM classes ORDER BY nom` as any[]
console.log(classes.map(c => `${c.id} ${c.nom}`).join(' · '))

console.log('\n=== LES 88 LIGNES DE skills ===')
const lignes = await sql`
  SELECT s.id, s.nom, s.caracteristique, s.formation_requise,
    (SELECT count(*)::int FROM character_skills cs WHERE cs.skill_id = s.id) porteurs
  FROM skills s ORDER BY s.nom` as any[]
for (const l of lignes) {
  console.log(`${String(l.id).padStart(3)} ${l.nom.padEnd(42)} ${String(l.caracteristique ?? '—').padEnd(8)} ${l.formation_requise ? 'formation' : '—'.padEnd(9)} ${l.porteurs} porteur(s)`)
}

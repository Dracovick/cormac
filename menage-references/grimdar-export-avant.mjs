import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const D = 'X:/Claude-Tools/cormac/menage-references/'

// Tables de REFERENCE ou le script insere (le --rollback du script ne les nettoie PAS)
const refs = ['clans', 'skills', 'feats', 'weapons', 'armor', 'magic_items']
// Tables du PERSONNAGE (celles-la, --rollback les nettoie)
const perso = ['characters', 'character_classes', 'character_ability_scores', 'character_combat_stats',
  'character_saving_throws', 'character_skills', 'character_feats', 'character_weapons', 'character_armor',
  'character_magic_items', 'character_currency', 'character_languages', 'character_companions',
  'character_notes', 'character_journal', 'character_potions', 'character_spells', 'character_spell_effects',
  'character_creatures']

const etat = { horodatage: new Date().toISOString(), refs: {}, perso: {} }
for (const t of refs) {
  const r = (await sql.query(`select coalesce(max(id),0)::int m, count(*)::int n from ${t}`))[0]
  etat.refs[t] = { maxId: r.m, nb: r.n }
}
for (const t of perso) {
  const r = (await sql.query(`select count(*)::int n from ${t}`))[0]
  etat.perso[t] = r.n
}
fs.writeFileSync(D + 'grimdar-etat-avant.json', JSON.stringify(etat, null, 1))

const L = ['-- Filet de securite AVANT l import de Grimdar — ' + etat.horodatage,
  '--',
  '-- 1) Annuler le personnage et ses tables filles (voie normale) :',
  '--    npx tsx --env-file=.env.local scripts/import-grimdar.ts --rollback=<id>',
  '--',
  '-- 2) Puis retirer les references creees, que le rollback ne touche PAS.',
  '--    Chaque ligne supprime uniquement ce qui a ete cree APRES cet instant.',
  '--    ⛔ A n executer que si l import est abandonne, et dans cet ordre.',
  '']
for (const t of refs) L.push(`DELETE FROM ${t} WHERE id > ${etat.refs[t].maxId};   -- ${t} comptait ${etat.refs[t].nb} lignes, max(id)=${etat.refs[t].maxId}`)
L.push('', '-- Verification apres restauration : ces comptes doivent etre retrouves')
for (const t of refs) L.push(`--   ${t} = ${etat.refs[t].nb}`)
for (const t of perso) L.push(`--   ${t} = ${etat.perso[t]}`)
fs.writeFileSync(D + 'grimdar-restauration.sql', L.join('\n'))

console.log('=== ETAT AVANT ===')
for (const t of refs) console.log(`  ${t.padEnd(14)} ${String(etat.refs[t].nb).padStart(4)} lignes, max(id)=${etat.refs[t].maxId}`)
console.log('  --- tables du personnage ---')
for (const t of perso) console.log(`  ${t.padEnd(26)} ${etat.perso[t]}`)

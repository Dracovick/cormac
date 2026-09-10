import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const refs = ['clans','skills','feats','weapons','armor','magic_items','potions']
const perso = ['characters','character_classes','character_ability_scores','character_combat_stats',
  'character_saving_throws','character_skills','character_feats','character_weapons','character_armor',
  'character_magic_items','character_currency','character_languages','character_companions',
  'character_notes','character_journal','character_potions','character_spells','character_spell_effects',
  'character_creatures']
const av = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/krugg-etat-avant.json','utf8'))
console.log('=== REFERENCES (avant 2026-08-28T01:31Z  ->  maintenant) ===')
for (const t of refs) {
  const r = (await sql.query(`select coalesce(max(id),0)::int m, count(*)::int n from ${t}`))[0]
  const a = av.refs[t]
  const flag = (a.n !== r.n || a.maxId !== r.m) ? '  <<< A BOUGE' : ''
  console.log(`  ${t.padEnd(14)} nb ${String(a.nb).padStart(4)} -> ${String(r.n).padStart(4)}   maxId ${String(a.maxId).padStart(4)} -> ${String(r.m).padStart(4)}${flag}`)
}
console.log('=== TABLES PERSONNAGE (totaux base) ===')
for (const t of perso) {
  const r = (await sql.query(`select count(*)::int n from ${t}`))[0]
  const a = av.perso[t]
  console.log(`  ${t.padEnd(28)} ${String(a).padStart(4)} -> ${String(r.n).padStart(4)}${a!==r.n?'  <<< A BOUGE':''}`)
}
// dernieres modifications de personnages
console.log('=== 8 personnages modifies le plus recemment ===')
for (const r of await sql.query(`select id,nom,updated_at from characters order by updated_at desc limit 8`))
  console.log(`  ${String(r.id).padStart(3)}  ${r.updated_at.toISOString?.() ?? r.updated_at}  ${r.nom}`)

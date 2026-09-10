// Qui d'autre utilise les references que l'on songerait a toucher ? — lecture seule.
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'
const raw = readFileSync('.env.local', 'utf-8')
for (const l of raw.split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}
const sql = neon(process.env.DATABASE_URL)
const show = async (label, q, p = []) => {
  const r = await sql.query(q, p)
  console.log('\n=== ' + label + ' (' + r.length + ') ===')
  for (const x of r) console.log(JSON.stringify(x))
}
await show('armes 157/158/159 — porteurs', `select cw.arme_id, w.nom, cw.personnage_id, c.nom as perso from character_weapons cw join weapons w on w.id=cw.arme_id join characters c on c.id=cw.personnage_id where cw.arme_id in (157,158,159) order by cw.arme_id`)
await show('anneau 12 — porteurs', `select cm.personnage_id, c.nom from character_magic_items cm join characters c on c.id=cm.personnage_id where cm.objet_id=12`)
await show('cape resistance 10 — porteurs', `select cm.personnage_id, c.nom from character_magic_items cm join characters c on c.id=cm.personnage_id where cm.objet_id=10`)
await show('plaque complete 5 — porteurs', `select ca.personnage_id, c.nom, ca.bonus_magique from character_armor ca join characters c on c.id=ca.personnage_id where ca.armure_id=5`)
await show('amulette protection +3 (71) — porteurs', `select cm.personnage_id, c.nom from character_magic_items cm join characters c on c.id=cm.personnage_id where cm.objet_id=71`)
await show('objets magiques a bonus non nul (piege CA)', `select id,nom,type,bonus from magic_items where bonus is not null and (nom ilike '%resistance%' or nom ilike '%r_sistance%' or nom ilike '%dexterite%' or nom ilike '%dext_rit_%' or nom ilike '%charisme%' or nom ilike '%force%' or nom ilike '%jade%') order by nom`)
await show('deplacement des autres personnages', `select deplacement, count(*)::int as n from character_combat_stats group by deplacement order by 1`)
await show('amulette charisme ?', `select id,nom,bonus from magic_items where nom ilike '%charisme%'`)

// Appariement lecture seule des elements de la fiche papier de Krugg avec la base.
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

await show('ARMURES (toutes)', `select id,nom,type,bonus_armure,max_dex,malus_competence,risque_echec_magique,deplacement,poids,prix from armor order by id`)
await show('OBJETS anneau/cape/amulette', `select id,nom,type,emplacement,bonus,charges_max from magic_items where nom ilike '%anneau%' or nom ilike '%cape%' or nom ilike '%amulette%' order by nom`)
await show('OBJETS parchemin/gant/baton', `select id,nom,type,emplacement,bonus,charges_max from magic_items where nom ilike '%parchemin%' or nom ilike '%gant%' or nom ilike '%b_ton%' order by nom`)
await show('POTIONS', `select id,nom,sort_effet,niveau,charges_max from potions order by id`)
await show('ARMES epee/dague', `select id,nom,categorie_id,degats,critique_min,critique_mult,portee,type_degats,taille from weapons where nom ilike '%p_e%' or nom ilike '%dague%' order by nom`)
await show('CATEGORIES ARMES', `select id,nom from weapon_categories order by id`)
await show('COMPETENCES discretion', `select id,nom,nom_en,caracteristique,formation_requise from skills where nom ilike '%discr%' or nom ilike '%crochet%' or nom ilike '%silenc%' order by nom`)
await show('DONS renvoi/quintessence/maniement', `select id,nom,categorie from feats where nom ilike '%renvoi%' or nom ilike '%quintessence%' or nom ilike '%maniement%' order by nom`)
await show('SORTS domaine Force/Chance ?', `select count(*)::int as n from spells`)
await show('MAX IDS', `select
 (select max(id) from skills) as skills,
 (select max(id) from feats) as feats,
 (select max(id) from weapons) as weapons,
 (select max(id) from armor) as armor,
 (select max(id) from magic_items) as magic_items,
 (select max(id) from potions) as potions,
 (select max(id) from clans) as clans,
 (select max(id) from characters) as characters`)
await show('COMPTES', `select
 (select count(*) from characters) as characters,
 (select count(*) from skills) as skills,
 (select count(*) from feats) as feats,
 (select count(*) from weapons) as weapons,
 (select count(*) from armor) as armor,
 (select count(*) from magic_items) as magic_items,
 (select count(*) from potions) as potions,
 (select count(*) from character_skills) as character_skills,
 (select count(*) from character_magic_items) as character_magic_items,
 (select count(*) from character_armor) as character_armor,
 (select count(*) from character_weapons) as character_weapons`)

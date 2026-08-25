import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const sql = neon(env.match(/DATABASE_URL=(.+)/)[1].trim())
const D = 'X:/Claude-Tools/cormac/menage-references/'

const races = await sql`select * from races order by id`
const classes = await sql`select * from classes order by id`
const chars = await sql`select id, nom, race_id from characters order by id`
const cc = await sql`select * from character_classes order by id`
const rf = await sql`select * from racial_features order by id`
const clans = await sql`select * from clans order by id`

fs.writeFileSync(D+'export-avant.json', JSON.stringify({ horodatage:new Date().toISOString(), races, classes, characters:chars, character_classes:cc, racial_features:rf, clans }, null, 1))

// SQL de restauration : remet chaque ligne exactement dans son etat d'avant
const q = v => v===null||v===undefined ? 'NULL' : (typeof v==='number'||typeof v==='boolean' ? String(v) : `'${String(v).replace(/'/g,"''")}'`)
const L = ['-- Restauration de l etat du ' + new Date().toISOString(),
  '-- A executer seulement pour ANNULER les modifications de la phase 2 etape 1.', '']

L.push('-- races (nom, taille, bonus, deplacement)')
for (const r of races) L.push(`UPDATE races SET nom=${q(r.nom)}, taille=${q(r.taille)}, deplacement_base=${q(r.deplacement_base)}, bonus_for=${q(r.bonus_for)}, bonus_dex=${q(r.bonus_dex)}, bonus_con=${q(r.bonus_con)}, bonus_int=${q(r.bonus_int)}, bonus_sag=${q(r.bonus_sag)}, bonus_cha=${q(r.bonus_cha)}, vision_nocturne=${q(r.vision_nocturne)} WHERE id=${r.id};`)
L.push('', '-- classes (nom, de_vie, progressions)')
for (const c of classes) L.push(`UPDATE classes SET nom=${q(c.nom)}, de_vie=${q(c.de_vie)}, bba_progression=${q(c.bba_progression)}, vigueur_progression=${q(c.vigueur_progression)}, reflexes_progression=${q(c.reflexes_progression)}, volonte_progression=${q(c.volonte_progression)}, competences_par_niveau=${q(c.competences_par_niveau)} WHERE id=${c.id};`)
L.push('', '-- characters.race_id')
for (const c of chars) L.push(`UPDATE characters SET race_id=${q(c.race_id)} WHERE id=${c.id};`)
L.push('', '-- character_classes')
for (const x of cc) L.push(`UPDATE character_classes SET personnage_id=${q(x.personnage_id)}, classe_id=${q(x.classe_id)}, niveau=${q(x.niveau)} WHERE id=${x.id};`)
L.push('', '-- races supprimees : a recreer si besoin (voir export-avant.json)')
for (const r of races) if ([9,10].includes(r.id)) L.push(`-- INSERT INTO races (id,nom,bonus_for,bonus_dex,bonus_con,bonus_int,bonus_sag,bonus_cha,taille,deplacement_base,vision_nocturne) VALUES (${r.id},${q(r.nom)},${q(r.bonus_for)},${q(r.bonus_dex)},${q(r.bonus_con)},${q(r.bonus_int)},${q(r.bonus_sag)},${q(r.bonus_cha)},${q(r.taille)},${q(r.deplacement_base)},${q(r.vision_nocturne)});`)

fs.writeFileSync(D+'restauration.sql', L.join('\n'))
console.log('races', races.length, '| classes', classes.length, '| characters', chars.length, '| character_classes', cc.length, '| racial_features', rf.length, '| clans', clans.length)
console.log('lignes SQL de restauration :', L.length)

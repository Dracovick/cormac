import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const ID = 82
const perso = ['characters','character_classes','character_ability_scores','character_combat_stats',
  'character_saving_throws','character_skills','character_feats','character_weapons','character_armor',
  'character_magic_items','character_currency','character_languages','character_companions',
  'character_notes','character_journal','character_potions','character_spells','character_spell_effects',
  'character_creatures']
const out = {}
out.characters = await sql.query('select * from characters where id=$1',[ID])
for (const t of perso.filter(t=>t!=='characters')) out[t] = await sql.query(`select * from ${t} where personnage_id=$1`,[ID])
out._weapons_du_perso = await sql.query('select * from weapons where id in (select arme_id from character_weapons where personnage_id=$1)',[ID])
console.log(JSON.stringify(out,null,1))

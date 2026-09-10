// Etat complet du personnage id=82 « Krugg Coeur-Flamboyant » — lecture seule.
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'
const raw = readFileSync('.env.local', 'utf-8')
for (const l of raw.split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}
const sql = neon(process.env.DATABASE_URL)
const ID = Number(process.argv[2] ?? 82)
const show = async (label, q) => {
  const r = await sql.query(q, [ID])
  console.log('\n=== ' + label + ' (' + r.length + ') ===')
  for (const x of r) console.log(JSON.stringify(x))
}
await show('characters', `select * from characters where id=$1`)
await show('classes', `select cc.*, c.nom from character_classes cc join classes c on c.id=cc.classe_id where cc.personnage_id=$1`)
await show('ability_scores', `select * from character_ability_scores where personnage_id=$1`)
await show('combat_stats', `select * from character_combat_stats where personnage_id=$1`)
await show('saving_throws', `select * from character_saving_throws where personnage_id=$1`)
await show('skills', `select cs.*, s.nom, s.caracteristique from character_skills cs join skills s on s.id=cs.skill_id where cs.personnage_id=$1 order by s.nom`)
await show('feats', `select cf.*, f.nom from character_feats cf join feats f on f.id=cf.feat_id where cf.personnage_id=$1`)
await show('weapons', `select cw.*, w.nom, w.degats, w.critique_min, w.critique_mult, w.portee, w.type_degats from character_weapons cw join weapons w on w.id=cw.arme_id where cw.personnage_id=$1`)
await show('armor', `select ca.*, a.nom, a.type, a.bonus_armure, a.max_dex, a.malus_competence, a.deplacement from character_armor ca join armor a on a.id=ca.armure_id where ca.personnage_id=$1`)
await show('magic_items', `select cm.*, m.nom, m.type, m.bonus, m.charges_max from character_magic_items cm join magic_items m on m.id=cm.objet_id where cm.personnage_id=$1`)
await show('potions', `select cp.*, p.nom from character_potions cp join potions p on p.id=cp.potion_id where cp.personnage_id=$1`)
await show('currency', `select * from character_currency where personnage_id=$1`)
await show('languages', `select cl.*, l.nom from character_languages cl join languages l on l.id=cl.langue_id where cl.personnage_id=$1`)
await show('spells', `select cs.*, s.nom from character_spells cs join spells s on s.id=cs.sort_id where cs.personnage_id=$1 order by cs.niveau, s.nom`)
await show('spell_effects', `select * from character_spell_effects where personnage_id=$1`)
await show('companions', `select * from character_companions where personnage_id=$1`)
await show('notes', `select * from character_notes where personnage_id=$1`)
await show('journal', `select * from character_journal where personnage_id=$1 order by id`)
await show('creatures', `select * from character_creatures where personnage_id=$1`)

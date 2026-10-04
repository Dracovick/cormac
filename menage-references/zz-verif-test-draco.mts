import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const [perso] = await sql.query(`select c.id, c.nom, c.xp, cs.bba_corps_a_corps, cs.bba_projectiles, a.for_base from characters c
  left join character_combat_stats cs on cs.personnage_id=c.id
  left join character_ability_scores a on a.personnage_id=c.id
  where c.nom='ZZ Test Draco'`) as any[]
console.log('PERSO:', JSON.stringify(perso))
const armes = await sql.query(`select w.id, w.nom, w.degats, w.critique_min, w.critique_mult from weapons w where w.nom like 'ZZ %'`)
console.log('ARME REF:', JSON.stringify(armes))
const pots = await sql.query(`select p.id, p.nom, p.sort_effet from potions p where p.nom like 'ZZ %'`)
console.log('POTION REF:', JSON.stringify(pots))
const cls = await sql.query(`select cl.nom, cc.niveau from character_classes cc join classes cl on cl.id=cc.classe_id where cc.personnage_id=${perso.id}`)
console.log('CLASSES:', JSON.stringify(cls))

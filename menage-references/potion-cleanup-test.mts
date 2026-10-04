import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const orphans = await sql.query(`select id, personnage_id, potion_id from character_potions where personnage_id = 92`)
console.log('liens du perso 92 restants:', JSON.stringify(orphans))
const liens18 = await sql.query(`select id from character_potions where potion_id = 18`)
console.log('liens vers potion 18:', JSON.stringify(liens18))
if ((liens18 as any[]).length === 0) {
  await sql.query(`delete from potions where id = 18 and nom = 'ZZ Potion Test Effet'`)
  console.log('potion de test 18 supprimée')
}
const check = await sql.query(`select id, nom from potions where id >= 17 order by id`)
console.log('potions >= 17:', JSON.stringify(check))

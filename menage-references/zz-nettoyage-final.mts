import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const p = await sql.query(`select id from characters where nom like 'ZZ %'`) as any[]
console.log('persos ZZ restants:', JSON.stringify(p))
const j = await sql.query(`select count(*)::int as n from character_journal where personnage_id=93`) as any[]
console.log('journal perso 93 restant:', j[0].n)
// Références de test à retirer (aucun porteur: le perso est supprimé)
const w = await sql.query(`delete from weapons where nom='ZZ Épée test Draco' and not exists (select 1 from character_weapons cw where cw.arme_id=weapons.id) returning id`)
console.log('weapons test supprimées:', JSON.stringify(w))
const pot = await sql.query(`delete from potions where nom='ZZ Potion test Draco' and not exists (select 1 from character_potions cp where cp.potion_id=potions.id) returning id`)
console.log('potions test supprimées:', JSON.stringify(pot))

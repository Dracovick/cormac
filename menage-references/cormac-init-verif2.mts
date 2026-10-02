import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const perso = await sql`select c.id, c.nom, c.race_id, r.nom race, r.bonus_dex
  from characters c left join races r on r.id = c.race_id
  where c.id = 1` as any[]
console.log('PERSO:', JSON.stringify(perso))
const effets = await sql`select * from character_spell_effects where personnage_id = 1` as any[]
console.log('EFFETS ACTIFS:', JSON.stringify(effets, null, 2))
const objets = await sql`select mi.nom, mi.bonus, cmi.emplacement from character_magic_items cmi
  join magic_items mi on mi.id = cmi.objet_id where cmi.personnage_id = 1` as any[]
console.log('OBJETS:', JSON.stringify(objets))

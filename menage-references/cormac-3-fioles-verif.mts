import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const pot = await sql`select id, nom, sort_effet, charges_max from potions where id = 23` as any[]
console.log('Référence :', JSON.stringify(pot))
const cp = await sql`select cp.id, cp.potion_id, cp.charges_restantes, c.id as char_id, c.nom as char_nom
  from character_potions cp join characters c on c.id = cp.personnage_id
  where c.nom ilike '%cormac%' order by cp.id` as any[]
console.log('Potions de Cormac :', JSON.stringify(cp))

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const pots = await sql`select id, nom, sort_effet, charges_max from potions order by id` as any[]
console.log('=== Table potions ===')
for (const p of pots) console.log(`[${p.id}] ${p.nom} | effet: ${p.sort_effet ?? '—'} | chargesMax: ${p.charges_max}`)
console.log('\n=== Porteurs (character_potions) ===')
const cp = await sql`select cp.id, cp.potion_id, cp.charges_restantes, c.id as char_id, c.nom as char_nom, p.nom as pot_nom
  from character_potions cp
  join characters c on c.id = cp.personnage_id
  join potions p on p.id = cp.potion_id
  order by cp.potion_id, c.nom` as any[]
for (const r of cp) console.log(`cp[${r.id}] potion[${r.potion_id}] « ${r.pot_nom} » → ${r.char_nom} (char ${r.char_id}), charges ${r.charges_restantes}`)

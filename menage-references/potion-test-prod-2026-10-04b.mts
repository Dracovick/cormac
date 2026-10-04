import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// État des potions de test (nom contenant TEST) et du perso jetable
console.log('=== potions de test ===')
const pots = await sql.query(`select id, nom, sort_effet, charges_max from potions where nom ilike '%test%' order by id`)
for (const r of pots as any[]) console.log(`[${r.id}] «${r.nom}» effet=«${r.sort_effet}» max=${r.charges_max}`)
if ((pots as any[]).length === 0) console.log('(aucune)')

console.log('=== persos de test ===')
const chars = await sql.query(`select id, nom from characters where nom ilike '%jetable%' or nom ilike '%test%' order by id`)
for (const r of chars as any[]) console.log(`[${r.id}] «${r.nom}»`)
if ((chars as any[]).length === 0) console.log('(aucun)')

console.log('=== liens character_potions des persos ci-dessus ===')
const cp = await sql.query(`
  select cp.id, cp.personnage_id, c.nom as perso, p.nom as potion, p.sort_effet, cp.charges_restantes
  from character_potions cp
  join characters c on c.id = cp.personnage_id
  join potions p on p.id = cp.potion_id
  where c.nom ilike '%jetable%' or c.nom ilike '%test%'
  order by cp.id desc limit 10`)
for (const r of cp as any[]) console.log(`[${r.id}] #${r.personnage_id} ${r.perso} → «${r.potion}» effet=«${r.sort_effet}» (${r.charges_restantes})`)
if ((cp as any[]).length === 0) console.log('(aucun)')

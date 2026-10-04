import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.log('--- potions (toutes) ---')
const pots = await sql.query(`select id, nom, sort_effet, charges_max from potions order by id`)
for (const r of pots as any[]) console.log(`[${r.id}] «${r.nom}» effet=«${r.sort_effet}» max=${r.charges_max}`)
console.log('--- character_potions (15 derniers) ---')
const cp = await sql.query(`select cp.id, cp.personnage_id, c.nom as perso, p.nom as potion, cp.charges_restantes from character_potions cp join characters c on c.id=cp.personnage_id join potions p on p.id=cp.potion_id order by cp.id desc limit 15`)
for (const r of cp as any[]) console.log(`[${r.id}] #${r.personnage_id} ${r.perso} → «${r.potion}» (${r.charges_restantes})`)
console.log('--- journal (5 derniers) ---')
const j = await sql.query(`select id, personnage_id, type, left(description,80) as d, created_at from character_journal order by id desc limit 5`)
for (const r of j as any[]) console.log(`[${r.id}] ${r.created_at.toISOString()} #${r.personnage_id} ${r.type} ${r.d}`)

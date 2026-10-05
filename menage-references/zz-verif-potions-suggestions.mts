import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const pots = await sql`select id, nom, sort_effet from potions where id > 12 order by id` as any[]
for (const p of pots) console.log(`[${p.id}] ${p.nom} | ${p.sort_effet ?? '—'}`)
const n = await sql`select count(*)::int as n from potions` as any[]
console.log(`Total références potions : ${n[0].n}`)
const cp = await sql`select cp.id, p.nom, cp.charges_restantes from character_potions cp join potions p on p.id = cp.potion_id where cp.personnage_id = 94` as any[]
for (const r of cp) console.log(`perso 94 : « ${r.nom} » charges ${r.charges_restantes}`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const pots = await sql`select id, nom, sort_effet, description from potions order by id` as any[]
for (const p of pots) console.log(`[${p.id}] ${p.nom} | effet: ${p.sort_effet ?? '—'} | desc: ${(p.description ?? '—').slice(0,80)}`)
console.log(`Total : ${pots.length}`)
const gaz = await sql`select id, nom from spells where lower(nom) like '%gazeu%'` as any[]
console.log('Sorts contenant "gazeu" :', JSON.stringify(gaz))

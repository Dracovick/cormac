import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, sort_effet, niveau, left(coalesce(description,''),150) d FROM potions WHERE lower(nom) LIKE '%soin%' OR lower(nom) LIKE '%invisib%' ORDER BY nom`
for (const x of r) console.log(`[${x.id}] ${x.nom} | sort: ${x.sort_effet} | niv ${x.niveau} | ${x.d}`)

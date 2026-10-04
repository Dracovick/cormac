import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const pots = await sql.query(`select id, nom, sort_effet, description from potions order by id`)
for (const r of pots as any[]) console.log(`[${r.id}] «${r.nom}» sort_effet=«${r.sort_effet}» description=«${r.description}»`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, est_catalogue, famille, degats, poids FROM weapons WHERE nom ILIKE '%masse%' OR nom ILIKE '%morgen%' OR nom ILIKE '%étoile%' ORDER BY est_catalogue DESC, id` as any[]
for (const w of r) console.log(`[${w.id}] cat=${w.est_catalogue ? 'O' : 'N'} « ${w.nom} » dég=${w.degats} poids=${w.poids} fam=${w.famille}`)

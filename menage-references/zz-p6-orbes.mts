import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, ecole, portee, duree, left(description,90) debut FROM spells WHERE nom ILIKE '%orbe%' ORDER BY nom` as any[]
for (const s of r) console.log(`[${s.id}] ${s.nom.padEnd(30)} | ${s.ecole ?? '—'} | portée ${s.portee ?? '—'} | ${String(s.debut??'').replace(/\s+/g,' ')}`)

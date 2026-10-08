import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom FROM feats WHERE description IS NULL OR description='' ORDER BY nom` as any[]
console.log(`${r.length} dons sans description`)
fs.writeFileSync('X:/Claude-Tools/cormac/.scratch-draco-dons-vides.txt', r.map(x=>`${x.id}\t${x.nom}`).join('\n'), 'utf8')
console.log(r.slice(0,60).map(x=>x.nom).join(' · '))

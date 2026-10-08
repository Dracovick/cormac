import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, type, emplacement, bonus, aura_magique, niveau_lanceur, prix, charges_max, description FROM magic_items WHERE id IN (304, 422, 316, 293, 435, 592, 507) ORDER BY id`
for (const x of r) console.log(JSON.stringify(x, null, 1))

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`update characters set xp = 3000 where nom = 'ZZTest Montée Niveau (Draco)' returning id, xp`
console.log(JSON.stringify(r))

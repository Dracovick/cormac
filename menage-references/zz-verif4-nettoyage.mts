import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const p = await sql.query(`select id, nom from characters where id=93 or nom like 'ZZ %'`)
console.log('PERSO RESTANT:', JSON.stringify(p))

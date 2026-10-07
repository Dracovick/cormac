import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.table(await sql`SELECT id, nom FROM spells WHERE nom IN ('Confusion','Contact avec les plans','Blasphème')`)
console.table(await sql`SELECT count(*)::int sorts, count(*) FILTER (WHERE description IS NULL OR trim(description)='')::int sans_desc FROM spells`)

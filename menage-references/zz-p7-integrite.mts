import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const o = await sql`SELECT count(*)::int c FROM character_weapons cw LEFT JOIN weapons w ON w.id=cw.arme_id WHERE w.id IS NULL` as any[]
console.log('liens orphelins :', o[0].c)
const d = await sql`SELECT count(*)::int c FROM weapons WHERE est_catalogue AND nom IN (SELECT nom FROM weapons WHERE est_catalogue GROUP BY nom HAVING count(*)>1)` as any[]
console.log('doublons DANS le catalogue :', d[0].c)

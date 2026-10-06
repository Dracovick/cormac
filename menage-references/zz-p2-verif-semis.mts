import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const parType = await sql`select type, count(*)::int as n from magic_items group by type order by n desc limit 12` as any[]
console.log(JSON.stringify(parType))
const doublons = await sql`select nom, count(*)::int as n from magic_items group by nom having count(*) > 1` as any[]
console.log('Doublons exacts de nom :', JSON.stringify(doublons))
const sansDesc = await sql`select count(*)::int as n from magic_items where description is null` as any[]
console.log('Sans description :', sansDesc[0].n)

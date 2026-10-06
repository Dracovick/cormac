import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const c = await sql`select id, nom from classes order by id` as any[]
console.log(JSON.stringify(c))
const n = await sql`select count(*)::int n from spells` as any[]
console.log('spells:', n[0].n)
const scl = await sql`select count(*)::int n from spell_class_levels` as any[]
console.log('spell_class_levels:', scl[0].n)

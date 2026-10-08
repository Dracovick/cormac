import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const c = await sql`SELECT (SELECT count(*)::int FROM skills) skills,
 (SELECT count(*)::int FROM skills WHERE description IS NULL OR description='') vides,
 (SELECT count(*)::int FROM character_skills) liens,
 (SELECT count(distinct personnage_id)::int FROM character_skills) persos,
 (SELECT count(*)::int FROM class_skill_list) csl,
 (SELECT count(*)::int FROM classes) classes` as any[]
console.log(JSON.stringify(c[0]))

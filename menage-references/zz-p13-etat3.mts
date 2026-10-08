import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const persos = [4, 62, 79, 76, 60, 64, 50]
console.log(JSON.stringify(await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name='characters' ORDER BY ordinal_position`))
console.log('\n--- character_classes colonnes ---')
console.log(JSON.stringify(await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name='character_classes' ORDER BY ordinal_position`))
console.log('\n--- classes des 7 ---')
console.log(JSON.stringify(await sql`SELECT * FROM character_classes WHERE personnage_id = ANY(${persos}) ORDER BY personnage_id`, null, 1))

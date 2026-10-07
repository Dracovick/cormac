import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.log(JSON.stringify({
  sortGazeux: await sql`select id, nom from spells where nom ilike '%gazeux%'`,
  potionGazeux: await sql`select id, nom from potions where nom ilike '%gazeux%'`,
  baton: await sql`select id, nom from magic_items where type = 'Bâton' limit 2`,
  baguette: await sql`select id, nom from magic_items where type = 'Baguette' limit 2`,
}, null, 1))

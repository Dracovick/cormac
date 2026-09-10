import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const r = await sql.query(`
  select cs.personnage_id, c.nom, cs.domaine1, cs.domaine2
  from character_combat_stats cs join characters c on c.id = cs.personnage_id
  where coalesce(nullif(trim(cs.domaine1),''),nullif(trim(cs.domaine2),'')) is not null
  order by cs.personnage_id`)
console.log('PERSONNAGES AVEC DOMAINES:', JSON.stringify(r, null, 1))

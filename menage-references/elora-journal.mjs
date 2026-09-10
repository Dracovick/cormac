import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
console.log('— journal d Elora (45) —')
console.log(JSON.stringify(await sql.query("select id, type, description, created_at from character_journal where personnage_id=45 order by id desc limit 15"),null,1))
console.log('— total entrees journal, toutes personnes —')
console.log(JSON.stringify(await sql.query("select type, count(*) from character_journal group by type"),null,1))

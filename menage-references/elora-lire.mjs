import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
console.log(JSON.stringify(await sql.query('select id, nom, xp from characters where id=45'),null,1))
console.log(JSON.stringify(await sql.query('select cc.*, c.nom from character_classes cc join classes c on c.id=cc.classe_id where cc.personnage_id=45'),null,1))

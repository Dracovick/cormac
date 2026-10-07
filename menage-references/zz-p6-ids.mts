import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.table(await sql`SELECT id, nom FROM spells WHERE nom IN ('Pacte mortel','Nuée d''otyughs','Flacon de fumée','Fureur vertueuse des fidèles','Résurgence de groupe') ORDER BY nom`)

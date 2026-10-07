import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.table(await sql`SELECT id, nom, ecole, portee, duree FROM spells WHERE nom IN ('Barde dorée','Brume de pureté','Avatar de la nature','Barbelures','Auréole de lumière')`)

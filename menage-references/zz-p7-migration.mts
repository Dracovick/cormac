import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
await sql`ALTER TABLE weapons ADD COLUMN IF NOT EXISTS est_catalogue boolean DEFAULT false NOT NULL`
await sql`ALTER TABLE weapons ADD COLUMN IF NOT EXISTS famille varchar(60)`
await sql`CREATE INDEX IF NOT EXISTS weapons_est_catalogue_idx ON weapons (est_catalogue)`
const c = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='weapons' ORDER BY ordinal_position` as any[]
console.log('colonnes weapons :', c.map(x=>x.column_name).join(', '))

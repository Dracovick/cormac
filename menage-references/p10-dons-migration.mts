import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
await sql`ALTER TABLE feats ADD COLUMN IF NOT EXISTS est_catalogue boolean DEFAULT false NOT NULL`
await sql`ALTER TABLE feats ADD COLUMN IF NOT EXISTS catalogue_id integer`
await sql`CREATE INDEX IF NOT EXISTS feats_est_catalogue_idx ON feats (est_catalogue)`
const c = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='feats' ORDER BY ordinal_position` as any[]
console.log('colonnes feats :', c.map((x: any) => x.column_name).join(', '))

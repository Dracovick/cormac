// Applique drizzle/0007_armes_rattachement.sql (même procédé que 0006 : SQL direct).
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

await sql`ALTER TABLE "weapons" ADD COLUMN IF NOT EXISTS "catalogue_id" integer REFERENCES "weapons"("id")`
await sql`CREATE INDEX IF NOT EXISTS "weapons_catalogue_id_idx" ON "weapons" ("catalogue_id")`

const cols = await sql`
  SELECT column_name, data_type, is_nullable FROM information_schema.columns
  WHERE table_name = 'weapons' ORDER BY ordinal_position` as any[]
console.log(cols.map(c => `${c.column_name} ${c.data_type}${c.is_nullable === 'YES' ? '' : ' NOT NULL'}`).join('\n'))

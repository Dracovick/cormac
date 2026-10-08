import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const c = await sql`SELECT conname, pg_get_constraintdef(oid) def FROM pg_constraint WHERE conrelid='weapons'::regclass` as any[]
console.log('contraintes :'); for (const x of c) console.log('  ', x.conname, '=', x.def)
const i = await sql`SELECT indexname, indexdef FROM pg_indexes WHERE tablename='weapons'` as any[]
console.log('index :'); for (const x of i) console.log('  ', x.indexdef)

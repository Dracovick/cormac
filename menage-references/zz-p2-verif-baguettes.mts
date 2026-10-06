import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const norm = (s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9+ ]/g,' ').replace(/\s+/g,' ').trim()
const md = fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p2-releves/baguettes-seul.md','utf8')
const noms = [...md.matchAll(/^### (.+)$/gm)].map(m=>m[1].trim()).filter(n=>!/^Règles générales/i.test(n))
const base = await sql`select nom from magic_items` as any[]
const enBase = new Set(base.map(b=>norm(b.nom)))
const absents = noms.filter(n=>!enBase.has(norm(n)))
console.log(`${noms.length} baguettes au relevé; absentes de la base : ${absents.length}`)
for (const a of absents) console.log('  -', a)

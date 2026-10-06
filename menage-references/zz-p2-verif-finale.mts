import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const norm = (s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9+ ]/g,' ').replace(/\s+/g,' ').trim()
const dups = await sql`select nom, count(*)::int n from magic_items group by nom having count(*)>1` as any[]
console.log('Doublons exacts :', JSON.stringify(dups))
const tous = await sql`select id, nom, type from magic_items` as any[]
const parNorm = new Map<string, any[]>()
for (const t of tous) { const k = norm(t.nom); (parNorm.get(k) ?? parNorm.set(k, []).get(k)!).push(t) }
for (const [k, v] of parNorm) if (v.length > 1) console.log('Doublon normalisé :', v.map(x=>`[${x.id}] ${x.nom} (${x.type})`).join(' ↔ '))
const types = await sql`select type, count(*)::int n from magic_items where type in ('Anneau','Baguette','Bâton','Sceptre','Objet merveilleux') group by type` as any[]
console.log(JSON.stringify(types))
const sansPrix = await sql`select count(*)::int n from magic_items where prix is null and type in ('Anneau','Baguette','Bâton','Sceptre','Objet merveilleux')` as any[]
const sansDesc = await sql`select count(*)::int n from magic_items where description is null` as any[]
console.log(`sans prix (5 types): ${sansPrix[0].n} | sans description (global): ${sansDesc[0].n}`)
const indente = await sql`select count(*)::int n from magic_items where description like ${'%\n %'}` as any[]
console.log(`descriptions avec indentation résiduelle: ${indente[0].n}`)

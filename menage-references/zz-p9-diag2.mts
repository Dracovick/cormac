import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const rows = await sql`SELECT id,nom,est_catalogue,famille,portee,catalogue_id,
  (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id=w.id) porteurs FROM weapons w ORDER BY id` as any[]
console.log('=== familles distinctes du catalogue ===')
const fam = new Map<string,number>()
for (const r of rows.filter(r=>r.est_catalogue)) fam.set(r.famille ?? 'NULL', (fam.get(r.famille ?? 'NULL')??0)+1)
for (const [k,v] of [...fam].sort()) console.log(`  ${v.toString().padStart(3)}  ${k}`)
console.log('\n=== catalogue avec portée NON nulle ===')
for (const r of rows.filter(r=>r.est_catalogue && r.portee!=null)) console.log(`  [${r.id}] ${r.nom.padEnd(34)} portée=${String(r.portee).padStart(3)}  porteurs=${r.porteurs}  fam=${r.famille}`)
console.log('\n=== inventaire avec portée non nulle ET porteurs ===')
for (const r of rows.filter(r=>!r.est_catalogue && r.portee!=null && r.porteurs>0)) console.log(`  [${r.id}] ${r.nom.padEnd(34)} portée=${r.portee} porteurs=${r.porteurs} cat_id=${r.catalogue_id}`)

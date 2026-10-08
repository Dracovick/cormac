import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const cat = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p7-armes-catalogue.json','utf8')).armes
const db = await sql`SELECT id,nom,famille,degats,critique_min,critique_mult,portee,type_degats,poids,prix FROM weapons WHERE est_catalogue ORDER BY nom` as any[]
const n = (s:string)=> s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\u2019\u02bc]/g,"'").replace(/\s+/g,' ').trim()
console.log(`json=${cat.length} db=${db.length}`)
console.log('\n=== noms DB qui diffèrent du Manuel (orthographe) ===')
let diff=0
for (const e of cat) {
  const m = db.find(r=>n(r.nom)===n(e.nom))
  if (!m) { console.log(`  ⛔ ABSENT en base : « ${e.nom} »`); continue }
  if (m.nom !== e.nom) { diff++; console.log(`  [${m.id}] base « ${m.nom} »  ≠  livre « ${e.nom} »`) }
}
console.log(`total divergences d'orthographe = ${diff}`)
console.log('\n=== lignes de catalogue en base absentes du relevé ===')
for (const r of db) if (!cat.find((e:any)=>n(e.nom)===n(r.nom))) console.log(`  [${r.id}] « ${r.nom} »`)

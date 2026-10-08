import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const cats = await sql`SELECT * FROM weapon_categories ORDER BY id` as any[]
console.log('CATEGORIES :'); for (const c of cats) console.log('  ', JSON.stringify(c))

const r = await sql`SELECT w.*, c.nom AS cat,
  (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = w.id) porteurs
  FROM weapons w LEFT JOIN weapon_categories c ON c.id = w.categorie_id ORDER BY w.id` as any[]
console.log(`\n${r.length} armes`)
const vide = (v:any)=> v===null || v===''
console.log('champs vides :', ['degats','critique_min','critique_mult','portee','type_degats','taille','poids','prix','description']
  .map(k=>`${k} ${r.filter((x:any)=>vide(x[k])).length}`).join(' · '))
fs.writeFileSync('C:/Users/draco/.buzz/.scratch/draco-armes-base.json', JSON.stringify(r,null,1),'utf8')
console.log('\nid\tport\tcat\tnom\tdegats\tcrit\ttype\tprix\tdesc')
for (const w of r) console.log(`${w.id}\t${w.porteurs}\t${(w.cat??'—').slice(0,14)}\t${w.nom}\t${w.degats??'—'}\t${w.critique_min??'—'}/x${w.critique_mult??'—'}\t${w.type_degats??'—'}\t${w.prix??'—'}\t${w.description?'OUI':'---'}`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT f.id, f.nom, f.description,
   (SELECT count(*)::int FROM character_feats cf WHERE cf.feat_id = f.id) porteurs
   FROM feats f ORDER BY f.nom` as any[]

const estNote = (n: string) =>
  /^[-=+\s_*·]/.test(n) ||                       // separateurs et annotations
  /^\d/.test(n) ||                               // commence par un chiffre
  /\d+d\d+|\dx ?(jour|semaine)|niv ?\d|DD ?\d|DC ?\d/i.test(n) || // mecanique chiffree
  /^\s*\(/.test(n) ||
  n.length > 60                                  // phrase, pas un nom

const notes = r.filter((x:any)=>estNote(x.nom))
const vrais = r.filter((x:any)=>!estNote(x.nom))
console.log(`TOTAL ${r.length}`)
console.log(`  lignes qui ne sont PAS des noms de dons : ${notes.length}  (dont portees par un perso : ${notes.filter((x:any)=>x.porteurs>0).length})`)
console.log(`  candidats vrais dons                    : ${vrais.length}  (sans description : ${vrais.filter((x:any)=>!x.description).length})`)
console.log(`\nORPHELINS (aucun personnage ne les porte) : ${r.filter((x:any)=>x.porteurs===0).length}`)
fs.writeFileSync('X:/Claude-Tools/cormac/.scratch-draco-dons-vrais.txt', vrais.map((x:any)=>`${x.id}\t${x.porteurs}\t${x.description?'DESC':'----'}\t${x.nom}`).join('\n'),'utf8')
fs.writeFileSync('X:/Claude-Tools/cormac/.scratch-draco-dons-notes.txt', notes.map((x:any)=>`${x.id}\t${x.porteurs}\t${x.nom}`).join('\n'),'utf8')
console.log('\n--- echantillon de candidats vrais dons sans description ---')
console.log(vrais.filter((x:any)=>!x.description).slice(0,45).map((x:any)=>`${x.nom} [${x.porteurs}]`).join(' · '))

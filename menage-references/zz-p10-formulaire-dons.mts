import fs from 'node:fs'
import { FEATS_DND35 } from '../src/lib/dnd35/feats.ts'
const cat = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p10-dons-catalogue.json','utf8')).dons
const n = (s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
const noms = new Set(cat.map((d:any)=>n(d.nom)))
const base = FEATS_DND35.filter((f:any)=>!noms.has(n(f.nom)))
console.log(`FEATS_DND35 = ${FEATS_DND35.length} ; absents du Manuel = ${base.length}`)
for (const f of base.slice(0,80)) console.log(`  ${f.categorie.padEnd(10)} ${f.nom}`)

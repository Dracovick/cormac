import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const livre = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/zz-p11-table42.json','utf8')).lignes as any[]
const n = (s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").replace(/\s+/g,' ').trim()
const parLivre = new Map(livre.map(l=>[n(l.nom),l]))

const base = await sql`SELECT s.id, s.nom, s.caracteristique, s.formation_requise,
  (SELECT count(*)::int FROM character_skills cs WHERE cs.skill_id=s.id) porteurs
  FROM skills s ORDER BY s.nom` as any[]

const apparies:any[]=[], absentsDeBase:any[]=[], horsTable:any[]=[]
for (const b of base) {
  const l = parLivre.get(n(b.nom))
  if (l) apparies.push({b,l}); else horsTable.push(b)
}
for (const l of livre) if (!base.some(b=>n(b.nom)===n(l.nom))) absentsDeBase.push(l)

console.log('=== APPARIÉS (nom officiel du Manuel déjà en base) :', apparies.length)
for (const {b,l} of apparies) {
  const ecC = b.caracteristique !== l.carac && l.carac !== '—'
  const ecF = !!b.formation_requise !== (l.innee === 'Non')
  if (ecC||ecF) console.log(`  ⚠ [${b.id}] ${b.nom}  base:${b.caracteristique}/${b.formation_requise?'form':'innée'}  livre:${l.carac}/${l.innee==='Non'?'form':'innée'}  (${b.porteurs} porteurs)`)
}
console.log('  écarts carac/formation ci-dessus :', apparies.filter(({b,l})=> (b.caracteristique!==l.carac && l.carac!=='—') || (!!b.formation_requise !== (l.innee==='Non'))).length)

console.log('\n=== DU MANUEL, ABSENTS DE LA BASE :', absentsDeBase.length)
for (const l of absentsDeBase) console.log('  -', l.nom, l.carac)

console.log('\n=== EN BASE, HORS TABLE 4-2 :', horsTable.length)
for (const b of horsTable) console.log(`  [${b.id}]`.padEnd(7), b.nom.padEnd(42), b.caracteristique.padEnd(4), `${b.porteurs} porteur(s)`)

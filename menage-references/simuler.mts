import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
type Plan = { cible:string; survId:number; survNom:string; renommer:boolean; aFusionner:{id:number;lot:string;nom:string}[]; gardees:string[] }
const plan: Plan[] = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/plan-lot-sur.json','utf8'))

// nom effectif apres fusion, par skill_id
const apres = new Map<number,string>()
for (const p of plan) { apres.set(p.survId, p.cible); for (const m of p.aFusionner) apres.set(m.id, p.cible) }

const liens = await sql`select cs.personnage_id p, c.nom pnom, cs.skill_id sid, s.nom snom, cs.rangs_investis r, cs.modif_divers d
  from character_skills cs join skills s on s.id=cs.skill_id join characters c on c.id=cs.personnage_id` as
  { p:number;pnom:string;sid:number;snom:string;r:number;d:number }[]

const listeCode = COMPETENCES_DND35.map(c => c.nom)
const visible = (l:{r:number;d:number}) => (l.r ?? 0) > 0 || (l.d ?? 0) !== 0
const nomApres = (l:{sid:number;snom:string}) => apres.get(l.sid) ?? l.snom

const total = liens.length
const avant = liens.filter(l => listeCode.includes(l.snom) && visible(l)).length
const ap    = liens.filter(l => listeCode.includes(nomApres(l)) && visible(l)).length
console.log('=== SIMULATION DU LOT SUR ===')
console.log(`liens character_skills : ${total}`)
console.log(`imprimes AVANT : ${avant} = ${(avant/total*100).toFixed(0)} %`)
console.log(`imprimes APRES : ${ap} = ${(ap/total*100).toFixed(0)} %`)

// lignes par fiche
const parFiche = new Map<number,{nom:string;av:number;ap:number}>()
for (const l of liens) {
  if (!parFiche.has(l.p)) parFiche.set(l.p, { nom:l.pnom, av:0, ap:0 })
  const f = parFiche.get(l.p)!
  if (visible(l) && listeCode.includes(l.snom)) f.av++
  if (visible(l) && listeCode.includes(nomApres(l))) f.ap++
}
const maxAp = Math.max(...[...parFiche.values()].map(f=>f.ap))
console.log(`\nlignes max sur une fiche : ${Math.max(...[...parFiche.values()].map(f=>f.av))} -> ${maxAp}   (gabarit actuel : 20)`)
console.log('fiches a 18 lignes ou plus :')
for (const [id,f] of [...parFiche.entries()].filter(([,f])=>f.ap>=18).sort((a,b)=>b[1].ap-a[1].ap))
  console.log(`   perso ${id} ${f.nom.padEnd(28)} ${f.av} -> ${f.ap}`)
console.log(`fiches n imprimant aucune competence : ${[...parFiche.values()].filter(f=>f.ap===0).length} (avant : ${[...parFiche.values()].filter(f=>f.av===0).length})`)

console.log('\n=== LES 5 FICHES QUI AVAIENT RECULE A L ETAPE 1 ===')
const etape0 : Record<number,number> = { 3:7, 83:5, 5:6, 6:10, 85:4 }  // lignes avant l etape 1
for (const [id,ref] of Object.entries(etape0)) {
  const f = parFiche.get(Number(id))!
  console.log(`   perso ${id} ${f.nom.padEnd(28)} avant etape 1 : ${ref}  |  maintenant : ${f.av}  |  apres lot sur : ${f.ap}  ${f.ap>=ref?'OK':'ENCORE EN RECUL'}`)
}

// cibles qui resteront invisibles faute d etre dans la liste du code
const invisibles = new Map<string,number>()
for (const l of liens) { const n = nomApres(l); if (visible(l) && !listeCode.includes(n)) invisibles.set(n, (invisibles.get(n)??0)+1) }
console.log('\n=== APRES FUSION, CE QUI NE S IMPRIME TOUJOURS PAS (top 20) ===')
for (const [n,c] of [...invisibles].sort((a,b)=>b[1]-a[1]).slice(0,20)) console.log(`   ${String(c).padStart(3)}  ${n}`)
console.log(`   ... ${invisibles.size} noms distincts, ${[...invisibles.values()].reduce((a,b)=>a+b,0)} lignes au total`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())

// --- extraire le MAP du fichier de mapping, sans executer son SQL ---
const src = fs.readFileSync('X:/Claude-Tools/cormac/menage-references/mapping-competences.mjs','utf8')
const deb = src.indexOf('export const MAP = [')
const fin = src.indexOf('\n]', deb)
const MAP = eval(src.slice(deb + 'export const MAP = '.length, fin + 2))
console.log('entrees du mapping :', MAP.length)

const rows = await sql`select id, nom from skills order by id`
const nomDe = new Map(rows.map(r => [r.id, r.nom]))

// --- regrouper ---
const groupes = new Map()
for (const [id, cible, lot] of MAP) {
  if (cible === '?') continue
  if (!groupes.has(cible)) groupes.set(cible, [])
  groupes.get(cible).push({ id, lot, nom: nomDe.get(id) })
}

// --- plan : pour chaque groupe contenant au moins une entree S ---
const plan = []
const alertes = []
for (const [cible, membres] of groupes) {
  const S = membres.filter(m => m.lot === 'S')
  if (!S.length) continue
  const G = membres.filter(m => m.lot === 'G')
  const A = membres.filter(m => m.lot === 'A')
  // survivante : celle qui porte deja le nom cible ; sinon une G ; sinon une S a renommer
  let surv = membres.find(m => m.nom === cible) ?? G[0] ?? null
  let renommer = false
  if (!surv) { surv = S[0]; renommer = true }
  if (G.length && !G.some(g => g.id === surv.id)) alertes.push(`groupe "${cible}" : entree G ${G[0].id} "${G[0].nom}" n est pas la survivante retenue (${surv.id} "${surv.nom}")`)
  const aFusionner = S.filter(m => m.id !== surv.id)
  plan.push({ cible, survId: surv.id, survNom: surv.nom, renommer, aFusionner, gardees: A.map(a => `${a.id}:"${a.nom}"`) })
}
console.log('groupes traites :', plan.length)
console.log('entrees a reaffecter puis supprimer :', plan.reduce((s,p)=>s+p.aFusionner.length,0))
console.log('entrees a renommer sur place :', plan.filter(p=>p.renommer).length)
if (alertes.length) { console.log('\n!! ALERTES :'); alertes.forEach(a=>console.log('  ',a)) }

// --- verif 1 : conflit de nom UNIQUE sur les renommages ---
console.log('\n=== CONFLITS UNIQUE sur skills.nom ===')
const nomsExistants = new Map(rows.map(r => [r.nom, r.id]))
let conflits = 0
for (const p of plan.filter(p => p.renommer)) {
  const dejaPris = nomsExistants.get(p.cible)
  if (dejaPris !== undefined && dejaPris !== p.survId) { console.log(`  CONFLIT "${p.cible}" deja porte par id ${dejaPris}`); conflits++ }
}
console.log(conflits ? `  ${conflits} conflits` : '  aucun')

// --- verif 2 : collisions de liaison (le point critique) ---
console.log('\n=== COLLISIONS DE LIAISON (personnage lie a 2 entrees du meme groupe) ===')
let nbColl = 0
for (const p of plan) {
  const ids = [p.survId, ...p.aFusionner.map(m => m.id)]
  if (ids.length < 2) continue
  const r = await sql.query(
    `select cs.personnage_id, c.nom, count(*)::int n, array_agg(cs.skill_id) ids, array_agg(cs.rangs_investis) rangs
     from character_skills cs join characters c on c.id=cs.personnage_id
     where cs.skill_id = any($1) group by cs.personnage_id, c.nom having count(*)>1`, [ids])
  if (r.length) { nbColl += r.length; console.log(`  ${p.cible} :`); r.forEach(x => console.log(`     perso ${x.personnage_id} ${x.nom} — ids ${JSON.stringify(x.ids)} rangs ${JSON.stringify(x.rangs)}`)) }
}
console.log(nbColl ? `  TOTAL ${nbColl} collisions` : '  aucune collision — le lot est sur')

// --- verif 3 : aucune entree touchee ne porte le lot A ---
const idsTouches = new Set(plan.flatMap(p => [p.survId, ...p.aFusionner.map(m=>m.id)]))
const idsA = new Set(MAP.filter(m => m[2] === 'A').map(m => m[0]))
const intersection = [...idsTouches].filter(i => idsA.has(i))
console.log('\n=== ENTREES DU LOT ARBITRAGE TOUCHEES PAR ERREUR ===')
console.log(intersection.length ? '  !! ' + JSON.stringify(intersection) : '  aucune')

fs.writeFileSync('X:/Claude-Tools/cormac/menage-references/plan-lot-sur.json', JSON.stringify(plan, null, 1))
console.log('\nplan ecrit dans plan-lot-sur.json')

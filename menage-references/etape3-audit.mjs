import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())

console.log('=== QUALITE DE skills.caracteristique (la colonne dont le PDF aurait besoin) ===')
const cars = await sql`select caracteristique, count(*)::int n from skills group by caracteristique order by n desc`
for (const c of cars) console.log(`  ${JSON.stringify(c.caracteristique)} : ${c.n}`)
const mauvais = await sql`select id, nom, caracteristique from skills
  where caracteristique is null or caracteristique not in ('FOR','DEX','CON','INT','SAG','CHA') order by nom`
console.log(`\n  entrees sans caracteristique exploitable : ${mauvais.length}`)
for (const m of mauvais) console.log(`     id=${m.id} "${m.nom}" -> ${JSON.stringify(m.caracteristique)}`)

console.log('\n=== LES LIGNES QUE L OPTION 3 RENDRAIT VISIBLES ===')
const inv = await sql`select s.nom, s.caracteristique, count(*)::int n
  from character_skills cs join skills s on s.id=cs.skill_id
  where (coalesce(cs.rangs_investis,0) > 0 or coalesce(cs.modif_divers,0) <> 0)
  group by s.nom, s.caracteristique order by n desc`
console.log(`  ${inv.length} noms distincts portes par au moins un personnage`)

console.log('\n=== LES 104 COMPETENCES : TEST DE NORMALISATION ===')
const skills = await sql`select id, nom from skills order by nom`
// normalisation proposee : casse, accents, espaces multiples, espaces de bout.
// PAS la ponctuation, PAS les parentheses.
const norm = s => s
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // accents
  .toLowerCase()
  .replace(/\s+/g, ' ')                              // espaces multiples
  .trim()

const paires = new Map()
for (const s of skills) {
  const k = norm(s.nom)
  if (!paires.has(k)) paires.set(k, [])
  paires.get(k).push(s)
}
const rapproches = [...paires.entries()].filter(([, v]) => v.length > 1)
console.log(`  paires rapprochees : ${rapproches.length}`)
for (const [k, v] of rapproches) console.log(`     "${k}" <- ${v.map(x => `${x.id}:"${x.nom}"`).join('  +  ')}`)

console.log('\n  --- controle : ces paires DOIVENT rester separees ---')
const doiventDifferer = [
  ['Connaissances (mystères)', 'Connaissances (nature)'],
  ['Artisanat (armes)', 'Artisanat (armures)'],
  ['Magie divine', 'Art de la magie'],
  ['Connaissances (histoire)', 'Connaissances (plans)'],
  ['Artisanat (pièges)', 'Artisanat (tissage)'],
  ['Profession', 'Profession (apothicaire)'],
  ['Détection', 'Perception auditive'],
]
let fautes = 0
for (const [a, b] of doiventDifferer) {
  const meme = norm(a) === norm(b)
  if (meme) fautes++
  console.log(`     ${meme ? 'FAUTE   ' : 'distinct'} "${a}" / "${b}"`)
}
console.log(fautes ? `  !! ${fautes} appariements a tort` : '  aucun appariement a tort')

console.log('\n=== LA MEME REGLE SUR LES AUTRES TABLES DE findOrCreateByNom ===')
for (const t of ['races', 'classes', 'clans', 'gods', 'languages', 'feats', 'weapons', 'armor', 'magic_items', 'potions', 'spells']) {
  try {
    const rows = await sql.query(`select id, nom from ${t}`)
    const m = new Map()
    for (const r of rows) { const k = norm(r.nom); if (!m.has(k)) m.set(k, []); m.get(k).push(r) }
    const dbl = [...m.entries()].filter(([, v]) => v.length > 1)
    console.log(`  ${t.padEnd(12)} ${String(rows.length).padStart(4)} entrees -> ${dbl.length} paires rapprochees`)
    for (const [, v] of dbl.slice(0, 8)) console.log(`       ${v.map(x => `${x.id}:"${x.nom}"`).join('  +  ')}`)
    if (dbl.length > 8) console.log(`       ... et ${dbl.length - 8} autres`)
  } catch (e) {
    console.log(`  ${t.padEnd(12)} (table absente ou sans colonne nom)`)
  }
}

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { COMPETENCES_DND35, caracteristiqueDe } from '../src/lib/dnd35/skills'
import { normaliserNom } from '../src/lib/noms'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

type L = { p: number; pnom: string; snom: string; scar: string; r: number; d: number }
const liens = await sql`select cs.personnage_id p, c.nom pnom, s.nom snom, s.caracteristique scar,
  cs.rangs_investis r, cs.modif_divers d
  from character_skills cs join skills s on s.id=cs.skill_id join characters c on c.id=cs.personnage_id` as L[]
const liste = COMPETENCES_DND35.map(c => c.nom)
const visible = (l: L) => (l.r ?? 0) > 0 || (l.d ?? 0) !== 0

console.log('=== IMPRESSION : effet de la fiche tolerante ===')
const total = liens.length
const avant = liens.filter(l => visible(l) && liste.includes(l.snom)).length     // ancienne regle
const apres = liens.filter(l => visible(l)).length                              // nouvelle regle
console.log(`  liens character_skills            : ${total}`)
console.log(`  lignes portant des rangs ou un modificateur : ${apres}`)
console.log(`  imprimees AVANT (liste figee)     : ${avant} = ${(avant / total * 100).toFixed(0)} %`)
console.log(`  imprimees APRES (fiche tolerante) : ${apres} = ${(apres / total * 100).toFixed(0)} %`)
console.log(`  lignes a 0 rang et 0 modificateur, jamais imprimees : ${total - apres}`)

console.log('\n=== GABARIT ===')
const parFiche = new Map<number, { nom: string; n: number }>()
for (const l of liens) {
  if (!parFiche.has(l.p)) parFiche.set(l.p, { nom: l.pnom, n: 0 })
  if (visible(l)) parFiche.get(l.p)!.n++
}
const maxi = Math.max(...[...parFiche.values()].map(f => f.n))
console.log(`  lignes max sur une fiche : ${maxi}`)
console.log('  Le gabarit (20) ne fait qu ajouter des lignes VIDES : il ne tronque rien.')
console.log(`  Une fiche de ${maxi} competences imprime ${maxi} lignes, quel que soit le gabarit.`)
for (const [id, f] of [...parFiche.entries()].filter(([, f]) => f.n >= 20).sort((a, b) => b[1].n - a[1].n))
  console.log(`     perso ${id} ${f.nom.padEnd(28)} ${f.n} lignes`)

console.log('\n=== LES 5 FICHES QUI AVAIENT RECULE ===')
const ref: Record<number, number> = { 3: 7, 5: 6, 6: 10, 83: 5, 85: 4 }
let recul = 0
for (const [id, av] of Object.entries(ref)) {
  const f = parFiche.get(Number(id))!
  if (f.n < av) recul++
  console.log(`  ${f.n >= av ? 'OK   ' : 'RECUL'} perso ${id.padStart(2)} ${f.nom.padEnd(26)} ${av} -> ${f.n}`)
}
console.log(recul ? `  ⚠️ ${recul} encore en recul` : '  aucune fiche en recul')

console.log('\n=== MAGIE DIVINE ===')
const md = await sql`select c.id, c.nom, cs.rangs_investis r from character_skills cs
  join skills s on s.id=cs.skill_id join characters c on c.id=cs.personnage_id
  where s.nom='Magie divine' order by c.id` as { id: number; nom: string; r: number }[]
for (const m of md) console.log(`  perso ${m.id} ${m.nom.padEnd(26)} ${m.r} rangs — s imprime desormais`)
const carMD = await sql`select caracteristique from skills where nom='Magie divine'` as { caracteristique: string }[]
console.log(`  caracteristique retenue : ${caracteristiqueDe('Magie divine', carMD[0]?.caracteristique)} (compétence maison : la base décide)`)
console.log(`  « Psychologie » : ${caracteristiqueDe('Psychologie', 'CHA')} (le manuel corrige la base, ecran et PDF alignes)`)

console.log('\n=== NORMALISATION : controle final sur les tables reelles ===')
for (const t of ['skills', 'feats', 'spells', 'weapons', 'magic_items', 'languages', 'gods', 'races', 'classes', 'armor', 'potions', 'clans']) {
  const rows = await sql.query(`select id, nom from ${t}`) as { id: number; nom: string }[]
  const m = new Map<string, { id: number; nom: string }[]>()
  for (const r of rows) { const k = normaliserNom(r.nom); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) }
  const dbl = [...m.values()].filter(v => v.length > 1)
  console.log(`  ${t.padEnd(12)} ${String(rows.length).padStart(4)} entrees -> ${dbl.length} paire(s) rapprochee(s)`)
  for (const v of dbl) console.log(`       ${v.map(x => `${x.id}:"${x.nom}"`).join('   =   ')}`)
}

console.log('\n=== la regle laisse-t-elle distinctes les paires qui doivent l etre ? ===')
const paires: [string, string][] = [
  ['Connaissances (mystères)', 'Connaissances (nature)'],
  ['Artisanat (armes)', 'Artisanat (armures)'],
  ['Magie divine', 'Art de la magie'],
  ['Profession', 'Profession (apothicaire)'],
  ['Connaissances (histoire)', 'Connaissances (plans)'],
]
let faute = 0
for (const [a, b] of paires) {
  const meme = normaliserNom(a) === normaliserNom(b)
  if (meme) faute++
  console.log(`  ${meme ? 'FAUTE   ' : 'distinct'} "${a}" / "${b}"`)
}
console.log(faute ? `  ⚠️ ${faute} appariement(s) a tort` : '  aucun appariement a tort')

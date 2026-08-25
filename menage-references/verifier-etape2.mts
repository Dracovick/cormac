import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills'
import { getRaceInfo } from '../src/lib/dnd35/races'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const liste = COMPETENCES_DND35.map(c => c.nom)

type L = { p: number; pnom: string; snom: string; r: number; d: number }
const liens = await sql`select cs.personnage_id p, c.nom pnom, s.nom snom, cs.rangs_investis r, cs.modif_divers d
  from character_skills cs join skills s on s.id=cs.skill_id join characters c on c.id=cs.personnage_id` as L[]
const visible = (l: L) => (l.r ?? 0) > 0 || (l.d ?? 0) !== 0
const imprime = (l: L) => visible(l) && liste.includes(l.snom)

console.log('=== COMPETENCES IMPRIMEES (mesure reelle sur la base) ===')
const total = liens.length
const ok = liens.filter(imprime).length
console.log(`  ${ok} lignes sur ${total} = ${(ok / total * 100).toFixed(0)} %`)
console.log(`  entrees dans la table skills : ${(await sql`select count(*)::int n from skills`)[0].n}`)

const parFiche = new Map<number, { nom: string; n: number }>()
for (const l of liens) {
  if (!parFiche.has(l.p)) parFiche.set(l.p, { nom: l.pnom, n: 0 })
  if (imprime(l)) parFiche.get(l.p)!.n++
}
const maxi = Math.max(...[...parFiche.values()].map(f => f.n))
console.log(`\n=== GABARIT ===`)
console.log(`  lignes max sur une fiche : ${maxi}   (gabarit porte a 24)`)
console.log(`  ${maxi <= 24 ? 'OK — aucune fiche ne deborde' : 'DEBORDEMENT'}`)
for (const [id, f] of [...parFiche.entries()].filter(([, f]) => f.n >= 18).sort((a, b) => b[1].n - a[1].n))
  console.log(`     perso ${id} ${f.nom.padEnd(28)} ${f.n} lignes`)
console.log(`  fiches n imprimant aucune competence : ${[...parFiche.values()].filter(f => f.n === 0).length}`)

console.log('\n=== LES 5 FICHES QUI AVAIENT RECULE (reference : avant l etape 1) ===')
const ref: Record<number, number> = { 3: 7, 5: 6, 6: 10, 83: 5, 85: 4 }
let echecs = 0
for (const [id, avant] of Object.entries(ref)) {
  const f = parFiche.get(Number(id))!
  const bon = f.n >= avant
  if (!bon) echecs++
  console.log(`  ${bon ? 'OK   ' : 'RECUL'} perso ${id.padStart(2)} ${f.nom.padEnd(28)} ${avant} -> ${f.n}`)
}

console.log('\n=== LES 3 PETITES GENS ===')
const pg = await sql`select c.id, c.nom, r.nom rnom, r.taille, r.bonus_for, r.bonus_dex, r.deplacement_base
  from characters c join races r on r.id=c.race_id where r.nom='Petite-gens' order by c.id` as
  { id: number; nom: string; rnom: string; taille: string; bonus_for: number; bonus_dex: number; deplacement_base: number }[]
const traits = await sql`select nom from racial_features where race_id=11 order by id` as { nom: string }[]
for (const p of pg) {
  const i = getRaceInfo(p.rnom)
  const codeOk = i && i.bonusFor === -2 && i.bonusDex === 2
  const baseOk = p.bonus_for === -2 && p.bonus_dex === 2 && p.taille === 'Petite'
  console.log(`  ${codeOk && baseOk ? 'OK   ' : 'ECHEC'} perso ${p.id} ${p.nom.padEnd(24)} base: FOR${p.bonus_for} DEX+${p.bonus_dex} taille ${p.taille} depl ${p.deplacement_base}m | code: ${i ? `resolu via "${i.nom}" FOR${i.bonusFor} DEX+${i.bonusDex}` : 'NON RESOLU'}`)
}
console.log(`  traits raciaux sur Petite-gens (${traits.length}) : ${traits.map(t => t.nom).join(', ')}`)

console.log('\n=== INTEGRITE ===')
const integ = {
  characters: (await sql`select count(*)::int n from characters`)[0].n,
  character_classes: (await sql`select count(*)::int n from character_classes`)[0].n,
  character_skills: (await sql`select count(*)::int n from character_skills`)[0].n,
  orphelins: (await sql`select count(*)::int n from character_skills cs where not exists (select 1 from skills s where s.id=cs.skill_id)`)[0].n,
  doublons: (await sql`select count(*)::int n from (select personnage_id, skill_id from character_skills group by personnage_id, skill_id having count(*)>1) x`)[0].n,
}
console.log(' ', JSON.stringify(integ))

console.log('\n=== CE QUI NE S IMPRIME TOUJOURS PAS (arbitrages en attente) ===')
const inv = new Map<string, number>()
for (const l of liens) if (visible(l) && !liste.includes(l.snom)) inv.set(l.snom, (inv.get(l.snom) ?? 0) + 1)
for (const [n, c] of [...inv].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`   ${String(c).padStart(3)}  ${n}`)
console.log(`   ... ${inv.size} noms distincts, ${[...inv.values()].reduce((a, b) => a + b, 0)} lignes`)
if (echecs) console.log(`\n⚠️ ${echecs} fiche(s) encore en recul — voir le rapport.`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { RACES_DND35, getRaceInfo } from '../src/lib/dnd35/races'
import { getClasseInfo } from '../src/lib/dnd35/classes'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// ─── 1. Races : chaque personnage retrouve-t-il ses ajustements ? ───────────
console.log('=== RACES : appariement code <-> base ===')
const parRace = await sql`
  select r.nom, count(c.id)::int n from races r
  left join characters c on c.race_id = r.id group by r.nom order by r.nom` as { nom: string; n: number }[]
let sansAppariement = 0
for (const r of parRace) {
  const info = getRaceInfo(r.nom)
  const b = info ? `FOR${info.bonusFor >= 0 ? '+' : ''}${info.bonusFor} DEX${info.bonusDex >= 0 ? '+' : ''}${info.bonusDex} CON${info.bonusCon >= 0 ? '+' : ''}${info.bonusCon} INT${info.bonusInt >= 0 ? '+' : ''}${info.bonusInt} SAG${info.bonusSag >= 0 ? '+' : ''}${info.bonusSag} CHA${info.bonusCha >= 0 ? '+' : ''}${info.bonusCha}` : ''
  if (!info && r.n > 0) sansAppariement += r.n
  console.log(`  ${info ? 'OK    ' : 'INCONNU'} ${r.nom.padEnd(14)} ${String(r.n).padStart(2)} perso  ${b}`)
}
console.log(`  -> personnages sans ajustement racial : ${sansAppariement}`)

console.log('\n=== LES 3 DEMI-ORQUES, NOMMEMENT ===')
const orques = await sql`select c.id, c.nom, r.nom rnom from characters c join races r on r.id=c.race_id where r.nom='Demi-Orque' order by c.id` as { id: number; nom: string; rnom: string }[]
for (const o of orques) {
  const i = getRaceInfo(o.rnom)!
  const ok = i.bonusFor === 2 && i.bonusInt === -2 && i.bonusCha === -2
  console.log(`  ${ok ? 'OK' : 'ECHEC'}  perso ${o.id} ${o.nom.padEnd(28)} ${o.rnom} : FOR+${i.bonusFor} INT${i.bonusInt} CHA${i.bonusCha}`)
}

console.log('\n=== TAILLE DU NAIN ===')
for (const r of await sql`select nom, taille, deplacement_base from races where nom='Nain'` as { nom: string; taille: string; deplacement_base: number }[])
  console.log(`  ${r.nom} : taille ${r.taille}, deplacement ${r.deplacement_base} m`)

// ─── 2. Classes ─────────────────────────────────────────────────────────────
console.log('\n=== CLASSES : de de vie affiche (table classes) + appariement code ===')
const cls = await sql`
  select cl.id, cl.nom, cl.de_vie, count(cc.id)::int n from classes cl
  left join character_classes cc on cc.classe_id = cl.id group by cl.id, cl.nom, cl.de_vie order by cl.id` as { id: number; nom: string; de_vie: string; n: number }[]
for (const c of cls) {
  const info = getClasseInfo(c.nom)
  const coherent = info ? (`d${info.de}` === c.de_vie ? 'coherent' : `INCOHERENT (code d${info.de})`) : '—'
  console.log(`  ${info ? 'OK    ' : 'INCONNU'} ${c.nom.padEnd(16)} ${String(c.n).padStart(2)} perso  de_vie=${c.de_vie.padEnd(4)} ${coherent}`)
}

console.log('\n=== LES 9 ENSORCELEURS, NOMMEMENT ===')
const ens = await sql`
  select c.id, c.nom, cc.niveau, cl.nom cnom, cl.de_vie from characters c
  join character_classes cc on cc.personnage_id=c.id join classes cl on cl.id=cc.classe_id
  where cl.nom='Ensorceleur' order by c.id` as { id: number; nom: string; niveau: number; cnom: string; de_vie: string }[]
for (const e of ens) {
  const i = getClasseInfo(e.cnom)
  console.log(`  ${i ? 'OK' : 'ECHEC'}  perso ${e.id} ${e.nom.padEnd(26)} niv ${String(e.niveau).padStart(2)}  de_vie affiche ${e.de_vie}  BBA ${i?.bab ?? '—'}  sauv. ${i ? i.bonsSauvegardes.join('+') : '—'}`)
}

// ─── 3. Pourcentage de competences imprimees ────────────────────────────────
console.log('\n=== COMPETENCES IMPRIMEES ===')
const APOS = String.fromCharCode(39)
const BSL = String.fromCharCode(92)
const anciens = fs.readFileSync('X:/Claude-Tools/cormac/menage-references/skills-avant.txt', 'utf8')
  .split('\n')
  .map(ligne => {
    const i = ligne.indexOf('{ nom: ' + APOS)
    if (i < 0) return null
    const j = ligne.indexOf(APOS + ',', i + 8)
    if (j < 0) return null
    return ligne.slice(i + 8, j).split(BSL + APOS).join(APOS)
  })
  .filter((x): x is string => x !== null)
const nouveaux = COMPETENCES_DND35.map(c => c.nom)
console.log(`  liste avant : ${anciens.length} noms | liste apres : ${nouveaux.length} noms`)

const liens = await sql`
  select s.nom, cs.rangs_investis r, cs.modif_divers d, cs.personnage_id p
  from character_skills cs join skills s on s.id = cs.skill_id` as { nom: string; r: number; d: number; p: number }[]
const total = liens.length
const compte = (liste: string[]) => liens.filter(l => liste.includes(l.nom)).length
const compteVisible = (liste: string[]) => liens.filter(l => liste.includes(l.nom) && ((l.r ?? 0) > 0 || (l.d ?? 0) !== 0)).length
const av = compte(anciens), ap = compte(nouveaux)
console.log(`  total de liens character_skills : ${total}`)
console.log(`  AVANT : ${av} lignes appariees = ${(av / total * 100).toFixed(0)} %   (dont visibles sur la fiche : ${compteVisible(anciens)})`)
console.log(`  APRES : ${ap} lignes appariees = ${(ap / total * 100).toFixed(0)} %   (dont visibles sur la fiche : ${compteVisible(nouveaux)})`)

const persoAvant = new Set(liens.filter(l => anciens.includes(l.nom)).map(l => l.p))
const persoApres = new Set(liens.filter(l => nouveaux.includes(l.nom)).map(l => l.p))
const tousPerso = new Set(liens.map(l => l.p))
console.log(`  personnages imprimant au moins une competence : ${persoAvant.size} -> ${persoApres.size} (sur ${tousPerso.size} qui en ont)`)

// ce que la correction fait gagner / perdre, nom par nom
const gagnes = new Map<string, number>(), perdus = new Map<string, number>()
for (const l of liens) {
  const a = anciens.includes(l.nom), b = nouveaux.includes(l.nom)
  if (!a && b) gagnes.set(l.nom, (gagnes.get(l.nom) ?? 0) + 1)
  if (a && !b) perdus.set(l.nom, (perdus.get(l.nom) ?? 0) + 1)
}
console.log('\n  GAGNES :'); for (const [n, c] of [...gagnes].sort((x, y) => y[1] - x[1])) console.log(`    +${String(c).padStart(2)}  ${n}`)
console.log('  PERDUS :'); for (const [n, c] of [...perdus].sort((x, y) => y[1] - x[1])) console.log(`    -${String(c).padStart(2)}  ${n}`)
if (perdus.size === 0) console.log('    (aucun)')
console.log(`  RACES_DND35 contient ${RACES_DND35.length} races`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { FUSIONS, RENOMMAGES, SCORIES } from './ch2-plan.mts'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const stop = (m: string) => { console.error('\n⛔ ARRET : ' + m); process.exit(1) }

// ─── GARDE-FOUS ─────────────────────────────────────────────────────────────
const skillsAvant = (await sql`select count(*)::int n from skills`)[0].n
const liensAvant = (await sql`select count(*)::int n from character_skills`)[0].n
console.log(`etat avant : ${skillsAvant} skills, ${liensAvant} liens`)
if (skillsAvant !== 104 || liensAvant !== 510) stop('la base n est pas dans l etat attendu')

const tous = await sql`select id, nom from skills` as { id: number; nom: string }[]
const nomDe = new Map(tous.map(r => [r.id, r.nom]))
for (const f of FUSIONS) {
  if (nomDe.get(f.cible) !== f.cibleNom) stop(`cible ${f.cible} ne porte pas « ${f.cibleNom} »`)
  for (const s of f.sources) if (!nomDe.has(s)) stop(`source ${s} introuvable`)
}
for (const r of RENOMMAGES) if (nomDe.get(r.id) !== r.de) stop(`${r.id} ne porte pas « ${r.de} »`)
for (const s of SCORIES) {
  const n = (await sql.query(`select count(*)::int n from character_skills where skill_id = $1`, [s]))[0].n
  if (n > 0) stop(`la scorie ${s} porte ${n} lien(s)`)
}
console.log('✓ garde-fous')

// ─── RESOLUTION DES COLLISIONS : le rang le plus eleve survit ───────────────
const reqs: unknown[] = []
const journal: string[] = []
let liensSupprimes = 0

for (const f of FUSIONS) {
  const ids = [f.cible, ...f.sources]
  const liens = await sql.query(
    `select cs.id, cs.personnage_id p, c.nom pnom, cs.skill_id sid, s.nom snom,
            coalesce(cs.rangs_investis,0) rg, coalesce(cs.modif_divers,0) dv
     from character_skills cs join characters c on c.id=cs.personnage_id join skills s on s.id=cs.skill_id
     where cs.skill_id = any($1)`, [ids]) as
    { id: number; p: number; pnom: string; sid: number; snom: string; rg: number; dv: number }[]

  const par = new Map<number, typeof liens>()
  for (const x of liens) { if (!par.has(x.p)) par.set(x.p, [] as never); par.get(x.p)!.push(x) }

  for (const [pid, lignes] of par) {
    if (lignes.length === 1) continue
    // ⛔ REGLE 1 : jamais de perte de rangs. Le rang le plus eleve survit (puis le divers le plus eleven).
    const tri = [...lignes].sort((a, b) => (b.rg - a.rg) || (b.dv - a.dv))
    const gagnant = tri[0]
    for (const perdant of tri.slice(1)) {
      reqs.push(sql.query(`delete from character_skills where id = $1`, [perdant.id]))
      liensSupprimes++
      journal.push(`COLLISION  ${f.cibleNom}  |  perso ${pid} ${lignes[0].pnom}  |  garde « ${gagnant.snom} » ${gagnant.rg} rangs${gagnant.dv ? '+' + gagnant.dv : ''}  |  retire « ${perdant.snom} » ${perdant.rg} rangs${perdant.dv ? '+' + perdant.dv : ''}`)
    }
  }
  // reaffecter tout ce qui reste vers la cible, puis retirer les sources
  reqs.push(sql.query(`update character_skills set skill_id = $1 where skill_id = any($2)`, [f.cible, f.sources]))
  reqs.push(sql.query(`delete from skills where id = any($1)`, [f.sources]))
}

// ⛔ Les scories partent AVANT les renommages : la scorie 50 porte deja le nom
// « Connaissances (dragons) » que l id 19 doit prendre, et skills.nom est UNIQUE.
if (SCORIES.length) reqs.push(sql.query(`delete from skills where id = any($1)`, [SCORIES]))
for (const r of RENOMMAGES) reqs.push(sql.query(`update skills set nom = $1 where id = $2`, [r.vers, r.id]))

console.log(`\n=== COLLISIONS RESOLUES (${journal.length}) ===`)
journal.forEach(j => console.log('  ' + j))
if (!journal.length) console.log('  aucune')

console.log(`\n=== ECRITURE : ${reqs.length} requetes ===`)
await sql.transaction(reqs as never)
console.log('  transaction : OK')

// ─── CONTROLE ───────────────────────────────────────────────────────────────
const absorbees = FUSIONS.reduce((s, f) => s + f.sources.length, 0)
const t = {
  skills: (await sql`select count(*)::int n from skills`)[0].n,
  liens: (await sql`select count(*)::int n from character_skills`)[0].n,
  orphelins: (await sql`select count(*)::int n from character_skills cs where not exists (select 1 from skills s where s.id=cs.skill_id)`)[0].n,
  doublons: (await sql`select count(*)::int n from (select personnage_id, skill_id from character_skills group by personnage_id, skill_id having count(*)>1) x`)[0].n,
  grimdar: (await sql`select count(*)::int n from character_skills where personnage_id=86`)[0].n,
  persos: (await sql`select count(*)::int n from characters`)[0].n,
}
console.log('\n=== CONTROLE ===')
console.log(JSON.stringify(t, null, 1))
if (t.skills !== skillsAvant - absorbees - SCORIES.length) stop(`skills : attendu ${skillsAvant - absorbees - SCORIES.length}, trouve ${t.skills}`)
if (t.liens !== liensAvant - liensSupprimes) stop(`liens : attendu ${liensAvant - liensSupprimes}, trouve ${t.liens}`)
if (t.orphelins !== 0) stop('lien orphelin')
if (t.doublons !== 0) stop('doublon de liaison')
if (t.persos !== 71) stop('personnages perdus')
if (t.grimdar !== 0) stop('Grimdar ne doit avoir aucune competence')
console.log('✓ integrite confirmee')

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const stop = m => { console.error('\n⛔ ARRET :', m); process.exit(1) }
const plan = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/plan-lot-sur.json', 'utf8'))

const survIds = plan.map(p => p.survId)
const fusIds = plan.flatMap(p => p.aFusionner.map(m => m.id))
const tousIds = [...survIds, ...fusIds]
console.log(`plan : ${plan.length} groupes, ${survIds.length} survivantes, ${fusIds.length} entrees a retirer`)

// ─── GARDE-FOUS (lecture seule) ─────────────────────────────────────────────
console.log('\n=== GARDE-FOUS ===')
if (new Set(tousIds).size !== tousIds.length) stop('un id apparait dans deux groupes')
const skillsAvant = (await sql`select count(*)::int n from skills`)[0].n
const liensAvant = (await sql`select count(*)::int n from character_skills`)[0].n
console.log(`skills=${skillsAvant} character_skills=${liensAvant}`)
if (skillsAvant !== 191 || liensAvant !== 510) stop('la base n est pas dans l etat attendu')

const existants = new Set((await sql.query(`select id from skills where id = any($1)`, [tousIds])).map(r => r.id))
const manquants = tousIds.filter(i => !existants.has(i))
if (manquants.length) stop('ids absents de skills : ' + JSON.stringify(manquants))
console.log('✓ les 113 entrees du lot existent toujours')

const csl = (await sql`select count(*)::int n from class_skill_list`)[0].n
if (csl !== 0) stop(`class_skill_list contient ${csl} lignes : verifier les skill_id avant de retirer quoi que ce soit`)
const autres = await sql`select table_name, column_name from information_schema.columns
  where table_schema='public' and column_name='skill_id' order by table_name`
console.log('  colonnes skill_id existantes :', autres.map(a => a.table_name).join(', '))
for (const a of autres) {
  if (a.table_name === 'character_skills' || a.table_name === 'class_skill_list') continue
  const n = (await sql.query(`select count(*)::int n from ${a.table_name} where skill_id = any($1)`, [fusIds]))[0].n
  if (n > 0) stop(`${a.table_name} reference ${n} des entrees du lot`)
  console.log(`  ${a.table_name} : aucune reference`)
}

let coll = 0
for (const p of plan) {
  const ids = [p.survId, ...p.aFusionner.map(m => m.id)]
  if (ids.length < 2) continue
  const r = await sql.query(`select cs.personnage_id from character_skills cs where cs.skill_id = any($1)
    group by cs.personnage_id having count(*)>1`, [ids])
  if (r.length) { console.log(`  COLLISION ${p.cible} : personnages ${r.map(x => x.personnage_id).join(',')}`); coll += r.length }
}
if (coll) stop(`${coll} collisions de liaison — la reaffectation creerait des doublons`)
console.log('✓ aucune collision de liaison')

for (const p of plan.filter(p => p.renommer)) {
  const r = await sql.query(`select id from skills where nom = $1 and id <> $2`, [p.cible, p.survId])
  if (r.length) stop(`conflit UNIQUE : "${p.cible}" deja porte par l id ${r[0].id}`)
}
console.log('✓ aucun conflit de nom')

const pg = (await sql`select * from races where id=11 and nom='Petite-gens'`)[0]
const hal = (await sql`select * from races where id=5 and nom='Halfelin'`)[0]
if (!pg || !hal) stop('Petite-gens (11) ou Halfelin (5) introuvable')
const rfPg = (await sql`select count(*)::int n from racial_features where race_id=11`)[0].n
const rfHal = (await sql`select count(*)::int n from racial_features where race_id=5`)[0].n
console.log(`  Petite-gens : ${rfPg} traits | Halfelin : ${rfHal} traits`)
if (rfPg !== 0) stop('Petite-gens porte deja des traits raciaux : ne pas dupliquer')
if (rfHal !== 6) stop(`attendu 6 traits chez le Halfelin, trouve ${rfHal}`)
console.log('✓ garde-fous Petite-gens')

// ─── ECRITURE (transaction unique et atomique) ──────────────────────────────
console.log('\n=== ECRITURE ===')
const reqs = []
for (const p of plan) {
  if (p.renommer) reqs.push(sql.query(`update skills set nom = $1 where id = $2`, [p.cible, p.survId]))
  const ids = p.aFusionner.map(m => m.id)
  if (ids.length) {
    // 1) reaffecter les liens vers la survivante
    reqs.push(sql.query(`update character_skills set skill_id = $1 where skill_id = any($2)`, [p.survId, ids]))
    // 2) PUIS seulement retirer les entrees devenues orphelines
    reqs.push(sql.query(`delete from skills where id = any($1)`, [ids]))
  }
}
// Petite-gens : on garde le nom d'André, on y recopie les donnees du halfelin
reqs.push(sql.query(`update races set bonus_for=$1,bonus_dex=$2,bonus_con=$3,bonus_int=$4,bonus_sag=$5,bonus_cha=$6,taille=$7,deplacement_base=$8,vision_nocturne=$9 where id=11`,
  [hal.bonus_for, hal.bonus_dex, hal.bonus_con, hal.bonus_int, hal.bonus_sag, hal.bonus_cha, hal.taille, hal.deplacement_base, hal.vision_nocturne]))
reqs.push(sql.query(`insert into racial_features (race_id, nom, description) select 11, nom, description from racial_features where race_id=5`))
console.log(`  ${reqs.length} requetes dans la transaction`)
await sql.transaction(reqs)
console.log('  transaction : OK')

// ─── CONTROLE ───────────────────────────────────────────────────────────────
console.log('\n=== CONTROLE ===')
const t = {
  skills: (await sql`select count(*)::int n from skills`)[0].n,
  character_skills: (await sql`select count(*)::int n from character_skills`)[0].n,
  characters: (await sql`select count(*)::int n from characters`)[0].n,
  character_classes: (await sql`select count(*)::int n from character_classes`)[0].n,
  races: (await sql`select count(*)::int n from races`)[0].n,
  racial_features: (await sql`select count(*)::int n from racial_features`)[0].n,
  liensOrphelins: (await sql`select count(*)::int n from character_skills cs where not exists (select 1 from skills s where s.id=cs.skill_id)`)[0].n,
  doublonsLiaison: (await sql`select count(*)::int n from (select personnage_id, skill_id from character_skills group by personnage_id, skill_id having count(*)>1) x`)[0].n,
  rfPetiteGens: (await sql`select count(*)::int n from racial_features where race_id=11`)[0].n,
}
console.log(JSON.stringify(t, null, 1))
if (t.character_skills !== 510) stop('des liens de competence ont ete perdus')
if (t.characters !== 70 || t.character_classes !== 80) stop('personnages ou classes perdus')
if (t.skills !== 191 - fusIds.length) stop(`skills : attendu ${191 - fusIds.length}, trouve ${t.skills}`)
if (t.liensOrphelins !== 0) stop('lien orphelin detecte')
if (t.doublonsLiaison !== 0) stop('doublon de liaison cree')
if (t.rfPetiteGens !== 6) stop('les traits raciaux des petites gens ne sont pas les 6 attendus')
if (t.racial_features !== 46) stop(`racial_features : attendu 46, trouve ${t.racial_features}`)
console.log('✓ aucun lien perdu, aucun orphelin, aucun doublon')

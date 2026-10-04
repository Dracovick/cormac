import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// Personnage de test jetable pour éprouver la montée de niveau en production.
// Usage : npx tsx xp-test-monter-niveau.mts creer | verifier | detruire
const mode = process.argv[2]
const NOM = 'ZZTest Montée Niveau (Draco)'

if (mode === 'creer') {
  const [guerrier] = await sql`select id from classes where nom = 'Guerrier'` as {id:number}[]
  const [p] = await sql`insert into characters (nom, xp) values (${NOM}, 1000) returning id` as {id:number}[]
  await sql`insert into character_classes (personnage_id, classe_id, niveau) values (${p.id}, ${guerrier.id}, 1)`
  await sql`insert into character_combat_stats (personnage_id, pv_max, pv_actuels) values (${p.id}, 12, 12)`
  await sql`insert into character_ability_scores (personnage_id, con_base) values (${p.id}, 14)`
  console.log(JSON.stringify({ id: p.id, url: `https://dracovick.com/personnage/${p.id}` }))
} else if (mode === 'verifier') {
  const [p] = await sql`select id, xp from characters where nom = ${NOM}` as {id:number;xp:number}[]
  if (!p) { console.log('introuvable'); process.exit(1) }
  const cls = await sql`select cc.niveau, cl.nom from character_classes cc join classes cl on cl.id=cc.classe_id where cc.personnage_id = ${p.id}`
  const [stats] = await sql`select pv_max, pv_actuels from character_combat_stats where personnage_id = ${p.id}` as {pv_max:number;pv_actuels:number}[]
  const journal = await sql`select type, description from character_journal where personnage_id = ${p.id} order by id`
  console.log(JSON.stringify({ xp: p.xp, classes: cls, stats, journal }, null, 1))
} else if (mode === 'detruire') {
  const [p] = await sql`select id from characters where nom = ${NOM}` as {id:number}[]
  if (!p) { console.log('déjà absent'); process.exit(0) }
  await sql`delete from character_journal where personnage_id = ${p.id}`
  await sql`delete from character_ability_scores where personnage_id = ${p.id}`
  await sql`delete from character_combat_stats where personnage_id = ${p.id}`
  await sql`delete from character_classes where personnage_id = ${p.id}`
  await sql`delete from characters where id = ${p.id}`
  console.log(`détruit (id ${p.id})`)
} else {
  console.log('mode requis : creer | verifier | detruire')
}

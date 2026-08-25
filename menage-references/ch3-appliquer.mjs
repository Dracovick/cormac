import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const stop = m => { console.error('\n⛔ ARRET : ' + m); process.exit(1) }

// ─── TYPE A UNIQUEMENT ──────────────────────────────────────────────────────
// 1. Entrees feats sans le moindre sens ET sans aucun lien.
const SCORIES = [
  { id: 26, nom: 'blablabla' },
  { id: 379, nom: '---------------------------------------' },
  { id: 238, nom: 'BONUS THRALL : Iron will  (+2 sur jet de sauvegarde Volonté)' }, // doublon de 246 a la casse et a l espace pres
]

console.log('=== GARDE-FOUS ===')
const featsAvant = (await sql`select count(*)::int n from feats`)[0].n
const cfAvant = (await sql`select count(*)::int n from character_feats`)[0].n
const clAvant = (await sql`select count(*)::int n from character_languages`)[0].n
console.log(`feats ${featsAvant} | character_feats ${cfAvant} | character_languages ${clAvant}`)
if (featsAvant !== 480 || cfAvant !== 514 || clAvant !== 160) stop('etat inattendu')

for (const s of SCORIES) {
  const r = await sql.query(`select nom from feats where id = $1`, [s.id])
  if (!r.length) stop(`feat ${s.id} introuvable`)
  if (r[0].nom !== s.nom) stop(`feat ${s.id} porte « ${r[0].nom} », attendu « ${s.nom} »`)
  const n = (await sql.query(`select count(*)::int n from character_feats where feat_id = $1`, [s.id]))[0].n
  if (n > 0) stop(`feat ${s.id} porte ${n} lien(s) — ⛔ ne pas supprimer`)
}
console.log('✓ les 3 entrees existent, portent le nom attendu et n ont AUCUN lien')

// 246 doit survivre : c est la graphie correcte du doublon
const survivant = await sql.query(`select nom from feats where id = 246`)
if (!survivant.length) stop('la graphie correcte (246) doit rester')
console.log(`✓ conserve : 246 « ${survivant[0].nom} »`)

// ─── DOUBLONS DE LIAISON (notes verifiees identiques au prealable) ──────────
const dblFeats = await sql`
  select min(id)::int garde, array_agg(id order by id) ids, personnage_id p, feat_id f
  from character_feats group by personnage_id, feat_id having count(*) > 1`
const aRetirerF = dblFeats.flatMap(d => d.ids.slice(1))
const dblLang = await sql`
  select array_agg(id order by id) ids from character_languages group by personnage_id, langue_id having count(*) > 1`
const aRetirerL = dblLang.flatMap(d => d.ids.slice(1))
console.log(`\n=== DOUBLONS DE LIAISON ===`)
console.log(`  character_feats     : ${dblFeats.length} groupes, ${aRetirerF.length} lignes en trop`)
console.log(`  character_languages : ${dblLang.length} groupes, ${aRetirerL.length} lignes en trop`)
console.log('  ⛔ character_weapons NON touchee : deux exemplaires d une meme arme peuvent etre voulus')

// notes identiques ? (deuxieme controle, juste avant d ecrire)
for (const d of dblFeats) {
  const notes = await sql.query(`select coalesce(notes,'') n from character_feats where id = any($1)`, [d.ids])
  const uniq = new Set(notes.map(x => x.n))
  if (uniq.size > 1) stop(`le doublon perso ${d.p} / don ${d.f} a des notes differentes — ⛔ ne pas supprimer`)
}
console.log('  ✓ toutes les paires ont des notes identiques : suppression sans perte')

// ─── ECRITURE ───────────────────────────────────────────────────────────────
const reqs = []
if (aRetirerF.length) reqs.push(sql.query(`delete from character_feats where id = any($1)`, [aRetirerF]))
if (aRetirerL.length) reqs.push(sql.query(`delete from character_languages where id = any($1)`, [aRetirerL]))
reqs.push(sql.query(`delete from feats where id = any($1)`, [SCORIES.map(s => s.id)]))
console.log(`\n=== ECRITURE : ${reqs.length} requetes ===`)
await sql.transaction(reqs)
console.log('  transaction : OK')

// ─── CONTROLE ───────────────────────────────────────────────────────────────
const t = {
  feats: (await sql`select count(*)::int n from feats`)[0].n,
  character_feats: (await sql`select count(*)::int n from character_feats`)[0].n,
  character_languages: (await sql`select count(*)::int n from character_languages`)[0].n,
  orphelins: (await sql`select count(*)::int n from character_feats cf where not exists (select 1 from feats f where f.id=cf.feat_id)`)[0].n,
  doublonsF: (await sql`select count(*)::int n from (select personnage_id, feat_id from character_feats group by personnage_id, feat_id having count(*)>1) x`)[0].n,
  doublonsL: (await sql`select count(*)::int n from (select personnage_id, langue_id from character_languages group by personnage_id, langue_id having count(*)>1) x`)[0].n,
  persos: (await sql`select count(*)::int n from characters`)[0].n,
  grimdarDons: (await sql`select count(*)::int n from character_feats where personnage_id=86`)[0].n,
}
console.log('\n=== CONTROLE ===')
console.log(JSON.stringify(t, null, 1))
if (t.feats !== featsAvant - SCORIES.length) stop('feats : compte inattendu')
if (t.character_feats !== cfAvant - aRetirerF.length) stop('character_feats : compte inattendu')
if (t.character_languages !== clAvant - aRetirerL.length) stop('character_languages : compte inattendu')
if (t.orphelins !== 0 || t.doublonsF !== 0 || t.doublonsL !== 0) stop('orphelin ou doublon restant')
if (t.persos !== 71) stop('personnages perdus')
if (t.grimdarDons !== 5) stop('Grimdar doit garder ses 5 dons')
console.log('✓ integrite confirmee — Grimdar garde ses 5 dons')

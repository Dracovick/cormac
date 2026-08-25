import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const stop = m => { console.error('\n⛔ ARRET :', m); process.exit(1) }
const n1 = async q => (await q)[0]

// ─── GARDE-FOUS avant toute ecriture ───────────────────────────────────────
console.log('=== GARDE-FOUS ===')
const g = {
  r9:  (await sql`select count(*)::int n from races where id=9  and nom='Demi-Orc'`)[0].n,
  r10: (await sql`select count(*)::int n from races where id=10 and nom='Demi-Elf'`)[0].n,
  r3:  (await sql`select count(*)::int n from races where id=3  and nom='Demi-Elfe'`)[0].n,
  r7:  (await sql`select count(*)::int n from races where id=7  and nom='Demi-Orque'`)[0].n,
  r4:  (await sql`select count(*)::int n from races where id=4  and nom='Nain'`)[0].n,
  c8:  (await sql`select count(*)::int n from classes where id=8 and nom='Ensorcelleur'`)[0].n,
  ensorceleurDejaPris: (await sql`select count(*)::int n from classes where nom='Ensorceleur'`)[0].n,
  rf910:   (await sql`select count(*)::int n from racial_features where race_id in (9,10)`)[0].n,
  clan910: (await sql`select count(*)::int n from clans where race_id in (9,10)`)[0].n,
  ch10: (await sql`select count(*)::int n from characters where race_id=10`)[0].n,
  ch9:  (await sql`select count(*)::int n from characters where race_id=9`)[0].n,
}
console.log(JSON.stringify(g, null, 1))
if (g.r9!==1||g.r10!==1||g.r3!==1||g.r7!==1||g.r4!==1||g.c8!==1) stop('une ligne cible ne correspond pas a l identite attendue')
if (g.ensorceleurDejaPris!==0) stop('une classe nommee Ensorceleur existe deja -> collision UNIQUE')
if (g.rf910!==0) stop('racial_features encore rattaches aux races 9/10 : les migrer d abord')
if (g.clan910!==0) stop('clans encore rattaches aux races 9/10 : les migrer d abord')
if (g.ch10!==6) stop('attendu 6 personnages Demi-Elf, trouve ' + g.ch10)
if (g.ch9!==3)  stop('attendu 3 personnages Demi-Orc, trouve ' + g.ch9)
console.log('✓ tous les garde-fous passent')

// ─── LOT 1 : races (reaffecter PUIS supprimer) ─────────────────────────────
console.log('\n=== LOT 1 : races ===')
const r1 = await sql.transaction([
  sql`update characters set race_id=3 where race_id=10`,   // Demi-Elf -> Demi-Elfe
  sql`update characters set race_id=7 where race_id=9`,    // Demi-Orc -> Demi-Orque
  sql`delete from races where id=10`,
  sql`delete from races where id=9`,
  sql`update races set taille='Moyenne' where id=4`,       // Nain : Petite -> Moyenne
])
console.log('  transaction races : OK')

// ─── LOT 2 : classes (renommage + des de vie) ──────────────────────────────
console.log('\n=== LOT 2 : classes ===')
await sql.transaction([
  sql`update classes set nom='Ensorceleur' where id=8`,
  sql`update classes set de_vie='d10' where id=1`,  // Guerrier : d12 -> d10
  sql`update classes set de_vie='d10' where id=7`,  // Paladin  : d8  -> d10
  sql`update classes set de_vie='d4'  where id=8`,  // Ensorceleur : d8 -> d4
])
console.log('  transaction classes : OK')

// ─── CONTROLE IMMEDIAT ──────────────────────────────────────────────────────
console.log('\n=== CONTROLE ===')
const t = {
  characters: (await sql`select count(*)::int n from characters`)[0].n,
  charAvecRace: (await sql`select count(*)::int n from characters where race_id is not null`)[0].n,
  character_classes: (await sql`select count(*)::int n from character_classes`)[0].n,
  character_skills: (await sql`select count(*)::int n from character_skills`)[0].n,
  races: (await sql`select count(*)::int n from races`)[0].n,
  classes: (await sql`select count(*)::int n from classes`)[0].n,
  orphelinsRace: (await sql`select count(*)::int n from characters c where c.race_id is not null and not exists (select 1 from races r where r.id=c.race_id)`)[0].n,
  orphelinsClasse: (await sql`select count(*)::int n from character_classes cc where not exists (select 1 from classes cl where cl.id=cc.classe_id)`)[0].n,
}
console.log(JSON.stringify(t, null, 1))
if (t.characters!==70) stop('personnages perdus')
if (t.charAvecRace!==67) stop('un personnage a perdu sa race')
if (t.character_classes!==80) stop('liens de classe perdus')
if (t.character_skills!==510) stop('liens de competence perdus')
if (t.races!==10) stop('races : attendu 10, trouve ' + t.races)
if (t.classes!==16) stop('classes : attendu 16, trouve ' + t.classes)
if (t.orphelinsRace!==0 || t.orphelinsClasse!==0) stop('lien orphelin detecte')
console.log('✓ aucun lien perdu, aucun orphelin')

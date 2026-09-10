/**
 * Filet de securite AVANT toute ecriture liee a « Krugg le malchanceux » — 2026-08-27.
 *
 * Lecture seule. Produit deux fichiers :
 *   menage-references/krugg-etat-avant.json   — comptes + contenu integral du personnage 82
 *   menage-references/krugg-restauration.sql  — de quoi tout defaire
 *
 * ⚠️ Krugg Coeur-Flamboyant EXISTE DEJA (id=82, importe de FileMaker le 2026-06-29).
 * Deux voies sont possibles et le filet couvre les deux :
 *   A) completer le 82  → le SQL contient les UPDATE/DELETE qui remettent le 82 a l identique
 *   B) creer un nouveau → le SQL contient les DELETE des references creees apres cet instant
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const D = 'X:/Claude-Tools/cormac/menage-references/'
const ID = 82

const refs = ['clans', 'skills', 'feats', 'weapons', 'armor', 'magic_items', 'potions']
const perso = ['characters', 'character_classes', 'character_ability_scores', 'character_combat_stats',
  'character_saving_throws', 'character_skills', 'character_feats', 'character_weapons', 'character_armor',
  'character_magic_items', 'character_currency', 'character_languages', 'character_companions',
  'character_notes', 'character_journal', 'character_potions', 'character_spells', 'character_spell_effects',
  'character_creatures']

const etat = { horodatage: new Date().toISOString(), idExistant: ID, refs: {}, perso: {}, contenu82: {} }
for (const t of refs) {
  const r = (await sql.query(`select coalesce(max(id),0)::int m, count(*)::int n from ${t}`))[0]
  etat.refs[t] = { maxId: r.m, nb: r.n }
}
for (const t of perso) {
  const r = (await sql.query(`select count(*)::int n from ${t}`))[0]
  etat.perso[t] = r.n
}

// Contenu integral du personnage 82, table par table
etat.contenu82.characters = await sql.query(`select * from characters where id=$1`, [ID])
for (const t of perso.filter(t => t !== 'characters')) {
  etat.contenu82[t] = await sql.query(`select * from ${t} where personnage_id=$1`, [ID])
}
// L arme 157/158/159 est propre a Krugg : on garde aussi son etat de catalogue
etat.contenu82.weapons_du_perso = await sql.query(
  `select * from weapons where id in (select arme_id from character_weapons where personnage_id=$1)`, [ID])

fs.writeFileSync(D + 'krugg-etat-avant.json', JSON.stringify(etat, null, 1))

// ─── SQL de restauration ───────────────────────────────────────────────────
const q = v => v === null || v === undefined ? 'NULL' : (typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)

const L = []
L.push('-- Filet de securite AVANT toute ecriture liee a Krugg — ' + etat.horodatage)
L.push('-- ⛔ Krugg Coeur-Flamboyant EXISTE DEJA : id=' + ID + ' (joueur Daniel Tarte).')
L.push('--')
L.push('-- ══ VOIE A — on a COMPLETE le personnage 82 et on veut revenir en arriere ══')
L.push('--    Executer la section A ci-dessous, puis la section C (references creees).')
L.push('--')
L.push('-- ══ VOIE B — on a CREE un nouveau personnage et on veut revenir en arriere ══')
L.push('--    npx tsx --env-file=.env.local scripts/import-krugg.ts --rollback=<nouvel id>')
L.push('--    puis la section C.')
L.push('')
L.push('-- ─────────────── SECTION A : remettre le personnage 82 a l identique ───────────────')

// characters
const c = etat.contenu82.characters[0]
if (c) {
  L.push(`UPDATE characters SET`)
  const cols = ['nom', 'surnom', 'photo_url', 'race_id', 'sexe', 'taille', 'poids', 'yeux', 'cheveux', 'age',
    'alignement', 'dieu_id', 'clan_id', 'xp', 'historique', 'notes', 'joueur_prenom', 'joueur_nom']
  L.push('  ' + cols.map(k => `${k} = ${q(c[k])}`).join(',\n  '))
  L.push(`WHERE id = ${ID};`)
  L.push('')
}
// tables filles : on efface tout et on reinsere l etat d origine
for (const t of perso.filter(t => t !== 'characters')) {
  const rows = etat.contenu82[t]
  L.push(`DELETE FROM ${t} WHERE personnage_id = ${ID};   -- ${rows.length} ligne(s) a restaurer`)
  for (const r of rows) {
    const cols = Object.keys(r)
    L.push(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(k => q(r[k])).join(', ')});`)
  }
}
L.push('')
L.push('-- Les 3 armes de Krugg (tables weapons — une ligne PAR PERSONNAGE, pas un catalogue)')
for (const w of etat.contenu82.weapons_du_perso) {
  const cols = ['nom', 'categorie_id', 'degats', 'critique_min', 'critique_mult', 'portee', 'type_degats', 'taille', 'poids', 'prix', 'description']
  L.push(`UPDATE weapons SET ${cols.map(k => `${k} = ${q(w[k])}`).join(', ')} WHERE id = ${w.id};`)
}
L.push('')
L.push('-- ─────────────── SECTION C : references creees APRES cet instant ───────────────')
L.push('-- ⛔ A n executer que si l operation est abandonnee, et dans cet ordre.')
for (const t of refs) L.push(`DELETE FROM ${t} WHERE id > ${etat.refs[t].maxId};   -- ${t} comptait ${etat.refs[t].nb} lignes, max(id)=${etat.refs[t].maxId}`)
L.push('')
L.push('-- Verification apres restauration : ces comptes doivent etre retrouves')
for (const t of refs) L.push(`--   ${t} = ${etat.refs[t].nb}`)
for (const t of perso) L.push(`--   ${t} = ${etat.perso[t]}`)

fs.writeFileSync(D + 'krugg-restauration.sql', L.join('\n'))

console.log('=== ETAT AVANT (' + etat.horodatage + ') ===')
for (const t of refs) console.log(`  ${t.padEnd(14)} ${String(etat.refs[t].nb).padStart(4)} lignes, max(id)=${etat.refs[t].maxId}`)
console.log('  --- tables du personnage (totaux base) ---')
for (const t of perso) console.log(`  ${t.padEnd(26)} ${etat.perso[t]}`)
console.log('  --- contenu du personnage 82 ---')
for (const t of perso) console.log(`  ${t.padEnd(26)} ${(etat.contenu82[t] ?? []).length}`)
console.log('\n✅ krugg-etat-avant.json et krugg-restauration.sql ecrits.')

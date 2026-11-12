/**
 * MESURE DE L'ÉTAT DES RACES — avant d'ouvrir le chantier des sous-races.
 *
 *   node scripts/mesure-races.mjs
 *
 * Trois questions auxquelles il faut une réponse AVANT d'écrire une ligne :
 *   1. quelles races existent en base, avec quels bonus (la page du personnage
 *      lit `races.bonus_*`, la feuille imprimée lit le module TS — ils doivent
 *      concorder);
 *   2. quelles races les fiches portent réellement, et combien de fiches chacune;
 *   3. ce que `racial_features` contient déjà (la fiche l'affiche).
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()
  .replace(/\r/g, '')
  .replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

const races = await sql`
  select r.id, r.nom, r.bonus_for, r.bonus_dex, r.bonus_con, r.bonus_int,
         r.bonus_sag, r.bonus_cha, r.taille, r.deplacement_base, r.vision_nocturne,
         (select count(*)::int from characters c where c.race_id = r.id) as fiches,
         (select count(*)::int from racial_features f where f.race_id = r.id) as traits
  from races r
  order by r.nom`

console.log(`\n=== ${races.length} races en base ===`)
console.log('nom'.padEnd(26), 'FOR DEX CON INT SAG CHA'.padEnd(24), 'taille'.padEnd(10), 'dép'.padEnd(5), 'noct'.padEnd(6), 'fiches', 'traits')
for (const r of races) {
  const b = [r.bonus_for, r.bonus_dex, r.bonus_con, r.bonus_int, r.bonus_sag, r.bonus_cha]
    .map(v => String(v ?? 0).padStart(3)).join(' ')
  console.log(
    String(r.nom).padEnd(26), b.padEnd(24), String(r.taille ?? '').padEnd(10),
    String(r.deplacement_base ?? '').padEnd(5), String(r.vision_nocturne).padEnd(6),
    String(r.fiches).padStart(6), String(r.traits).padStart(6))
}

const sansRace = await sql`select count(*)::int as n from characters where race_id is null`
const total = await sql`select count(*)::int as n from characters`
console.log(`\nFiches : ${total[0].n} au total, ${sansRace[0].n} sans race.`)

const traits = await sql`
  select f.id, r.nom as race, f.nom, left(coalesce(f.description, ''), 70) as description
  from racial_features f join races r on r.id = f.race_id
  order by r.nom, f.nom`
console.log(`\n=== ${traits.length} traits raciaux (racial_features) ===`)
for (const t of traits) console.log(`  [${t.race}] ${t.nom} — ${t.description}`)

const colonnes = await sql`
  select column_name, data_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'characters'
    and column_name like '%race%'`
console.log('\n=== colonnes « race » de characters ===')
for (const c of colonnes) console.log(`  ${c.column_name} (${c.data_type})`)

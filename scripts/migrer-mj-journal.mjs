/* Le champ d'identification du Maître de jeu — drizzle/0014.
 *
 * Demande d'André le 2026-11-09 : « Comme nous sommes plusieurs maîtres de Donjons à
 * mener des parties avec le Grimoire, il faudrait un champ pour s'identifier dans le
 * journal du Maître. »
 *
 * Les migrations 0006 à 0014 sont appliquées par script et non par drizzle-kit : le
 * journal de drizzle (`drizzle/meta/_journal.json`) s'arrête à 0005, et le rattraper
 * d'un coup rejouerait des migrations déjà passées.
 *
 * ⚠ Le contrôle porte sur un TÉMOIN connu, mesuré juste avant : le nombre d'entrées
 * du journal ne doit pas bouger. Une migration qui ajoute une colonne et perd une
 * ligne sortirait verte sur le seul test « la colonne existe-t-elle ? ».
 *
 * ⛔ Aucun process.exit() au succès : sur Windows, la connexion neon encore ouverte
 * fait hurler libuv (« Assertion failed … async.c ») et Node sort en 127 — un succès
 * qui ressemble à un échec, donc un contrôle inutilisable.
 *
 * Usage :
 *   node scripts/migrer-mj-journal.mjs              → relève l'état, n'écrit rien
 *   node scripts/migrer-mj-journal.mjs --appliquer  → écrit
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APPLIQUER = process.argv.includes('--appliquer')

// ⚠ DATABASE_URL n'est PAS entre guillemets dans .env.local, contrairement à
// BLOB_READ_WRITE_TOKEN. On enlève les guillemets éventuels dans les deux cas.
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

async function colonneExiste() {
  const r = await sql`
    select 1 from information_schema.columns
    where table_name = 'character_journal' and column_name = 'mj'`
  return r.length > 0
}

async function indexExiste() {
  const r = await sql`
    select 1 from pg_indexes
    where tablename = 'character_journal' and indexname = 'idx_character_journal_mj'`
  return r.length > 0
}

const compter = async () => (await sql`select count(*)::int n from character_journal`)[0].n

// ── État avant ───────────────────────────────────────────────────────────────
const avant = {
  colonne: await colonneExiste(),
  index: await indexExiste(),
  entrees: await compter(),
}
console.log('AVANT  colonne mj :', avant.colonne, '· index :', avant.index, '· entrées au journal :', avant.entrees)

if (!APPLIQUER) {
  console.log('')
  console.log('Essai seulement — rien n’a été écrit. Relancez avec --appliquer.')
} else {
  // ── Écriture ───────────────────────────────────────────────────────────────
  await sql`ALTER TABLE "character_journal" ADD COLUMN IF NOT EXISTS "mj" varchar(60)`
  await sql`
    CREATE INDEX IF NOT EXISTS "idx_character_journal_mj"
      ON "character_journal" ("mj") WHERE "mj" IS NOT NULL`

  // ── Contrôle ───────────────────────────────────────────────────────────────
  const apres = {
    colonne: await colonneExiste(),
    index: await indexExiste(),
    entrees: await compter(),
    type: (await sql`
      select data_type, character_maximum_length, is_nullable
      from information_schema.columns
      where table_name = 'character_journal' and column_name = 'mj'`)[0],
    // Aucune ligne existante ne doit avoir été signée au passage : la migration ne
    // décide pas qui a mené les soirées passées.
    signees: (await sql`select count(*)::int n from character_journal where mj is not null`)[0].n,
  }
  console.log('APRÈS  colonne mj :', apres.colonne, '· index :', apres.index, '· entrées au journal :', apres.entrees)
  console.log('       type :', apres.type)
  console.log('       entrées signées d’un MJ :', apres.signees, '(0 attendu — rien n’est attribué d’office)')

  const defauts = []
  if (!apres.colonne) defauts.push('la colonne mj est absente')
  if (!apres.index) defauts.push('l’index idx_character_journal_mj est absent')
  if (apres.entrees !== avant.entrees) defauts.push(`le journal est passé de ${avant.entrees} à ${apres.entrees} entrées`)
  if (apres.signees !== 0) defauts.push(`${apres.signees} entrées ont été signées par la migration`)
  if (apres.type?.character_maximum_length !== 60) defauts.push(`longueur ${apres.type?.character_maximum_length} au lieu de 60`)
  if (apres.type?.is_nullable !== 'YES') defauts.push('la colonne refuse NULL — une note de MJ non identifié échouerait')

  if (defauts.length) {
    console.error('')
    console.error('⛔ ÉCHEC :')
    for (const d of defauts) console.error('- ' + d)
    process.exitCode = 1
  } else {
    console.log('')
    console.log('✅ Migration 0014 appliquée et contrôlée.')
  }
}

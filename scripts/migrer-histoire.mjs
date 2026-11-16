/* L'histoire du personnage — drizzle/0018.
 *
 * Demande d'André le 2026-11-15 : « J'aimerais développer une section dans le
 * grimoire pour l'histoire des personnages. Quelque chose de différent de leur
 * fiche de personnage. Un lien dans la fiche du personnage qui amène à son
 * histoire détaillée que le joueur pourrait écrire. »
 *
 * Les migrations 0006 et suivantes sont appliquées par script et non par
 * drizzle-kit : le journal de drizzle (`drizzle/meta/_journal.json`) s'arrête à
 * 0005, et le rattraper d'un coup rejouerait des migrations déjà passées.
 *
 * ⚠ Les contrôles portent sur des TÉMOINS mesurés juste avant : le nombre de
 * personnages et le contenu de `characters.historique` ne doivent pas bouger
 * d'une ligne. Cette migration AJOUTE une table — elle ne touche pas au résumé
 * de la fiche, et c'est précisément ce qu'il faut prouver.
 *
 * ⛔ Aucun process.exit() au succès : sur Windows, la connexion neon encore
 * ouverte fait hurler libuv (« Assertion failed … async.c ») et Node sort en
 * 127 — un succès qui ressemble à un échec.
 *
 * Usage :
 *   node scripts/migrer-histoire.mjs              → relève l'état, n'écrit rien
 *   node scripts/migrer-histoire.mjs --appliquer  → écrit
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APPLIQUER = process.argv.includes('--appliquer')

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

const TABLE = 'character_story_chapters'
const INDEX = 'idx_character_story_personnage'

async function tableExiste() {
  const r = await sql`
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = ${TABLE}`
  return r.length > 0
}

async function indexExiste() {
  const r = await sql`
    select 1 from pg_indexes where tablename = ${TABLE} and indexname = ${INDEX}`
  return r.length > 0
}

async function colonnes() {
  return await sql`
    select column_name, data_type, character_maximum_length, is_nullable, column_default
    from information_schema.columns
    where table_name = ${TABLE}
    order by ordinal_position`
}

/** Témoins : rien de ce qui existait ne doit bouger. */
async function temoins() {
  const [t] = await sql`
    select
      (select count(*)::int from characters)                                  personnages,
      (select count(*)::int from characters where historique is not null)     avec_historique,
      (select coalesce(sum(length(historique)), 0)::int from characters)      car_historique,
      (select count(*)::int from character_journal)                           journal,
      (select count(*)::int from character_notes)                             notes`
  return t
}

const avant = { table: await tableExiste(), index: await indexExiste(), temoins: await temoins() }
console.log(`AVANT  table ${TABLE} :`, avant.table, '· index :', avant.index)
console.log('       témoins :', JSON.stringify(avant.temoins))

if (!APPLIQUER) {
  console.log('')
  console.log('Essai seulement — rien n’a été écrit. Relancez avec --appliquer.')
} else {
  // ── Écriture ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS "character_story_chapters" (
      "id"            serial PRIMARY KEY NOT NULL,
      "personnage_id" integer NOT NULL REFERENCES "characters"("id"),
      "titre"         varchar(200) NOT NULL,
      "contenu"       text NOT NULL DEFAULT '',
      "ordre"         integer NOT NULL DEFAULT 0,
      "signature"     varchar(60),
      "created_at"    timestamp DEFAULT now(),
      "updated_at"    timestamp DEFAULT now()
    )`
  await sql`
    CREATE INDEX IF NOT EXISTS "idx_character_story_personnage"
      ON "character_story_chapters" ("personnage_id", "ordre")`

  // ── Contrôle ───────────────────────────────────────────────────────────────
  const apres = {
    table: await tableExiste(),
    index: await indexExiste(),
    temoins: await temoins(),
    cols: await colonnes(),
    lignes: (await sql`select count(*)::int n from character_story_chapters`)[0].n,
  }
  console.log('APRÈS  table :', apres.table, '· index :', apres.index, '· lignes :', apres.lignes)
  console.log('       témoins :', JSON.stringify(apres.temoins))
  for (const c of apres.cols) {
    console.log(`       ${c.column_name.padEnd(14)} ${c.data_type}` +
      (c.character_maximum_length ? `(${c.character_maximum_length})` : '') +
      ` · null=${c.is_nullable} · défaut=${c.column_default ?? '—'}`)
  }

  const col = n => apres.cols.find(c => c.column_name === n)
  const defauts = []
  if (!apres.table) defauts.push(`la table ${TABLE} est absente`)
  if (!apres.index) defauts.push(`l’index ${INDEX} est absent`)
  if (apres.lignes !== 0) defauts.push(`la table neuve contient ${apres.lignes} lignes`)
  for (const [k, v] of Object.entries(avant.temoins)) {
    if (apres.temoins[k] !== v) defauts.push(`${k} : ${v} → ${apres.temoins[k]}`)
  }
  if (col('titre')?.is_nullable !== 'NO') defauts.push('titre accepte NULL — un chapitre sans titre ne se navigue pas')
  if (col('titre')?.character_maximum_length !== 200) defauts.push(`titre en ${col('titre')?.character_maximum_length} au lieu de 200`)
  if (col('contenu')?.is_nullable !== 'NO') defauts.push('contenu accepte NULL — il doit valoir la chaîne vide')
  if (col('contenu')?.data_type !== 'text') defauts.push(`contenu est ${col('contenu')?.data_type} au lieu de text`)
  if (col('ordre')?.is_nullable !== 'NO') defauts.push('ordre accepte NULL — un rang absent casse le tri')
  // ⚠ `signature` DOIT accepter NULL : le Grimoire n'a qu'un mot de passe
  // partagé, il ne SAIT pas qui écrit. Un nom inventé serait pire que rien.
  if (col('signature')?.is_nullable !== 'YES') defauts.push('signature refuse NULL')
  if (col('signature')?.character_maximum_length !== 60) defauts.push(`signature en ${col('signature')?.character_maximum_length} au lieu de 60`)

  // Témoin de bout en bout : deux chapitres s'écrivent, se relisent DANS L'ORDRE,
  // se renumérotent, et repartent. C'est le seul contrôle qui prouve que la table
  // SERT — et le tri est la moitié de ce qu'on lui demande.
  const [cible] = await sql`select id from characters order by id limit 1`
  if (cible) {
    const [a] = await sql`
      insert into character_story_chapters (personnage_id, titre, contenu, ordre, signature)
      values (${cible.id}, 'Témoin de migration — premier', 'Du texte.', 0, 'migration')
      returning id, titre, ordre, signature, created_at, updated_at`
    const [b] = await sql`
      insert into character_story_chapters (personnage_id, titre, contenu, ordre)
      values (${cible.id}, 'Témoin de migration — second', '', 1)
      returning id, titre, ordre, signature, contenu`
    console.log('       témoins écrits :', a.id, b.id)

    if (b.signature !== null) defauts.push(`la signature omise vaut ${JSON.stringify(b.signature)} au lieu de null`)
    if (b.contenu !== '') defauts.push(`le contenu vide vaut ${JSON.stringify(b.contenu)} au lieu de ''`)
    if (!a.created_at || !a.updated_at) defauts.push('created_at / updated_at ne sont pas remplis à l’insertion')

    const ordre = await sql`
      select id, titre from character_story_chapters
      where personnage_id = ${cible.id} order by ordre asc, id asc`
    if (ordre.length !== 2) defauts.push(`${ordre.length} chapitre(s) relus au lieu de 2`)
    if (ordre[0]?.id !== a.id) defauts.push('le tri par ordre ne rend pas le premier chapitre en premier')

    // La renumérotation inversée — exactement ce que fait `deplacerChapitre`.
    await sql`update character_story_chapters set ordre = 1 where id = ${a.id}`
    await sql`update character_story_chapters set ordre = 0 where id = ${b.id}`
    const inverse = await sql`
      select id from character_story_chapters
      where personnage_id = ${cible.id} order by ordre asc, id asc`
    if (inverse[0]?.id !== b.id) defauts.push('la renumérotation ne change pas l’ordre de lecture')

    await sql`delete from character_story_chapters where id in (${a.id}, ${b.id})`
    const reste = (await sql`select count(*)::int n from character_story_chapters`)[0].n
    if (reste !== 0) defauts.push(`${reste} ligne(s) d’essai survivent`)
    console.log('       témoins détruits · lignes restantes :', reste)
  } else {
    defauts.push('aucun personnage en base : le témoin de bout en bout n’a pas pu être écrit')
  }

  if (defauts.length) {
    console.error('')
    console.error('⛔ ÉCHEC :')
    for (const d of defauts) console.error('- ' + d)
    process.exitCode = 1
  } else {
    console.log('')
    console.log('✅ Migration 0018 appliquée et contrôlée.')
  }
}

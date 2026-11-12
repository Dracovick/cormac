/* L'équipement courant — drizzle/0017.
 *
 * Demande d'André le 2026-11-12 : « Il manque une section équipement dans les fiches
 * de personnages… l'endroit où inscrire corde de 15 m, miroir, outils de voleur,
 * rations… j'aimerais que cette section soit modifiable tant du côté de la page de
 * modification que directement dans la page du personnage. »
 *
 * Les migrations 0006 et suivantes sont appliquées par script et non par drizzle-kit :
 * le journal de drizzle (`drizzle/meta/_journal.json`) s'arrête à 0005, et le
 * rattraper d'un coup rejouerait des migrations déjà passées.
 *
 * ⚠ Les contrôles portent sur des TÉMOINS connus, mesurés juste avant : le nombre de
 * personnages et le nombre de lignes des sept tables d'inventaire déjà en place ne
 * doivent pas bouger d'une ligne. Une migration qui crée la table et perd des potions
 * sortirait verte sur le seul test « la table existe-t-elle ? ».
 *
 * ⛔ Aucun process.exit() au succès : sur Windows, la connexion neon encore ouverte
 * fait hurler libuv (« Assertion failed … async.c ») et Node sort en 127 — un succès
 * qui ressemble à un échec, donc un contrôle inutilisable.
 *
 * Usage :
 *   node scripts/migrer-equipement.mjs              → relève l'état, n'écrit rien
 *   node scripts/migrer-equipement.mjs --appliquer  → écrit
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

async function tableExiste() {
  const r = await sql`
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'character_equipment'`
  return r.length > 0
}

async function indexExiste() {
  const r = await sql`
    select 1 from pg_indexes
    where tablename = 'character_equipment' and indexname = 'idx_character_equipment_personnage'`
  return r.length > 0
}

async function colonnes() {
  const r = await sql`
    select column_name, data_type, character_maximum_length, numeric_precision,
           numeric_scale, is_nullable, column_default
    from information_schema.columns
    where table_name = 'character_equipment'
    order by ordinal_position`
  return r
}

/** Témoins : rien de ce qui existait ne doit bouger. */
async function temoins() {
  const [t] = await sql`
    select
      (select count(*)::int from characters)             personnages,
      (select count(*)::int from character_weapons)      armes,
      (select count(*)::int from character_armor)        armures,
      (select count(*)::int from character_magic_items)  objets,
      (select count(*)::int from character_potions)      potions,
      (select count(*)::int from character_scrolls)      parchemins,
      (select count(*)::int from character_gems)         gemmes,
      (select count(*)::int from character_currency)     bourses`
  return t
}

const avant = { table: await tableExiste(), index: await indexExiste(), temoins: await temoins() }
console.log('AVANT  table character_equipment :', avant.table, '· index :', avant.index)
console.log('       témoins :', JSON.stringify(avant.temoins))

if (!APPLIQUER) {
  console.log('')
  console.log('Essai seulement — rien n’a été écrit. Relancez avec --appliquer.')
} else {
  // ── Écriture ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS "character_equipment" (
      "id"            serial PRIMARY KEY NOT NULL,
      "personnage_id" integer NOT NULL REFERENCES "characters"("id"),
      "nom"           varchar(200) NOT NULL,
      "quantite"      integer DEFAULT 1,
      "emplacement"   varchar(100),
      "valeur"        numeric(10, 2),
      "unite"         varchar(4) DEFAULT 'po',
      "poids"         numeric(6, 2),
      "notes"         text
    )`
  await sql`
    CREATE INDEX IF NOT EXISTS "idx_character_equipment_personnage"
      ON "character_equipment" ("personnage_id")`

  // ── Contrôle ───────────────────────────────────────────────────────────────
  const apres = {
    table: await tableExiste(),
    index: await indexExiste(),
    temoins: await temoins(),
    cols: await colonnes(),
    lignes: (await sql`select count(*)::int n from character_equipment`)[0].n,
  }
  console.log('APRÈS  table :', apres.table, '· index :', apres.index, '· lignes :', apres.lignes)
  console.log('       témoins :', JSON.stringify(apres.temoins))
  for (const c of apres.cols) {
    console.log(`       ${c.column_name.padEnd(14)} ${c.data_type}` +
      (c.character_maximum_length ? `(${c.character_maximum_length})` : '') +
      (c.numeric_precision ? `(${c.numeric_precision},${c.numeric_scale})` : '') +
      ` · null=${c.is_nullable} · défaut=${c.column_default ?? '—'}`)
  }

  const col = n => apres.cols.find(c => c.column_name === n)
  const defauts = []
  if (!apres.table) defauts.push('la table character_equipment est absente')
  if (!apres.index) defauts.push('l’index idx_character_equipment_personnage est absent')
  if (apres.lignes !== 0) defauts.push(`la table neuve contient ${apres.lignes} lignes`)
  for (const [k, v] of Object.entries(avant.temoins)) {
    if (apres.temoins[k] !== v) defauts.push(`${k} : ${v} → ${apres.temoins[k]}`)
  }
  // Les colonnes qui portent une absence DOIVENT accepter NULL : « non pesé » et
  // « non chiffré » ne se disent pas avec un 0.
  for (const n of ['emplacement', 'valeur', 'poids', 'notes']) {
    if (col(n)?.is_nullable !== 'YES') defauts.push(`${n} refuse NULL`)
  }
  if (col('nom')?.is_nullable !== 'NO') defauts.push('nom accepte NULL — une ligne sans nom est illisible')
  if (col('nom')?.character_maximum_length !== 200) defauts.push(`nom en ${col('nom')?.character_maximum_length} au lieu de 200`)
  if (col('poids')?.numeric_precision !== 6 || col('poids')?.numeric_scale !== 2) defauts.push('poids n’est pas numeric(6,2)')
  if (col('valeur')?.numeric_precision !== 10 || col('valeur')?.numeric_scale !== 2) defauts.push('valeur n’est pas numeric(10,2)')
  if (!String(col('unite')?.column_default ?? '').includes("'po'")) defauts.push('unite n’a pas « po » par défaut')

  // Témoin de bout en bout : une ligne s'écrit, se relit telle quelle, et repart.
  // C'est le seul contrôle qui prouve que la table SERT, et non qu'elle existe.
  const [cible] = await sql`select id from characters order by id limit 1`
  if (cible) {
    const [ecrite] = await sql`
      insert into character_equipment (personnage_id, nom, quantite, emplacement, valeur, unite, poids, notes)
      values (${cible.id}, 'Témoin de migration — corde de chanvre (15 m)', 2, 'sac à dos', 1, 'po', 5, 'ligne d’essai')
      returning id, nom, quantite, emplacement, valeur, unite, poids`
    console.log('       témoin écrit :', JSON.stringify(ecrite))
    if (Number(ecrite.poids) !== 5) defauts.push(`le poids relu vaut ${ecrite.poids} au lieu de 5`)
    if (Number(ecrite.valeur) !== 1) defauts.push(`la valeur relue vaut ${ecrite.valeur} au lieu de 1`)
    if (ecrite.quantite !== 2) defauts.push(`la quantité relue vaut ${ecrite.quantite} au lieu de 2`)
    await sql`delete from character_equipment where id = ${ecrite.id}`
    const reste = (await sql`select count(*)::int n from character_equipment`)[0].n
    if (reste !== 0) defauts.push(`${reste} ligne(s) d’essai survivent`)
    console.log('       témoin détruit · lignes restantes :', reste)
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
    console.log('✅ Migration 0017 appliquée et contrôlée.')
  }
}

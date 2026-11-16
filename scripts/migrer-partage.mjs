/* Le lien de partage d'une histoire — drizzle/0019.
 *
 * André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire.
 * Lorsque je copie le lien de la page ce lien amène à l'accueil du site. »
 *
 * Les migrations 0006 et suivantes sont appliquées par script et non par
 * drizzle-kit : le journal de drizzle (`drizzle/meta/_journal.json`) s'arrête à
 * 0005, et le rattraper d'un coup rejouerait des migrations déjà passées.
 *
 * ⚠ Les contrôles portent sur des TÉMOINS mesurés juste avant : le nombre de
 * personnages, leurs chapitres d'histoire et le total de caractères écrits ne
 * doivent pas bouger d'un seul. Cette migration AJOUTE une table — elle ne
 * touche à aucune histoire déjà écrite, et c'est précisément ce qu'il faut
 * prouver, pas supposer.
 *
 * ⛔ Aucun process.exit() au succès : sur Windows, la connexion neon encore
 * ouverte fait hurler libuv (« Assertion failed … async.c ») et Node sort en
 * 127 — un succès qui ressemble à un échec.
 *
 * Usage :
 *   node scripts/migrer-partage.mjs              → relève l'état, n'écrit rien
 *   node scripts/migrer-partage.mjs --appliquer  → écrit
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

const TABLE = 'character_story_shares'

async function tableExiste() {
  const r = await sql`
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = ${TABLE}`
  return r.length > 0
}

async function colonnes() {
  return await sql`
    select column_name, data_type, character_maximum_length, is_nullable, column_default
    from information_schema.columns
    where table_name = ${TABLE}
    order by ordinal_position`
}

async function uniques() {
  return await sql`
    select kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    where tc.table_schema = 'public' and tc.table_name = ${TABLE}
      and tc.constraint_type = 'UNIQUE'`
}

/** Témoins : rien de ce qui existait ne doit bouger. */
async function temoins() {
  const [t] = await sql`
    select
      (select count(*)::int from characters)                                        personnages,
      (select count(*)::int from character_story_chapters)                          chapitres,
      (select coalesce(sum(length(contenu)), 0)::int from character_story_chapters) car_histoires,
      (select coalesce(sum(length(historique)), 0)::int from characters)             car_historique`
  return t
}

const avant = { table: await tableExiste(), temoins: await temoins() }
console.log(`AVANT  table ${TABLE} :`, avant.table)
console.log('       témoins :', JSON.stringify(avant.temoins))

if (!APPLIQUER) {
  console.log('')
  console.log('Essai seulement — rien n’a été écrit. Relancez avec --appliquer.')
} else {
  // ── Écriture ───────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS "character_story_shares" (
      "id"            serial PRIMARY KEY NOT NULL,
      "personnage_id" integer NOT NULL UNIQUE REFERENCES "characters"("id"),
      "jeton"         varchar(64) NOT NULL UNIQUE,
      "cree_le"       timestamp DEFAULT now()
    )`

  // ── Contrôle ───────────────────────────────────────────────────────────────
  const apres = {
    table: await tableExiste(),
    temoins: await temoins(),
    cols: await colonnes(),
    uniq: (await uniques()).map(u => u.column_name).sort(),
    lignes: (await sql`select count(*)::int n from character_story_shares`)[0].n,
  }
  console.log('APRÈS  table :', apres.table, '· lignes :', apres.lignes, '· UNIQUE :', apres.uniq.join(', '))
  console.log('       témoins :', JSON.stringify(apres.temoins))
  for (const c of apres.cols) {
    console.log(`       ${c.column_name.padEnd(14)} ${c.data_type}` +
      (c.character_maximum_length ? `(${c.character_maximum_length})` : '') +
      ` · null=${c.is_nullable} · défaut=${c.column_default ?? '—'}`)
  }

  const col = n => apres.cols.find(c => c.column_name === n)
  const defauts = []
  if (!apres.table) defauts.push(`la table ${TABLE} est absente`)
  if (apres.lignes !== 0) defauts.push(`la table neuve contient ${apres.lignes} lignes`)
  for (const [k, v] of Object.entries(avant.temoins)) {
    if (apres.temoins[k] !== v) defauts.push(`${k} : ${v} → ${apres.temoins[k]}`)
  }
  if (col('jeton')?.is_nullable !== 'NO') defauts.push('jeton accepte NULL — c’est la clé d’entrée de la page publique')
  if (col('jeton')?.character_maximum_length !== 64) defauts.push(`jeton en ${col('jeton')?.character_maximum_length} au lieu de 64`)
  if (col('personnage_id')?.is_nullable !== 'NO') defauts.push('personnage_id accepte NULL')
  if (!apres.uniq.includes('jeton')) defauts.push('jeton n’est pas UNIQUE — deux histoires pourraient répondre à la même adresse')
  if (!apres.uniq.includes('personnage_id')) defauts.push('personnage_id n’est pas UNIQUE — « Partager » deux fois créerait deux liens, et la révocation n’en couperait qu’un')

  // ── Témoin de bout en bout ─────────────────────────────────────────────────
  // La table SERT-elle ? Un partage s'écrit, se relit PAR SON JETON, refuse un
  // doublon, et repart. C'est la seule épreuve qui prouve la mécanique complète
  // — l'existence des colonnes ne prouve que leur existence.
  const [victime] = await sql`select id from characters order by id limit 1`
  if (!victime) {
    defauts.push('aucun personnage en base : témoin de bout en bout impossible')
  } else {
    const jetonEssai = 'zzzzessaimigration' + String(Date.now()).slice(-6)
    await sql`delete from character_story_shares where personnage_id = ${victime.id}`
    await sql`insert into character_story_shares (personnage_id, jeton) values (${victime.id}, ${jetonEssai})`

    const relu = await sql`select personnage_id from character_story_shares where jeton = ${jetonEssai}`
    if (relu.length !== 1 || relu[0].personnage_id !== victime.id) {
      defauts.push('un partage écrit ne se relit pas par son jeton')
    }

    // L'unicité de `personnage_id` doit MORDRE : un second lien pour la même
    // histoire est précisément ce qui ferait survivre un lien après révocation.
    let refuse = false
    try {
      await sql`insert into character_story_shares (personnage_id, jeton) values (${victime.id}, ${jetonEssai + 'b'})`
    } catch {
      refuse = true
    }
    if (!refuse) defauts.push('un SECOND lien pour la même histoire a été accepté')

    await sql`delete from character_story_shares where jeton like 'zzzzessaimigration%'`
    const reste = await sql`select count(*)::int n from character_story_shares where jeton like 'zzzzessaimigration%'`
    if (reste[0].n !== 0) defauts.push('le témoin de bout en bout n’a pas été nettoyé')
    console.log('       témoin de bout en bout : écrit, relu par jeton, doublon refusé, nettoyé')
  }

  console.log('')
  if (defauts.length === 0) {
    console.log('✅ Migration appliquée, aucun défaut. Rien de ce qui existait n’a bougé.')
  } else {
    console.log('⛔ DÉFAUTS :')
    for (const d of defauts) console.log('   ' + d)
    process.exitCode = 1
  }
}

/**
 * OÙ EST RANGÉ LE TEXTE D'HISTOIRE DE CORMAC ?
 *
 *   node scripts/chercher-histoire-cormac.mjs
 *
 * André demande le 17 novembre 2026 : « Et l'histoire de Cormac, on avait déjà
 * fait un texte… tu te rappelles où c'est rangé? »
 *
 * On balaie TOUTES les colonnes de texte de TOUTES les tables de la base, sans
 * présumer laquelle porte le texte — et on affiche la longueur de chaque champ
 * trouvé, parce qu'un « historique » de 80 caractères n'est pas « un texte ».
 *
 * ⛔ Témoin positif obligatoire dans la même sortie : si la recherche ne trouve
 * rien du tout, c'est l'instrument qu'il faut accuser, pas la base.
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

/* 1. Les fiches dont le nom contient « cormac ». */
const fiches = await sql`
  SELECT id, nom, joueur_prenom, length(coalesce(historique,'')) AS n_histo,
         length(coalesce(notes,'')) AS n_notes
  FROM characters WHERE nom ILIKE '%cormac%' ORDER BY id`
console.log('=== fiches dont le nom contient « cormac » ===')
for (const f of fiches)
  console.log(
    `  [${f.id}] ${f.nom}  joueur=${f.joueur_prenom ?? 'NULL'}  historique=${f.n_histo} car.  notes=${f.n_notes} car.`,
  )
if (fiches.length === 0) console.log('  (aucune)')

/* 2. Les chapitres d'histoire déposés, toutes fiches confondues. */
const chap = await sql`
  SELECT c.id AS fiche, c.nom, count(*) AS n, sum(length(coalesce(s.contenu,''))) AS car
  FROM character_story_chapters s JOIN characters c ON c.id = s.personnage_id
  GROUP BY c.id, c.nom ORDER BY c.id`
console.log('\n=== chapitres d’histoire en base (table character_story_chapters) ===')
for (const r of chap) console.log(`  [${r.fiche}] ${r.nom} — ${r.n} chapitres, ${r.car} car.`)
if (chap.length === 0) console.log('  (aucun)')

/* 3. Balayage GÉNÉRAL : toute colonne texte de toute table, cherchée sur
      « cormac ». On construit les requêtes depuis le catalogue, donc aucune
      table ne peut être oubliée. */
const colonnes = await sql`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND data_type IN ('text','character varying')
  ORDER BY table_name, column_name`
console.log(`\n=== balayage général : ${colonnes.length} colonnes texte ===`)
let trouvailles = 0
for (const { table_name: t, column_name: c } of colonnes) {
  const q = `SELECT count(*)::int AS n, max(length(${'"' + c + '"'}))::int AS maxlen
             FROM ${'"' + t + '"'} WHERE ${'"' + c + '"'} ILIKE '%cormac%'`
  let r
  try {
    r = await sql.query(q)
  } catch (e) {
    console.log(`  ⚠ ${t}.${c} : ${e.message}`)
    continue
  }
  const { n, maxlen } = r[0]
  if (n > 0) {
    trouvailles++
    console.log(`  ${t}.${c} → ${n} ligne(s), plus long champ ${maxlen} car.`)
  }
}
if (trouvailles === 0)
  console.log('  ⛔ AUCUNE colonne ne contient « cormac » — accuser l’instrument avant la base.')

/* 4. Témoin positif : le même balayage sur un mot dont je SAIS qu'il est en
      base (« dragon »), pour prouver que la boucle mord. */
const temoin = await sql`SELECT count(*)::int AS n FROM spells WHERE nom ILIKE '%dragon%'`
console.log(`\n[témoin positif] sorts dont le nom contient « dragon » : ${temoin[0].n}`)

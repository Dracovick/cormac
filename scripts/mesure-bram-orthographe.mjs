/**
 * MESURE DE L'ORTHOGRAPHE « Bram » / « Bramm » partout en base.
 *
 *   node scripts/mesure-bram-orthographe.mjs
 *
 * André a tranché le 16 novembre 2026 : c'est **Bram Verrelune**, un seul « m ».
 * Reste à vérifier qu'aucun texte déjà déposé ne porte l'autre orthographe —
 * les trois histoires (DracoVick, Duncan, Azadrielle), les notes, le journal, et
 * le nom des fiches elles-mêmes.
 *
 * ⛔ On cherche « bramm » sur un motif PLUS LARGE que le cas redouté (`\mbramm`
 * seul raterait « Bramm, » ou « Bramm! ») : ILIKE '%bramm%' attrape tout, et le
 * témoin positif ci-dessous prouve que la recherche mord vraiment.
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

/* 1. Les fiches dont le nom contient « bram », quelle que soit l'orthographe. */
const fiches = await sql`
  SELECT id, nom, joueur_prenom FROM characters WHERE nom ILIKE '%bram%' ORDER BY id`
console.log('=== fiches dont le nom contient « bram » ===')
for (const f of fiches) console.log(`  [${f.id}] ${f.nom}  (joueur : ${f.joueur_prenom ?? 'NULL'})`)

/* 2. Témoin positif : la recherche large trouve-t-elle quelque chose du tout ?
      Si « bram » ne rend rien non plus, c'est l'instrument qu'il faut accuser. */
const temoin = await sql`
  SELECT count(*)::int AS n FROM character_story_chapters WHERE contenu ILIKE '%bram%'`
console.log(`\n=== témoin : chapitres d'histoire contenant « bram » : ${temoin[0].n} ===`)

/* 3. Le cas redouté : « bramm », dans chaque table de texte libre. */
const doubleM = await sql`
  SELECT 'character_story_chapters' AS tbl, personnage_id::text AS cle, titre AS repere
    FROM character_story_chapters WHERE contenu ILIKE '%bramm%' OR titre ILIKE '%bramm%'
  UNION ALL
  SELECT 'characters.nom', id::text, nom FROM characters WHERE nom ILIKE '%bramm%'
  UNION ALL
  SELECT 'characters.historique', id::text, nom FROM characters WHERE historique ILIKE '%bramm%'
  UNION ALL
  SELECT 'character_notes', personnage_id::text, left(coalesce(titre, ''), 60)
    FROM character_notes WHERE contenu ILIKE '%bramm%' OR titre ILIKE '%bramm%'
  UNION ALL
  SELECT 'character_journal', personnage_id::text, left(description, 60)
    FROM character_journal WHERE description ILIKE '%bramm%'`
console.log(`\n=== occurrences de « bramm » (double m) : ${doubleM.length} ===`)
for (const l of doubleM) console.log(`  ${l.tbl} [${l.cle}] ${l.repere}`)
if (doubleM.length === 0) console.log('  (aucune — rien à corriger)')

/* 4. Et le compte des mentions de Bram dans chaque histoire déposée. */
const parFiche = await sql`
  SELECT c.id, c.nom,
         count(*)::int AS chapitres,
         sum(CASE WHEN ch.contenu ILIKE '%bram%' THEN 1 ELSE 0 END)::int AS chap_avec_bram
  FROM characters c
  JOIN character_story_chapters ch ON ch.personnage_id = c.id
  GROUP BY c.id, c.nom ORDER BY c.id`
console.log('\n=== histoires déposées, et celles qui parlent de Bram ===')
for (const l of parFiche) {
  console.log(`  [${l.id}] ${l.nom} : ${l.chapitres} chapitres, dont ${l.chap_avec_bram} nomment Bram`)
}

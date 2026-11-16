/**
 * MESURE DE LA TABLE `classes` — et de ce que l'interface en montre.
 *
 *   node scripts/mesure-classes-rayon.mjs
 *
 * Question posée par André le 16 novembre 2026 : « Je ne vois pas la classe
 * Dracologist...? »
 *
 * La table `classes` n'est PAS un rayon de la Bibliothèque : c'est une table de
 * rattachement, et `saveCharacter` y crée une ligne à la volée pour tout nom de
 * classe qu'elle ne connaît pas (actions/character.ts, findOrCreate). Les
 * sélecteurs du formulaire, eux, lisent les modules TypeScript
 * (CLASSES_DND35 + CLASSES_BASE_SUPPLEMENTS + PRESTIGE_CLASSES).
 *
 * D'où la mesure : la ligne en base, ce qu'elle porte, qui la porte, et ce qui
 * la distingue des lignes nées du même import.
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

const classes = await sql`
  SELECT c.id, c.nom, c.de_vie, c.bba_progression, c.competences_par_niveau,
         length(coalesce(c.description, '')) AS len_desc,
         (SELECT count(*) FROM class_features f WHERE f.classe_id = c.id) AS pouvoirs,
         (SELECT count(*) FROM character_classes cc WHERE cc.classe_id = c.id) AS porteurs,
         (SELECT count(*) FROM class_skill_list s WHERE s.classe_id = c.id) AS comp_classe,
         (SELECT count(*) FROM spell_class_levels scl WHERE scl.classe_id = c.id) AS sorts
  FROM classes c ORDER BY c.id`

console.log(`=== table classes : ${classes.length} lignes ===`)
for (const c of classes) {
  console.log(
    String(c.id).padStart(3),
    String(c.nom).padEnd(26),
    String(c.de_vie).padEnd(4),
    'bba=' + String(c.bba_progression).padEnd(8),
    'c/niv=' + String(c.competences_par_niveau).padStart(2),
    'desc=' + String(c.len_desc).padStart(5),
    'pouv=' + String(c.pouvoirs).padStart(3),
    'compCl=' + String(c.comp_classe).padStart(3),
    'sorts=' + String(c.sorts).padStart(5),
    'PORTEURS=' + c.porteurs,
  )
}

const vides = classes.filter(c => Number(c.porteurs) === 0)
console.log(`\n--- lignes que PERSONNE ne porte : ${vides.length} ---`)
console.log(vides.map(c => `[${c.id}] ${c.nom}`).join(' · ') || '(aucune)')

const fiche4 = await sql`
  SELECT cc.id, cl.id AS classe_id, cl.nom AS classe, cc.niveau
  FROM character_classes cc
  JOIN classes cl ON cl.id = cc.classe_id
  WHERE cc.personnage_id = 4 ORDER BY cc.id`
console.log('\n=== les lignes de classe de DracoVick [4] ===')
for (const l of fiche4) console.log(`  ${l.classe} ${l.niveau} (classes.id=${l.classe_id})`)

const dracoDons = await sql`
  SELECT f.nom, cf.notes FROM character_feats cf
  JOIN feats f ON f.id = cf.feat_id
  WHERE cf.personnage_id = 4 AND (f.nom ILIKE '%cercle%' OR cf.notes ILIKE '%cercle%')
  ORDER BY cf.id`
console.log(`\n=== lignes de don « cercle » sur la fiche 4 : ${dracoDons.length} ===`)
for (const d of dracoDons) console.log(`  ${d.nom} — ${String(d.notes ?? '').slice(0, 90)}`)

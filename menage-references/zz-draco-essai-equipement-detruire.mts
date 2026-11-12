/**
 * Destruction de la fiche d'essai de l'équipement courant (drizzle/0017).
 *
 * ⚠ Les 21 tables qui portent un `personnage_id` y passent, dans l'ordre, avant
 * la fiche elle-même : en oublier une fait échouer le DELETE final sur sa
 * contrainte et laisse un personnage squelette insupprimable (c'est arrivé le
 * 2026-10-04). `character_equipment` en fait partie depuis cette livraison.
 *
 * ⚠ Le contrôle de fin porte sur un TÉMOIN : plus AUCUNE ligne d'équipement ne
 * doit subsister en base, sur aucune fiche — personne d'autre n'en avait.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
  .match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, ''))

const [perso]: any[] = await sql`SELECT id, nom FROM characters WHERE nom = 'ZZ-Essai-Equipement' LIMIT 1`
if (!perso) {
  console.log('Aucune fiche « ZZ-Essai-Equipement » — déjà détruite.')
} else {
  console.log('Fiche trouvée :', perso)
  const id = perso.id
  const tables = [
    'character_ability_scores', 'character_combat_stats', 'character_saving_throws',
    'character_classes', 'character_skills', 'character_feats', 'character_weapons',
    'character_armor', 'character_magic_items', 'character_potions', 'character_scrolls',
    'character_currency', 'character_gems', 'character_equipment', 'character_languages',
    'character_spells', 'character_spell_effects', 'character_creatures',
    'character_companions', 'character_notes', 'character_journal',
  ]
  for (const t of tables) {
    // ⚠ `sql(...)` en appel direct est refusé par @neondatabase/serverless :
    // il n'accepte que la forme template. `sql.query` est la porte pour un
    // nom de table interpolé — qui vient d'une liste écrite ici, pas du dehors.
    const r: any = await sql.query(`DELETE FROM ${t} WHERE personnage_id = $1 RETURNING id`, [id])
    if (r.length) console.log(`  ${t} : ${r.length} ligne(s)`)
  }
  await sql`DELETE FROM characters WHERE id = ${id}`
  console.log('Fiche détruite.')
}

const reste = (await sql`SELECT count(*)::int n FROM characters WHERE nom LIKE 'ZZ-Essai%'`)[0].n
const equip = (await sql`SELECT count(*)::int n FROM character_equipment`)[0].n
const fiches = (await sql`SELECT count(*)::int n FROM characters`)[0].n
// Témoin d'orphelins : une ligne qui ne mène à aucune fiche.
const orphelins = (await sql`
  SELECT count(*)::int n FROM character_equipment e
  WHERE NOT EXISTS (SELECT 1 FROM characters c WHERE c.id = e.personnage_id)`)[0].n
console.log(`\nfiches d'essai restantes : ${reste} (0 attendu)`)
console.log(`lignes d'équipement en base : ${equip} (0 attendu — aucune vraie fiche n'en porte encore)`)
console.log(`lignes d'équipement orphelines : ${orphelins} (0 attendu)`)
console.log(`personnages : ${fiches} (74 attendu)`)
if (reste !== 0 || equip !== 0 || orphelins !== 0 || fiches !== 74) process.exitCode = 1

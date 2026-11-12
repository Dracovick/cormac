/**
 * Détruit la fiche d'essai 102 (ZZ-Essai-ChoixFinesse) et PROUVE qu'il ne reste
 * aucune ligne orpheline.
 *
 * On ne liste pas les tables de mémoire : on demande à information_schema
 * TOUTES celles qui portent une colonne `personnage_id`. Une table oubliée est
 * exactement ce qui est arrivé à `deleteCharacter` le 4 octobre 2026 — trois
 * tables laissées derrière.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
  .match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, ''))

const ID = 102
const [fiche]: any[] = await sql`SELECT id, nom FROM characters WHERE id = ${ID}`
if (!fiche) { console.log('Fiche déjà absente.'); process.exit(0) }
if (!fiche.nom.startsWith('ZZ-Essai-')) {
  console.log(`⛔ REFUS : [${ID}] s'appelle « ${fiche.nom} », ce n'est pas une fiche d'essai.`)
  process.exit(1)
}

const tables: any[] = await sql`
  SELECT table_name FROM information_schema.columns
  WHERE column_name = 'personnage_id' AND table_schema = 'public'
  ORDER BY table_name`
console.log(`${tables.length} tables portent une colonne personnage_id.`)

for (const t of tables) {
  const n: any[] = await sql.query(`DELETE FROM "${t.table_name}" WHERE personnage_id = $1 RETURNING 1`, [ID])
  if (n.length) console.log(`  − ${t.table_name} : ${n.length} ligne(s)`)
}
await sql`DELETE FROM characters WHERE id = ${ID}`

let restes = 0
for (const t of tables) {
  const [c]: any[] = await sql.query(`SELECT count(*)::int n FROM "${t.table_name}" WHERE personnage_id = $1`, [ID])
  restes += c.n
}
const [c]: any[] = await sql`SELECT count(*)::int n FROM characters`
console.log(`\nLignes orphelines restantes : ${restes} (attendu 0) · fiches en base : ${c.n}`)

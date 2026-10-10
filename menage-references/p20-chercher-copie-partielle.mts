/**
 * Où la « copie partielle du volume 3 » est-elle ÉCRITE dans la base ?
 *
 * Elle quitte le rayon le 2026-10-10 (décision d'André : « enlève l'autre qui
 * est incomplet »). Corriger une donnée périme la prose qui la décrivait, et
 * cette prose peut vivre loin de la table qu'on modifie — c'est pourquoi on
 * balaie TOUTES les colonnes de texte de la base plutôt que de relire ce qu'on
 * vient d'écrire.
 *
 * Relevé du 2026-10-10 : seules `game_books.note` #3 (le volume 3, qui renvoyait
 * à la copie) et #5 (la copie elle-même) en parlaient. La fiche du carquois de
 * Cormac (magic_items #41) cite l'Encyclopedia Magica mais jamais cette copie :
 * rien à y corriger.
 *
 * Usage : ./node_modules/.bin/tsx menage-references/p20-chercher-copie-partielle.mts
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (!k?.trim() || k.startsWith('#')) continue
  process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL!)

// ⚠ Motifs DISCRIMINANTS. « partiel » seul rend 81 lignes dont presque toutes
// sont des jets de sauvegarde (« Vigueur, partiel ») : un motif trop large noie
// la trouvaille au lieu de la montrer.
const MOTIFS = [
  'copie partielle', '140 page', 'vol III', 'tsr02157', 'P–R',
  'encyclopedia-magica-3-partiel',
]

const colonnes = (await sql`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND data_type IN ('text', 'character varying')
  ORDER BY table_name, column_name
`) as { table_name: string; column_name: string }[]

console.log(`${colonnes.length} colonnes de texte examinées\n`)
let trouvailles = 0
for (const { table_name, column_name } of colonnes) {
  for (const motif of MOTIFS) {
    // ⚠ sql.query, pas sql`…` : le client Neon n'accepte les placeholders $1
    // que par cette voie, et refuse l'appel classique avec une erreur explicite.
    const lignes = (await sql.query(
      `SELECT id, LEFT("${column_name}", 220) AS extrait
         FROM "${table_name}" WHERE "${column_name}" ILIKE $1 LIMIT 5`,
      [`%${motif}%`],
    )) as any[]
    for (const l of lignes) {
      trouvailles++
      console.log(`${table_name}.${column_name} #${l.id}  [${motif}]`)
      console.log(`   ${String(l.extrait).replace(/\s+/g, ' ').slice(0, 200)}\n`)
    }
  }
}
console.log(trouvailles ? `${trouvailles} occurrence(s)` : 'aucune occurrence')

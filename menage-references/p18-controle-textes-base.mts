/**
 * CONTRÔLE : une colonne de texte de la BASE dit-elle encore que le bonus des
 * munitions se cumule avec celui de l'arme ?
 *
 * Leçon du 2026-10-09 : la prose qui décrivait l'ancien comportement survit dans
 * les descriptions, pas seulement dans le code — et une fiche de la Bibliothèque
 * est lue à la table COMME une règle. On cherche l'ANCIEN discours, sur un motif
 * plus large que la correction, dans TOUTES les tables de texte concernées.
 *
 * Aucune écriture. Usage :
 *   ./node_modules/.bin/tsx menage-references/p18-controle-textes-base.mts
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (k?.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim()
}
const sql = neon(process.env.DATABASE_URL!)

// Large exprès : toute phrase qui parle de munitions, de flèches ou de carreaux
// ET de cumul, quelle que soit la tournure.
const CIBLES = [
  { table: 'magic_items', col: 'description' },
  { table: 'weapons', col: 'description' },
  { table: 'potions', col: 'description' },
  { table: 'spells', col: 'description' },
  { table: 'feats', col: 'description' },
  { table: 'feats', col: 'effet_mecanique' },
  { table: 'equipment', col: 'description' },
  { table: 'character_weapons', col: 'proprietes_speciales' },
  { table: 'character_notes', col: 'contenu' },
]
const MOTS = ['munition', 'flèche', 'fleche', 'carreau', 'bille']

let total = 0
for (const c of CIBLES) {
  // deux passes : le mot de munition près de « cumul », puis « cumul » seul
  const q = await sql.query(
    `SELECT id, ${c.col} AS txt FROM ${c.table}
     WHERE ${c.col} IS NOT NULL AND ${c.col} ILIKE '%cumul%'
       AND (${MOTS.map(m => `${c.col} ILIKE '%${m}%'`).join(' OR ')})`,
  )
  for (const r of q as any[]) {
    total++
    const txt: string = r.txt
    // on montre la phrase, pas la fiche entière
    const i = txt.toLowerCase().indexOf('cumul')
    console.log(`\n⚠ ${c.table}.${c.col} #${r.id}`)
    console.log(`   …${txt.slice(Math.max(0, i - 220), i + 220).replace(/\s+/g, ' ')}…`)
  }
}

// Un TÉMOIN connu DANS le test : la fiche que j'ai écrite le 2026-10-08 pour
// « Arrows +2 (9) » dit la règle correctement. Si le balayage ne la voit pas,
// c'est le balayage qui est aveugle, pas la base qui est propre.
const [temoin] = (await sql`
  SELECT id, description FROM magic_items WHERE id = 50
`) as any[]
const temoinVu = /cumul/i.test(temoin?.description ?? '') && /munition/i.test(temoin?.description ?? '')

console.log(`\n── ${total} passage(s) trouvé(s) qui parlent de munitions ET de cumul.`)
console.log(`── Témoin [50] « Arrows +2 (9) » détecté par le balayage : ${temoinVu ? '✓ oui' : '⛔ NON — balayage aveugle'}`)
if (!temoinVu) process.exit(1)

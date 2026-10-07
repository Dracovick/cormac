// Les quatre sorts d'alignement sont tenus en base sous une entrée groupée
// (« Cercle magique contre la Loi/le Bien/le Chaos/le Mal »). Leur école a hérité
// du descripteur d'UNE seule version — « Abjuration [Chaos] » sur une entrée qui
// couvre les quatre, ce qui induit en erreur. On généralise le descripteur.
// Usage : npx tsx menage-references/p4-groupees-ecole.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')

const r = await sql`SELECT id, nom, ecole FROM spells
  WHERE nom LIKE '%/le Bien/le Chaos/le Mal' OR nom LIKE '%/du Bien/du Chaos/du Mal' ORDER BY nom` as any[]
for (const s of r) {
  const neuf = String(s.ecole ?? '').replace(/\[(Loi|Bien|Chaos|Mal)\]/i, '[Loi, Bien, Chaos ou Mal]')
  console.log(`[${s.id}] ${s.nom}\n    ${s.ecole}  →  ${neuf}`)
  if (appliquer && neuf !== s.ecole) await sql`UPDATE spells SET ecole = ${neuf} WHERE id = ${s.id}`
}
console.log(appliquer ? '\nappliqué' : '\n[APERÇU] relancer avec --appliquer')

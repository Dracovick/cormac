import fs from 'fs'
import { neon } from '@neondatabase/serverless'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

// Les 191 compétences telles qu'elles étaient AVANT le ménage
const avant = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/export-avant-2.json', 'utf8')).skills
console.log(`=== BENEFICE RETROACTIF : la regle appliquee aux ${avant.length} competences d avant le menage ===`)
const m = new Map()
for (const s of avant) { const k = norm(s.nom); if (!m.has(k)) m.set(k, []); m.get(k).push(s.nom) }
const groupes = [...m.entries()].filter(([, v]) => v.length > 1)
const evitees = groupes.reduce((acc, [, v]) => acc + v.length - 1, 0)
console.log(`  ${groupes.length} groupes rapproches, soit ${evitees} entrees en double qui n auraient jamais ete creees :`)
for (const [, v] of groupes) console.log(`     ${v.map(x => `"${x}"`).join('  =  ')}`)

console.log('\n=== DIVERGENCES base / code sur la caracteristique ===')
const { COMPETENCES_DND35 } = await import('file:///X:/Claude-Tools/cormac/menage-references/skills-copie.mjs')
const enBase = await sql`select nom, caracteristique from skills order by nom`
let div = 0
for (const b of enBase) {
  const ref = COMPETENCES_DND35.find(c => c.nom === b.nom)
  if (ref && ref.caracteristique !== b.caracteristique) { console.log(`     "${b.nom}" : base=${b.caracteristique} code=${ref.caracteristique}`); div++ }
}
console.log(div ? `  ${div} divergences` : '  aucune divergence — ecran et PDF afficheront la meme caracteristique')

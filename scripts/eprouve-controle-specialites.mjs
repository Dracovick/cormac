/* Éprouve les contrôles du repli de statut : on casse le code exprès, et on
 * vérifie que les contrôles MORDENT. Un contrôle qui reste vert sur du code
 * cassé ne prouve rien.
 *
 *   node scripts/eprouve-controle-specialites.mjs
 *
 * Le fichier est restauré à l'identique à la fin, quoi qu'il arrive — empreinte
 * relue et comparée.
 */
import fs from 'node:fs'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'

const CIBLE = 'X:/Claude-Tools/cormac/src/lib/dnd35/skills.ts'
const original = fs.readFileSync(CIBLE, 'utf8')
const empreinte = crypto.createHash('sha256').update(original).digest('hex')

const MUTATIONS = [
  {
    nom: 'le garde du tableau vide est retiré de estCompetenceDeClasse',
    de: "  const refs = refsDeStatut(nom)\n  if (refs.length === 0) return false\n  return refs.every(r => r.classesCompetence.some(cc => classesDuPersonnage.includes(cc)))",
    vers: "  const refs = refsDeStatut(nom)\n  return refs.every(r => r.classesCompetence.some(cc => classesDuPersonnage.includes(cc)))",
  },
  {
    nom: 'l’unanimité des sœurs devient « au moins une »',
    de: "  return refs.every(r => r.classesCompetence.some(cc => classesDuPersonnage.includes(cc)))",
    vers: "  return refs.some(r => r.classesCompetence.some(cc => classesDuPersonnage.includes(cc)))",
  },
  {
    nom: 'le repli 2 (les sœurs) est supprimé',
    de: "  return COMPETENCES_DND35.filter(c => c.nom.startsWith(`${base} (`))",
    vers: "  return []",
  },
  {
    nom: 'caracteristiqueDe se met à suivre le repli — un total bougerait',
    de: "export function caracteristiqueDe(nom: string, caracteristiqueEnBase?: string | null): string {\n  return getCompetenceRef(nom)?.caracteristique ?? caracteristiqueEnBase ?? '—'\n}",
    vers: "export function caracteristiqueDe(nom: string, caracteristiqueEnBase?: string | null): string {\n  return refsDeStatut(nom)[0]?.caracteristique ?? caracteristiqueEnBase ?? '—'\n}",
  },
  {
    nom: 'le garde du tableau vide est retiré de formationRequiseDe',
    de: "  const refs = refsDeStatut(nom)\n  if (refs.length === 0) return false\n  return refs.every(r => r.formationRequise)",
    vers: "  const refs = refsDeStatut(nom)\n  return refs.every(r => r.formationRequise)",
  },
]

let mordues = 0
for (const [i, m] of MUTATIONS.entries()) {
  if (!original.includes(m.de)) { console.log(`❌ mutation ${i + 1} : motif introuvable, rien n’a été muté — « ${m.nom} »`); continue }
  fs.writeFileSync(CIBLE, original.replace(m.de, m.vers), 'utf8')
  let sortie = ''
  let code = 0
  try {
    sortie = execSync('npx tsx scripts/controle-specialites-competences.mts', { cwd: 'X:/Claude-Tools/cormac', encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    code = e.status ?? 1
    sortie = (e.stdout ?? '') + (e.stderr ?? '')
  }
  const nbEchecs = (sortie.match(/❌/g) ?? []).length
  if (code !== 0 && nbEchecs > 0) { mordues++; console.log(`✅ mutation ${i + 1} mord — ${nbEchecs} contrôle(s) en échec — « ${m.nom} »`) }
  else console.log(`❌ mutation ${i + 1} PASSE AU VERT sur du code cassé — « ${m.nom} »`)
}

fs.writeFileSync(CIBLE, original, 'utf8')
const apres = crypto.createHash('sha256').update(fs.readFileSync(CIBLE, 'utf8')).digest('hex')
console.log(`\nfichier restauré : ${apres === empreinte ? '✅ identique à l’original' : '❌ DIFFÉRENT — vérifier à la main'}`)
console.log(`${mordues} / ${MUTATIONS.length} mutations mordues.`)
if (mordues !== MUTATIONS.length || apres !== empreinte) process.exit(1)

/**
 * Croise la liste de compétences de classe EN DUR dans le code
 * (src/lib/dnd35/skills.ts, champ `classesCompetence`) avec le relevé du SRD
 * français (p12-classes-competences.json).
 *
 * Pourquoi ce contrôle avant d'écrire quoi que ce soit : c'est exactement la
 * maladie trouvée dans le menu des armes et dans celui des dons — une liste
 * saisie à la main dans le code, jamais recoupée au livre, qui décide d'une
 * règle. Ici elle décide du PLAFOND DE RANGS au formulaire de création
 * (niveau + 3 en compétence de classe, la moitié hors classe) et de la case
 * ■/□ de la feuille imprimée. Une entrée manquante bride un personnage; une
 * entrée en trop lui laisse acheter des rangs illégaux.
 *
 * Lecture seule. Rien n'est écrit.
 *
 * Usage : npx tsx menage-references/p12-controle-liste-code.mts
 */
import fs from 'node:fs'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills.ts'

const releve = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p12-classes-competences.json', 'utf8')
).classes as Record<string, { competences: { nom: string; precision: string | null }[]; pointsNiveau1: number }>

/**
 * Apostrophe droite (code) contre typographique (livre) : sans ça le
 * comparateur annonce « Utilisation d'objets magiques » à la fois MANQUANTE et
 * EN TROP — un faux écart des deux côtés. Déjà vu au rattachement des armes.
 */
const apos = (s: string) => s.replace(/[‘’ʼ]/g, "'")

/** Le code nomme les spécialisations; le livre nomme la compétence mère. */
function mere(nom: string): string {
  const n = apos(nom)
  const i = n.indexOf(' (')
  return i > 0 && n.endsWith(')') ? n.slice(0, i) : n
}

/** Ce que le code accorde : classe → ensemble de compétences mères. */
const parCode = new Map<string, Set<string>>()
for (const c of COMPETENCES_DND35) {
  for (const classe of c.classesCompetence) {
    if (!parCode.has(classe)) parCode.set(classe, new Set())
    parCode.get(classe)!.add(mere(c.nom))
  }
}

/** Ce que le livre accorde. */
const parLivre = new Map<string, Set<string>>()
for (const [classe, v] of Object.entries(releve)) {
  parLivre.set(classe, new Set(v.competences.map(c => apos(c.nom))))
}

const classes = [...new Set([...parCode.keys(), ...parLivre.keys()])].sort((a, b) => a.localeCompare(b, 'fr'))

let totalManquantes = 0
let totalEnTrop = 0
for (const classe of classes) {
  const code = parCode.get(classe) ?? new Set<string>()
  const livre = parLivre.get(classe) ?? new Set<string>()
  const manquantes = [...livre].filter(n => !code.has(n)).sort((a, b) => a.localeCompare(b, 'fr'))
  const enTrop = [...code].filter(n => !livre.has(n)).sort((a, b) => a.localeCompare(b, 'fr'))
  totalManquantes += manquantes.length
  totalEnTrop += enTrop.length
  if (!manquantes.length && !enTrop.length) {
    console.log(`✅ ${classe} — ${livre.size} compétences, le code est d'accord`)
    continue
  }
  console.log(`\n⚠️  ${classe} — livre ${livre.size}, code ${code.size}`)
  if (manquantes.length) console.log(`    MANQUE au code (le personnage est bridé) : ${manquantes.join(', ')}`)
  if (enTrop.length) console.log(`    EN TROP au code (rangs illégaux possibles) : ${enTrop.join(', ')}`)
}

console.log(`\n=== TOTAL : ${totalManquantes} manquantes, ${totalEnTrop} en trop ===`)

// Les points de compétence par niveau, l'autre moitié de la règle.
console.log('\n=== POINTS DE COMPÉTENCE AU NIVEAU 1 (× 4) — livre vs table `classes` ===')
const { neon } = await import('@neondatabase/serverless')
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const enBase = await sql`SELECT nom, competences_par_niveau FROM classes ORDER BY nom` as any[]
const parNom = new Map(enBase.map(c => [c.nom, c.competences_par_niveau]))
for (const [classe, v] of Object.entries(releve)) {
  const base = parNom.get(classe)
  const accord = base === v.pointsNiveau1 ? '✅' : base === null || base === undefined ? '— (vide en base)' : `⚠️  base ${base}`
  console.log(`  ${classe.padEnd(12)} livre ${v.pointsNiveau1}   ${accord}`)
}

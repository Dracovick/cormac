/**
 * Sème `class_skill_list` — les compétences de classe des 11 classes de base.
 * La table était VIDE : le Grimoire ne savait pas dire « de classe » ou
 * « hors classe », et c'est ce qui décide du plafond de rangs (niveau + 3 en
 * classe, la moitié hors classe).
 *
 * SOURCE : p12-classes-competences.json, relevé du SRD 3.5 français (DRS 03a
 * et 03b), où le livre écrit les listes en prose.
 *
 * Le skill_id pointe toujours vers une entrée de CATALOGUE. Quand le livre
 * spécialise — le prêtre a « Connaissances (religion) », pas toutes les
 * Connaissances — la spécialisation va dans la colonne `precision`. Sans elle
 * on rendrait de classe à un prêtre des Connaissances (nature) qu'il n'obtient
 * qu'avec le domaine de la Faune ou de la Flore.
 *
 * Idempotent : un index unique (classe, compétence, précision) et un
 * ON CONFLICT DO NOTHING.
 *
 * Usage : npx tsx menage-references/p12-semer-class-skills.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

const releve = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p12-classes-competences.json', 'utf8')
).classes as Record<string, { competences: { nom: string; precision: string | null }[]; pointsNiveau1: number }>

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[\u2018\u2019\u02bc]/g, "'")
   .replace(/\s+/g, ' ').trim().toLowerCase()

const classes = await sql`SELECT id, nom, competences_par_niveau FROM classes` as any[]
const parClasse = new Map(classes.map(c => [norm(c.nom), c]))
const cataloguees = await sql`SELECT id, nom FROM skills WHERE est_catalogue` as any[]
const parSkill = new Map(cataloguees.map(s => [norm(s.nom), s]))

const aEcrire: { classeId: number; classe: string; skillId: number; skill: string; precision: string | null }[] = []
const erreurs: string[] = []

for (const [classe, v] of Object.entries(releve)) {
  const c = parClasse.get(norm(classe))
  if (!c) { erreurs.push(`classe « ${classe} » absente de la table classes`); continue }
  for (const comp of v.competences) {
    const s = parSkill.get(norm(comp.nom))
    if (!s) { erreurs.push(`compétence « ${comp.nom} » (${classe}) absente du catalogue`); continue }
    aEcrire.push({ classeId: c.id, classe, skillId: s.id, skill: s.nom, precision: comp.precision })
  }
}

if (erreurs.length) {
  console.error('ARRÊT — rien écrit :')
  for (const e of erreurs) console.error(`  ${e}`)
  process.exit(1)
}

const [avant] = await sql`SELECT count(*)::int n FROM class_skill_list` as any[]
console.log(`=== COMPÉTENCES DE CLASSE ${ECRIRE ? '(ÉCRITURE)' : '(essai à blanc)'} ===`)
console.log(`  class_skill_list : ${avant.n} ligne(s) avant · ${aEcrire.length} associations relevées au livre\n`)

for (const classe of Object.keys(releve).sort((a, b) => a.localeCompare(b, 'fr'))) {
  const lignes = aEcrire.filter(a => a.classe === classe)
  const avecPrecision = lignes.filter(l => l.precision)
  console.log(`  ${classe.padEnd(12)} ${String(lignes.length).padStart(2)} compétences` +
    (avecPrecision.length ? `  (dont ${avecPrecision.map(l => `${l.skill} (${l.precision})`).join(', ')})` : ''))
}

if (!ECRIRE) {
  console.log('\nEssai à blanc. Relancer avec --ecrire pour appliquer.')
  process.exit(0)
}

for (const a of aEcrire) {
  await sql`
    INSERT INTO class_skill_list (classe_id, skill_id, "precision")
    VALUES (${a.classeId}, ${a.skillId}, ${a.precision})
    ON CONFLICT DO NOTHING`
}

// Les points de compétence par niveau, l'autre moitié de la règle : la table
// `classes` dit 2 pour le druide et le moine, le livre dit 4. Un personnage
// créé avec 2 est bridé de moitié dès le niveau 1.
const corriges: string[] = []
for (const [classe, v] of Object.entries(releve)) {
  const c = parClasse.get(norm(classe))!
  if (c.competences_par_niveau !== v.pointsNiveau1) {
    await sql`UPDATE classes SET competences_par_niveau = ${v.pointsNiveau1} WHERE id = ${c.id}`
    corriges.push(`${classe} : ${c.competences_par_niveau} → ${v.pointsNiveau1}`)
  }
}

const [apres] = await sql`
  SELECT count(*)::int n,
    (SELECT count(*)::int FROM class_skill_list csl
      WHERE NOT EXISTS (SELECT 1 FROM skills s WHERE s.id = csl.skill_id AND s.est_catalogue)) hors_catalogue
  FROM class_skill_list` as any[]
console.log(`\n✅ Écrit. class_skill_list : ${apres.n} lignes · lien hors catalogue : ${apres.hors_catalogue}`)
if (corriges.length) console.log(`   points de compétence corrigés → ${corriges.join(' · ')}`)

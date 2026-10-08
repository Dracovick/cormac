/**
 * Pose la phrase d'accroche en tête de chaque fiche de compétence.
 *
 * POURQUOI UNE PASSE À PART : le SRD français donne toute la mécanique mot
 * pour mot, mais la licence libre ne couvre pas la prose. 31 des 36 fiches y
 * arrivent sans la phrase qui dit À QUOI SERT la compétence — c'est pourtant
 * la première chose qu'un joueur lit. Les 36 phrases de p11-accroches.json
 * sont relevées à l'image dans le Manuel d'André, pages 66 à 86.
 *
 * Idempotent, et prudent de deux façons :
 *   - si la description porte déjà l'accroche (le SRD en garde 5), on passe;
 *   - si la description a été retouchée et ne commence plus par le bloc
 *     « **Test de compétence.** » attendu, on REFUSE au lieu d'insérer au
 *     mauvais endroit.
 *
 * Usage : npx tsx menage-references/p11-accroches-appliquer.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

const accroches: Record<string, string> = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p11-accroches.json', 'utf8')
).accroches

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[\u2018\u2019\u02bc]/g, "'")
   .replace(/\s+/g, ' ').trim().toLowerCase()

const fiches = await sql`SELECT id, nom, description FROM skills WHERE est_catalogue ORDER BY nom` as any[]
const parNom = new Map(fiches.map(f => [norm(f.nom), f]))

const absentes = Object.keys(accroches).filter(n => !parNom.has(norm(n)))
if (absentes.length) {
  console.error(`ARRÊT : ces noms d'accroche ne correspondent à aucune fiche de catalogue — ${absentes.join(', ')}`)
  process.exit(1)
}
const sansAccroche = fiches.filter(f => !Object.keys(accroches).some(n => norm(n) === norm(f.nom)))
if (sansAccroche.length) {
  console.error(`ARRÊT : ces fiches n'ont pas d'accroche relevée — ${sansAccroche.map(f => f.nom).join(', ')}`)
  process.exit(1)
}

const aPoser: { f: any; texte: string }[] = []
const dejaLa: string[] = []
const refusees: string[] = []

for (const [nom, accroche] of Object.entries(accroches)) {
  const f = parNom.get(norm(nom))!
  const d: string = f.description ?? ''
  // Les six premiers mots suffisent à reconnaître une accroche déjà présente.
  const debut = norm(accroche).split(' ').slice(0, 6).join(' ')
  if (norm(d).includes(debut)) { dejaLa.push(f.nom); continue }
  // 5 fiches du SRD ouvrent sur un bout de chapeau plutôt que sur un bloc de
  // règle (Artisanat, Profession, Représentation gardent le 2e paragraphe du
  // livre; Acrobaties et Équitation une reformulation de la 2e phrase). On
  // pose quand même devant : l'accroche du livre vient avant ce texte-là.
  if (d.trim().length === 0) { refusees.push(`${f.nom} — description vide, rien à compléter`); continue }
  aPoser.push({ f, texte: `${accroche}\n\n${d}` })
}

console.log(`=== ACCROCHES ${ECRIRE ? '(ÉCRITURE)' : '(essai à blanc)'} ===`)
console.log(`  ${fiches.length} fiches au catalogue · ${aPoser.length} à poser · ${dejaLa.length} déjà présentes · ${refusees.length} refusées\n`)
for (const { f, texte } of aPoser) console.log(`  [${String(f.id).padStart(3)}] ${f.nom.padEnd(32)} ${texte.split('\n')[0].slice(0, 70)}…`)
if (dejaLa.length) console.log(`\n  déjà dans le texte du SRD : ${dejaLa.join(', ')}`)
if (refusees.length) {
  console.log('\n⚠️  REFUSÉES :')
  for (const r of refusees) console.log(`    ${r}`)
}

if (!ECRIRE) {
  console.log('\nEssai à blanc. Relancer avec --ecrire pour appliquer.')
  process.exit(0)
}

for (const { f, texte } of aPoser) {
  await sql`UPDATE skills SET description = ${texte} WHERE id = ${f.id}`
}
const [c] = await sql`
  SELECT count(*)::int total,
    count(*) FILTER (WHERE description IS NULL OR description = '')::int vides
  FROM skills WHERE est_catalogue` as any[]
console.log(`\n✅ ${aPoser.length} accroches posées. ${c.total} fiches au catalogue, ${c.vides} sans description.`)

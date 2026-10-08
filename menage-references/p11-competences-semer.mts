/**
 * Sème le catalogue des 36 compétences du Manuel dans `skills`.
 *
 * RÈGLE D'OR : aucune ligne existante n'est supprimée, et aucune valeur déjà
 * saisie par André n'est écrasée. La table contient ses 88 lignes FileMaker
 * (« Scrutation », « connaissance des femmes », « Heal (2 pv x jour x niv.) »),
 * pas un catalogue — et les 88 sont toutes portées par un personnage.
 *
 * Appariement d'une entrée du livre à une ligne existante : le nom NORMALISÉ
 * (casse, accents, apostrophes typographiques, espaces) est identique. Rien
 * d'autre. Pas de recherche floue : « Dissimulation » ressemble à
 * « Discrétion » et ce sont deux compétences différentes de deux éditions
 * différentes, toutes deux portées (4 et 17 personnages). Les rapprochements
 * de ce genre sont des décisions de MJ, pas de scribe — ils partent au rapport.
 *
 * CE QUI EST ÉCRIT sur une ligne adoptée :
 *   - est_catalogue = true;
 *   - malus_armure (colonne neuve de 0009, donc jamais saisie par André);
 *   - description, SEULEMENT si elle est vide (elles le sont toutes : 0/88).
 * CE QUI N'EST PAS ÉCRIT : la caractéristique et la formation requise, même
 * quand elles contredisent le livre. Ce sont des règles de table : elles
 * passent par p11-corrections.mts, qui dit ce qu'il change et refuse si la
 * valeur n'est plus celle qu'il attendait.
 *
 * Usage : npx tsx menage-references/p11-competences-semer.mts [--ecrire]
 * Sans --ecrire : essai à blanc, rien n'est touché.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

type Fiche = {
  nom: string
  caracteristique: string
  formationRequise: boolean
  malusArmure: boolean
  description: string
}

const livre: Fiche[] = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p11-competences-srd.json', 'utf8')
).competences

/** Casse, accents, apostrophes typographiques, espaces multiples. */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[\u2018\u2019\u02bc]/g, "'")
   .replace(/\s+/g, ' ').trim().toLowerCase()

/** La base écrit DEX/INT/SAG; le livre écrit Dex/Int/Sag. */
const carac = (s: string) => (s === 'Aucune' ? '—' : s.toUpperCase())

const existantes = await sql`
  SELECT s.id, s.nom, s.caracteristique, s.formation_requise, s.description, s.est_catalogue, s.malus_armure,
    (SELECT count(*)::int FROM character_skills cs WHERE cs.skill_id = s.id) porteurs
  FROM skills s ORDER BY s.id` as any[]

const parNom = new Map<string, any[]>()
for (const s of existantes) {
  const k = norm(s.nom)
  if (!parNom.has(k)) parNom.set(k, [])
  parNom.get(k)!.push(s)
}

const aCreer: Fiche[] = []
const aAdopter: { f: Fiche; s: any; champs: string[] }[] = []
const divergences: string[] = []
let dejaFaites = 0

for (const f of livre) {
  const candidates = parNom.get(norm(f.nom)) ?? []
  if (candidates.length > 1) {
    // Deux lignes du même nom normalisé : on ne choisit pas à la place d'André.
    divergences.push(`⚠️  « ${f.nom} » : ${candidates.length} lignes de même nom en base (ids ${candidates.map(c => c.id).join(', ')}) — rien touché`)
    continue
  }
  const s = candidates[0]
  if (!s) { aCreer.push(f); continue }

  const champs: string[] = []
  if (!s.est_catalogue) champs.push('est_catalogue')
  if (s.malus_armure !== f.malusArmure) champs.push('malus_armure')
  if (!s.description || s.description.trim() === '') champs.push('description')

  // Rapporté, jamais écrit ici.
  if (carac(s.caracteristique ?? '') !== carac(f.caracteristique)) {
    divergences.push(`caractéristique — ${f.nom} : base ${s.caracteristique ?? '∅'}, livre ${carac(f.caracteristique)}  (${s.porteurs} porteur(s))`)
  }
  if ((s.formation_requise ?? false) !== f.formationRequise) {
    divergences.push(`formation     — ${f.nom} : base ${s.formation_requise ? 'oui' : 'non'}, livre ${f.formationRequise ? 'OUI' : 'non'}  (${s.porteurs} porteur(s))`)
  }

  if (champs.length) aAdopter.push({ f, s, champs })
  else dejaFaites++
}

console.log(`=== SEMIS DES 36 COMPÉTENCES ${ECRIRE ? '(ÉCRITURE)' : '(essai à blanc)'} ===`)
console.log(`  ${existantes.length} lignes en base · ${livre.length} fiches au livre`)
console.log(`  à adopter : ${aAdopter.length}   à créer : ${aCreer.length}   déjà faites : ${dejaFaites}\n`)

console.log('--- ADOPTÉES (lignes d\'André reconnues au livre) ---')
for (const { f, s, champs } of aAdopter) {
  console.log(`  [${String(s.id).padStart(3)}] ${f.nom.padEnd(32)} ${String(s.porteurs).padStart(2)} porteur(s) → ${champs.join(', ')}`)
}

console.log('\n--- CRÉÉES (absentes de la base) ---')
for (const f of aCreer) console.log(`  ${f.nom}  (${carac(f.caracteristique)}${f.formationRequise ? ', formation nécessaire' : ''})`)

console.log('\n--- DIVERGENCES base ≠ livre (RIEN ÉCRIT — voir p11-corrections.mts) ---')
for (const d of divergences) console.log(`  ${d}`)
console.log(`  ${divergences.length} au total`)

if (!ECRIRE) {
  console.log('\nEssai à blanc. Relancer avec --ecrire pour appliquer.')
  process.exit(0)
}

for (const { f, s, champs } of aAdopter) {
  if (champs.includes('description')) {
    await sql`UPDATE skills SET est_catalogue = true, malus_armure = ${f.malusArmure}, description = ${f.description} WHERE id = ${s.id}`
  } else {
    await sql`UPDATE skills SET est_catalogue = true, malus_armure = ${f.malusArmure} WHERE id = ${s.id}`
  }
}
for (const f of aCreer) {
  await sql`
    INSERT INTO skills (nom, caracteristique, formation_requise, description, est_catalogue, malus_armure)
    VALUES (${f.nom}, ${carac(f.caracteristique)}, ${f.formationRequise}, ${f.description}, true, ${f.malusArmure})`
}

const [apres] = await sql`
  SELECT count(*)::int total,
    count(*) FILTER (WHERE est_catalogue)::int catalogue,
    count(*) FILTER (WHERE est_catalogue AND (description IS NULL OR description = ''))::int sans_description
  FROM skills` as any[]
console.log(`\n✅ Écrit. skills : ${apres.total} lignes, ${apres.catalogue} au catalogue, ${apres.sans_description} sans description.`)

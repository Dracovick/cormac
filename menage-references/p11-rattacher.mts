/**
 * Rattache les lignes de fiche de `skills` à l'entrée de catalogue qui porte
 * leurs règles — pour que le 📖 de la fiche de personnage ouvre quelque chose.
 *
 * RATTACHER ≠ FUSIONNER. Un rattachement ajoute une référence : la ligne reste
 * où elle est, avec son nom, ses porteurs et ses rangs. Une fusion supprimerait
 * une ligne et repointerait ses porteurs — c'est une décision de MJ, et elle
 * n'est pas dans ce script. Voir p11-fusions-proposees.txt.
 *
 * DEUX VOIES, et aucune recherche floue :
 *   1. AUTOMATIQUE — « X (Y) » où X est exactement une compétence du
 *      catalogue : « Artisanat (serrurerie) » → Artisanat. La règle d'une
 *      spécialisation EST celle de sa compétence mère, le livre le dit.
 *   2. À LA MAIN — les renommages de la 3.0 vers la 3.5, un par un, motif
 *      écrit. « Dissimulation » ressemble à « Discrétion » par hasard autant
 *      que par parenté : c'est l'histoire des règles qui tranche, pas la
 *      ressemblance des lettres.
 *
 * CE QUI N'EST PAS RATTACHÉ : ce qui n'est pas une compétence (Volonté est un
 * jet de sauvegarde, Stabilité un trait racial nain, Langage secret une
 * capacité de classe, Aura magique un sort), et les compétences 3.0 que la 3.5
 * a supprimées sans remplaçante (Scrutation, Lecture sur les lèvres). Un
 * NULL ici n'est pas un trou : c'est un verdict.
 *
 * Usage : npx tsx menage-references/p11-rattacher.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

/** Les rattachements jugés un par un. Clé : nom exact en base. */
const A_LA_MAIN: Record<string, { vers: string; motif: string }> = {
  'Alchimie': { vers: 'Artisanat', motif: "Alchimie était une compétence à part en 3.0; la 3.5 en a fait Artisanat (alchimie)" },
  'Dissimulation': { vers: 'Discrétion', motif: "même compétence (Hide), renommée Discrétion en 3.5" },
  'Empathie avec les animaux': { vers: 'Dressage', motif: "Animal Empathy de la 3.0, fondue dans Dressage (Handle Animal) en 3.5" },
  "Sens de l'orientation": { vers: 'Survie', motif: "Intuit Direction de la 3.0, fondue dans Survie en 3.5" },
  'Monture': { vers: 'Équitation', motif: "même compétence (Ride) sous un autre nom de table" },
  'Religion': { vers: 'Connaissances', motif: "« Religion » seule désigne Connaissances (religion)" },
  'Connaissance astronomie': { vers: 'Connaissances', motif: 'domaine de Connaissances hors Manuel — la règle des Connaissances s\'applique' },
  'Connaissance de la magie': { vers: 'Connaissances', motif: 'domaine de Connaissances hors Manuel — proche de Connaissances (mystères)' },
  'Connaissance des monstres': { vers: 'Connaissances', motif: 'domaine de Connaissances hors Manuel' },
  'Connaissance des nains': { vers: 'Connaissances', motif: 'domaine de Connaissances hors Manuel' },
  'Connaissance du commerce': { vers: 'Connaissances', motif: 'domaine de Connaissances hors Manuel' },
  'Connaissance langues anciennes': { vers: 'Connaissances', motif: 'domaine de Connaissances hors Manuel' },
  'Knowledge (Radiance)': { vers: 'Connaissances', motif: 'domaine de Connaissances d\'un supplément' },
  // Le Manuel, p. 74 : « Cette compétence sert également à reconnaître les
  // individus déguisés et pour LIRE SUR LES LÈVRES lorsqu'on ne peut entendre
  // ou comprendre les paroles de quelqu'un. » La compétence 3.0 n'a donc pas
  // disparu : la 3.5 en a fait un usage de Détection, avec son propre DD.
  'Lecture sur les lèvres': { vers: 'Détection', motif: 'la 3.5 en a fait un usage de Détection (Manuel p. 74, DD 15)' },
  'connaissance des femmes': { vers: 'Connaissances', motif: 'domaine de Connaissances maison — la règle générique s\'applique' },
}

/** Ce qui ne reçoit jamais de lien, avec la raison. */
const JAMAIS: Record<string, string> = {
  'Scrutation': "Scry de la 3.0, SUPPRIMÉE en 3.5 — l'effet est passé dans les sorts",
  'Heal (2 pv x jour x niv.)': "note de fiche (un décompte de soins), pas une compétence",
  'Premiers soins (2 pv x jour x niv.)': "note de fiche, pas une compétence",
  'Premier soins animaux': "compétence maison — à rapprocher de Premiers secours ou non, décision du MJ",
  'Aura magique': 'un sort, pas une compétence',
  'Volonté': 'un JET DE SAUVEGARDE, pas une compétence',
  'Stabilité': 'trait racial nain, pas une compétence',
  'Langage secret': 'capacité de classe du druide, pas une compétence',
  'Variante de sort': "pas une compétence du Manuel",
  'Spellflash': "pas une compétence du Manuel",
  'Magie divine': "pas une compétence du Manuel",
  'Ingénierie magique': "pas une compétence du Manuel",
  'Prédiction': "pas une compétence du Manuel",
  'Don artistique': "pas une compétence du Manuel",
  'Jeux': "pas une compétence du Manuel",
  'Fabrication': "pas une compétence du Manuel",
  'Équitation Dragon': "pas une compétence du Manuel",
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[\u2018\u2019\u02bc]/g, "'")
   .replace(/\s+/g, ' ').trim().toLowerCase()

const toutes = await sql`
  SELECT s.id, s.nom, s.est_catalogue, s.catalogue_id,
    (SELECT count(*)::int FROM character_skills cs WHERE cs.skill_id = s.id) porteurs
  FROM skills s ORDER BY s.nom` as any[]

const catalogue = new Map(toutes.filter(s => s.est_catalogue).map(s => [norm(s.nom), s]))

// Garde-fou : une cible écrite à la main qui ne correspond à rien au catalogue
// annoncerait « absente » au lieu de signaler une faute de frappe.
for (const [source, { vers }] of Object.entries(A_LA_MAIN)) {
  if (!catalogue.has(norm(vers))) {
    console.error(`ARRÊT : la cible « ${vers} » (pour « ${source} ») n'est pas au catalogue.`)
    process.exit(1)
  }
}

const auto: { s: any; cible: any }[] = []
const main: { s: any; cible: any; motif: string }[] = []
const sans: { s: any; raison: string }[] = []
const inconnues: any[] = []
let deja = 0

for (const s of toutes) {
  if (s.est_catalogue) continue
  if (s.catalogue_id) { deja++; continue }

  const jugee = A_LA_MAIN[s.nom]
  if (jugee) { main.push({ s, cible: catalogue.get(norm(jugee.vers))!, motif: jugee.motif }); continue }

  const raison = JAMAIS[s.nom]
  if (raison) { sans.push({ s, raison }); continue }

  // Spécialisation : « X (Y) » où X est au catalogue.
  const ouvre = s.nom.indexOf(' (')
  if (ouvre > 0 && s.nom.endsWith(')')) {
    const mere = catalogue.get(norm(s.nom.slice(0, ouvre)))
    if (mere) { auto.push({ s, cible: mere }); continue }
  }
  inconnues.push(s)
}

console.log(`=== RATTACHEMENT ${ECRIRE ? '(ÉCRITURE)' : '(essai à blanc)'} ===`)
console.log(`  automatiques (spécialisations) : ${auto.length}`)
console.log(`  jugés à la main                : ${main.length}`)
console.log(`  sans lien, et c'est un verdict : ${sans.length}`)
console.log(`  déjà rattachées                : ${deja}`)
console.log(`  NON CLASSÉES (à instruire)     : ${inconnues.length}\n`)

console.log('--- AUTOMATIQUES ---')
for (const { s, cible } of auto) console.log(`  [${String(s.id).padStart(3)}] ${s.nom.padEnd(42)} → ${cible.nom}   (${s.porteurs} porteur(s))`)

console.log('\n--- À LA MAIN ---')
for (const { s, cible, motif } of main) {
  console.log(`  [${String(s.id).padStart(3)}] ${s.nom.padEnd(42)} → ${cible.nom}   (${s.porteurs} porteur(s))`)
  console.log(`        ${motif}`)
}

console.log('\n--- SANS LIEN ---')
for (const { s, raison } of sans) console.log(`  [${String(s.id).padStart(3)}] ${s.nom.padEnd(42)} ${raison}   (${s.porteurs} porteur(s))`)

if (inconnues.length) {
  console.log('\n⚠️  NON CLASSÉES — à instruire avant d\'écrire :')
  for (const s of inconnues) console.log(`  [${s.id}] ${s.nom}  (${s.porteurs} porteur(s))`)
}

if (!ECRIRE) {
  console.log('\nEssai à blanc. Relancer avec --ecrire pour appliquer.')
  process.exit(0)
}

for (const { s, cible } of [...auto, ...main]) {
  await sql`UPDATE skills SET catalogue_id = ${cible.id} WHERE id = ${s.id}`
}

// Contrôle d'intégrité : aucun lien vers une ligne hors catalogue, aucune
// boucle, aucune entrée de catalogue qui pointerait ailleurs.
const [c] = await sql`
  SELECT
    (SELECT count(*)::int FROM skills WHERE catalogue_id IS NOT NULL) liees,
    (SELECT count(*)::int FROM skills s WHERE s.catalogue_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM skills c WHERE c.id = s.catalogue_id AND c.est_catalogue)) hors_catalogue,
    (SELECT count(*)::int FROM skills WHERE catalogue_id = id) boucles,
    (SELECT count(*)::int FROM skills WHERE est_catalogue AND catalogue_id IS NOT NULL) catalogue_lie,
    (SELECT count(*)::int FROM character_skills) porteurs` as any[]
console.log(`\n✅ Écrit. ${c.liees} lignes rattachées.`)
console.log(`   intégrité → lien hors catalogue : ${c.hors_catalogue} · boucles : ${c.boucles} · entrée de catalogue liée : ${c.catalogue_lie} · lignes character_skills : ${c.porteurs}`)

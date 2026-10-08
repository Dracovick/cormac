/**
 * Les écarts de RÈGLE entre la base et le Manuel, corrigés un par un.
 *
 * Séparé du semis exprès : le semis ne remplit que le vide, celui-ci écrase
 * une valeur saisie. Chaque correction porte la valeur ATTENDUE avant
 * écriture — si la base dit autre chose, le script s'arrête au lieu d'effacer
 * une décision prise entre-temps.
 *
 * CE QUI EST CORRIGÉ
 *   1. Psychologie : Charisme → Sagesse. Deux sources concordantes — la table
 *      4-2 relevée à l'image (p. 63) et le SRD 3.5 français.
 *      ⚠️ Ce n'est PAS un bug de calcul : src/lib/dnd35/skills.ts corrige déjà
 *      Psychologie à l'affichage et à l'impression (caracteristiqueDe). Mais
 *      la Bibliothèque lit la base, et une base qui contredit le code finit
 *      toujours par ressortir quelque part.
 *   2. Les formations requises : 7 entrées de catalogue + 7 Connaissances
 *      spécialisées. Sans formation (degré de maîtrise 0), ces compétences ne
 *      peuvent PAS être tentées du tout — c'est une règle, pas une étiquette.
 *
 * CE QUI N'EST PAS TOUCHÉ : les Connaissances d'un domaine qui n'est pas au
 * Manuel (dragons) et les « Connaissance … » au singulier (astronomie, de la
 * magie, des monstres, des nains, du commerce, langues anciennes). Ce sont des
 * compétences maison d'André — leur règle lui appartient.
 *
 * Usage : npx tsx menage-references/p11-corrections.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

/** Les 10 domaines de Connaissances imprimés au Manuel (table 4-2, p. 63). */
const DOMAINES_MANUEL = [
  'architecture et ingénierie', 'exploration souterraine', 'folklore local',
  'géographie', 'histoire', 'mystères', 'nature', 'noblesse et royauté',
  'plans', 'religion',
]

type Correction = {
  nom: string
  champ: 'caracteristique' | 'formation_requise'
  attendu: string | boolean
  nouveau: string | boolean
  motif: string
}

const corrections: Correction[] = [
  {
    nom: 'Psychologie', champ: 'caracteristique', attendu: 'CHA', nouveau: 'SAG',
    motif: 'table 4-2 du Manuel (p. 63, relevée à l\'image) et SRD 3.5 VF : Psychologie (Sag)',
  },
]

const FORMATIONS = [
  'Art de la magie', 'Décryptage', 'Désamorçage/sabotage', 'Dressage',
  'Escamotage', 'Profession', 'Utilisation d’objets magiques',
]
for (const nom of FORMATIONS) {
  corrections.push({
    nom, champ: 'formation_requise', attendu: false, nouveau: true,
    motif: 'en-tête de la fiche au Manuel : « formation nécessaire »',
  })
}
for (const domaine of DOMAINES_MANUEL) {
  corrections.push({
    nom: `Connaissances (${domaine})`, champ: 'formation_requise', attendu: false, nouveau: true,
    motif: 'Connaissances exige la formation (en-tête de la fiche au Manuel)',
  })
}

/** Casse, accents, apostrophes typographiques, espaces. */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[\u2018\u2019\u02bc]/g, "'")
   .replace(/\s+/g, ' ').trim().toLowerCase()

const lignes = await sql`
  SELECT s.id, s.nom, s.caracteristique, s.formation_requise,
    (SELECT count(*)::int FROM character_skills cs WHERE cs.skill_id = s.id) porteurs
  FROM skills s` as any[]
const parNom = new Map(lignes.map(l => [norm(l.nom), l]))

const aFaire: { c: Correction; l: any }[] = []
const dejaFaites: string[] = []
const absentes: string[] = []
const refus: string[] = []

for (const c of corrections) {
  const l = parNom.get(norm(c.nom))
  if (!l) { absentes.push(c.nom); continue }
  const actuel = c.champ === 'caracteristique' ? l.caracteristique : (l.formation_requise ?? false)
  if (actuel === c.nouveau) { dejaFaites.push(`${c.nom} (${c.champ})`); continue }
  if (actuel !== c.attendu) {
    refus.push(`${c.nom} (${c.champ}) : la base dit « ${actuel} », le script attendait « ${c.attendu} » — rien touché`)
    continue
  }
  aFaire.push({ c, l })
}

console.log(`=== CORRECTIONS DE RÈGLE ${ECRIRE ? '(ÉCRITURE)' : '(essai à blanc)'} ===\n`)
for (const { c, l } of aFaire) {
  console.log(`  [${String(l.id).padStart(3)}] ${c.nom.padEnd(42)} ${c.champ} : ${String(c.attendu)} → ${String(c.nouveau)}   (${l.porteurs} porteur(s))`)
  console.log(`        ${c.motif}`)
}
console.log(`\n  à corriger : ${aFaire.length}   déjà bonnes : ${dejaFaites.length}   absentes de la base : ${absentes.length}`)
if (absentes.length) console.log(`  absentes (normal pour les domaines qu'André n'utilise pas) : ${absentes.join(', ')}`)
if (refus.length) {
  console.log('\n⚠️  REFUSÉES — la base a changé depuis que la correction a été écrite :')
  for (const r of refus) console.log(`    ${r}`)
}

if (!ECRIRE) {
  console.log('\nEssai à blanc. Relancer avec --ecrire pour appliquer.')
  process.exit(0)
}

for (const { c, l } of aFaire) {
  if (c.champ === 'caracteristique') {
    await sql`UPDATE skills SET caracteristique = ${c.nouveau as string} WHERE id = ${l.id}`
  } else {
    await sql`UPDATE skills SET formation_requise = ${c.nouveau as boolean} WHERE id = ${l.id}`
  }
}
console.log(`\n✅ ${aFaire.length} corrections écrites.`)

const [psy] = await sql`SELECT nom, caracteristique FROM skills WHERE nom = 'Psychologie'` as any[]
const [nb] = await sql`SELECT count(*)::int n FROM skills WHERE formation_requise` as any[]
console.log(`   Psychologie → ${psy.caracteristique} · ${nb.n} lignes à formation requise.`)

/**
 * Applique le rattachement des lignes d'inventaire d'armes au catalogue
 * (weapons.catalogue_id), d'après la table écrite à la main p8-rattachement.json.
 *
 * GO d'André, DM du 2026-10-08 : « Go corrections et rattachement ».
 *
 * RÈGLES DU SCRIPT
 *  - Il n'écrit QUE la colonne catalogue_id. Aucun nom, dégât, critique,
 *    portée ou poids d'une ligne d'inventaire n'est touché : « la saisie fait foi ».
 *  - Il n'écrit que les verdicts 'sure' et 'de'. Les 'trancher' attendent André,
 *    les 'non' restent à NULL — c'est leur état correct, pas un trou.
 *  - Garde-fou de dérive : chaque ligne est relue en base et son nom doit
 *    correspondre EXACTEMENT à celui inscrit dans la table. Si la ligne a été
 *    renommée depuis la rédaction de la table, le lien est REFUSÉ : le jugement
 *    « ce nom-là désigne cette arme-là » ne vaut plus pour un autre nom.
 *  - Garde-fou de cible : la cible doit exister, être unique, et porter
 *    est_catalogue = true. Rattacher à une ligne d'inventaire serait un cycle.
 *  - Garde-fou de population : on refuse de rattacher une ligne qui est
 *    elle-même au catalogue.
 *  - Idempotent : un 2e passage ne réécrit rien.
 *
 * Usage : npx tsx menage-references/p8-rattacher.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

type Lien = { id: number; nom: string; cible: string | null; verdict: 'sure' | 'de' | 'trancher' | 'non'; motif?: string }
const table: Lien[] = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p8-rattachement.json', 'utf8')
).liens

const lignes = await sql`
  SELECT id, nom, est_catalogue, catalogue_id, degats,
    (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = weapons.id) porteurs
  FROM weapons ORDER BY id` as any[]
const parId = new Map(lignes.map(w => [w.id as number, w]))

/**
 * Normalisation de la recherche de cible, identique à celle de p7-armes-semer.
 * Nécessaire : certaines entrées du catalogue sont des lignes d'André ADOPTÉES
 * par le semis, qui ont gardé leur orthographe — « Masse d’armes lourde » porte
 * une apostrophe typographique U+2019 là où la table en écrit une droite.
 * Une égalité stricte refusait le rattachement de deux masses d'armes alors que
 * la cible existait bel et bien.
 */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[‘’ʼ]/g, "'")
   .replace(/\s+/g, ' ').trim().toLowerCase()

const catalogue = lignes.filter(w => w.est_catalogue)
const parNomCat = new Map<string, any[]>()
for (const w of catalogue) {
  const k = norm(w.nom)
  if (!parNomCat.has(k)) parNomCat.set(k, [])
  parNomCat.get(k)!.push(w)
}

// Contrôle de couverture : la table doit couvrir TOUTES les lignes d'inventaire.
// Une ligne oubliée resterait silencieusement à NULL, indistinguable d'un
// « non rattachable » assumé.
const inventaire = lignes.filter(w => !w.est_catalogue).map(w => w.id as number)
const couvertes = new Set(table.map(l => l.id))
const oubliees = inventaire.filter(id => !couvertes.has(id))
const horsSujet = table.map(l => l.id).filter(id => !inventaire.includes(id))
if (oubliees.length) console.log(`⚠ ${oubliees.length} ligne(s) d'inventaire absente(s) de la table : ${oubliees.join(', ')}`)
if (horsSujet.length) console.log(`⚠ ${horsSujet.length} entrée(s) de la table ne sont pas des lignes d'inventaire : ${horsSujet.join(', ')}`)

const aEcrire: { id: number; cibleId: number; nom: string; cible: string; verdict: string; porteurs: number; motif?: string }[] = []
const refus: string[] = []
let deja = 0, ignores = 0

for (const l of table) {
  if (l.verdict === 'non' || l.verdict === 'trancher') { ignores++; continue }

  const w = parId.get(l.id)
  if (!w) { refus.push(`[${l.id}] « ${l.nom} » : introuvable en base`); continue }
  if (w.nom !== l.nom) { refus.push(`[${l.id}] renommée depuis la table : base « ${w.nom} » ≠ table « ${l.nom} » — jugement caduc`); continue }
  if (w.est_catalogue) { refus.push(`[${l.id}] « ${l.nom} » est au catalogue, pas une ligne d'inventaire`); continue }

  const candidats = parNomCat.get(norm(l.cible ?? '')) ?? []
  if (candidats.length === 0) { refus.push(`[${l.id}] « ${l.nom} » : cible « ${l.cible} » absente du catalogue`); continue }
  if (candidats.length > 1) { refus.push(`[${l.id}] « ${l.nom} » : cible « ${l.cible} » en ${candidats.length} exemplaires au catalogue`); continue }
  const cible = candidats[0]

  if (w.catalogue_id === cible.id) { deja++; continue }
  if (w.catalogue_id != null && w.catalogue_id !== cible.id) {
    refus.push(`[${l.id}] « ${l.nom} » : déjà rattachée à [${w.catalogue_id}], la table dit [${cible.id}] — refus, décision d'André`)
    continue
  }
  aEcrire.push({ id: l.id, cibleId: cible.id, nom: l.nom, cible: cible.nom, verdict: l.verdict, porteurs: w.porteurs, motif: l.motif })
}

// Rapport groupé par entrée de catalogue : c'est la vue qu'André doit pouvoir lire.
const parCible = new Map<string, typeof aEcrire>()
for (const a of [...aEcrire].sort((x, y) => x.cible.localeCompare(y.cible, 'fr'))) {
  if (!parCible.has(a.cible)) parCible.set(a.cible, [])
  parCible.get(a.cible)!.push(a)
}
for (const [cible, membres] of parCible) {
  console.log(`\n→ ${cible}  (${membres.length} ligne${membres.length > 1 ? 's' : ''})`)
  for (const m of membres) {
    console.log(`   ${ECRIRE ? '✓' : '·'} [${m.id}] ${m.nom}${m.porteurs ? `  — ${m.porteurs} porteur·s` : ''}`)
    if (m.motif) console.log(`        ↳ ${m.verdict === 'de' ? 'tranché par le dé : ' : ''}${m.motif}`)
  }
}

if (ECRIRE) {
  for (const a of aEcrire) await sql`UPDATE weapons SET catalogue_id = ${a.cibleId} WHERE id = ${a.id}`
}

const aTrancher = table.filter(l => l.verdict === 'trancher')
console.log(`\n--- à trancher par André (${aTrancher.length}) — rien écrit ---`)
for (const l of aTrancher) console.log(`  [${l.id}] « ${l.nom} » → ${l.cible} ?  ${l.motif ?? ''}`)

console.log(`\n--- non rattachables (${table.filter(l => l.verdict === 'non').length}) : ni armes du catalogue, ni assez d'information ---`)

console.log(`\n${ECRIRE ? 'écrits' : 'à écrire'} : ${aEcrire.length}   déjà en place : ${deja}   laissés de côté : ${ignores}   refusés : ${refus.length}`)
if (refus.length) { console.log('\nREFUS :'); for (const r of refus) console.log('  ✗ ' + r) }
if (!ECRIRE) console.log('\nEssai à blanc — relancer avec --ecrire.')

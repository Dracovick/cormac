/**
 * Applique aux 109 entrées de catalogue de `feats` la description complète du
 * chapitre 5 — texte du SRD 3.5 français + accroche du Manuel relevée à
 * l'image. Voir p14-dons-extraire.py pour la provenance et son contrôle de
 * fidélité (12 phrases de règle sur 12 identiques, pages 93 et 100).
 *
 * RÈGLE : on ne remplit QUE le vide. Un champ déjà saisi par André n'est
 * jamais écrasé — la divergence est rapportée et attend sa décision. Même
 * procédé que p4 (sorts), p7 (armes) et p11 (compétences).
 *
 * Le script est rejouable : un second passage n'écrit rien.
 *
 * Usage : npx tsx menage-references/p14-dons-appliquer.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const RACINE = 'X:/Claude-Tools/cormac'
const sql = neon(fs.readFileSync(`${RACINE}/.env.local`, 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

/**
 * DOUZE descriptions abrégées saisies par André (« +4 à l'initiative. ») ne sont
 * PAS remplacées par le texte du chapitre, et c'est délibéré.
 *
 * J'ai d'abord écrit un garde-fou qui aurait décidé tout seul lesquelles sont
 * « redites par l'Avantage » donc remplaçables. Il se trompait dans les deux
 * sens : il refusait « Permet de créer des parchemins magiques » (Avantage :
 * « Permet de fabriquer des parchemins ») parce que créer ≠ fabriquer, et il
 * aurait accepté d'autres cas sans les comprendre. Une heuristique qui se
 * trompe sur la saisie du MJ est pire qu'une décision assumée : les douze sont
 * donc listées au rapport, et André tranche.
 */

type Fiche = { nom: string; type: string; conditions: string | null; accroche: string | null; description: string }
const fiches: Fiche[] = JSON.parse(fs.readFileSync(`${RACINE}/menage-references/p14-dons-srd.json`, 'utf8')).dons

/**
 * La table 5-1 N'IMPRIME PAS les conditions héritées : elle les porte par
 * l'indentation. « Science de la feinte » y est en retrait sous « Expertise du
 * combat », et sa case Conditions ne dit que « Expertise du combat » — alors
 * que le chapitre écrit « Int 13, Expertise du combat ».
 *
 * Mon semis p10 a donc rempli 16 fiches avec une condition INCOMPLÈTE. Les
 * compléter par le chapitre, c'est corriger mon propre relevé — pas écraser une
 * saisie d'André. Pour pouvoir le faire sans me tromper de population, on
 * recharge le catalogue p10 : si la valeur en base est EXACTEMENT celle que j'y
 * ai écrite, elle est de moi. Si elle en diffère, c'est André, et on n'y touche
 * pas.
 */
const catalogueP10 = new Map<string, string | null>(
  (JSON.parse(fs.readFileSync(`${RACINE}/menage-references/p10-dons-catalogue.json`, 'utf8')).dons as any[])
    .map(d => [d.nom, d.conditions]))

/**
 * Clé d'appariement. Le SRD écrit « Création d'anneaux » avec l'apostrophe
 * TYPOGRAPHIQUE U+2019, la base avec la droite. Dix dons se croisaient sans se
 * voir. On normalise la CLÉ, jamais la donnée.
 */
const cle = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u2019\u02bc]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Le Manuel écrit AUTONOME à la table 5-1 (p. 90) et en tête de sa fiche
 * (p. 92). Mon relevé de la table avait transcrit « Autonomie » : l'entrée de
 * catalogue porte donc un nom que le livre n'écrit nulle part. On la renomme —
 * mais seulement si rien d'autre ne porte déjà le bon nom, sinon on
 * fabriquerait un doublon en croyant corriger une faute.
 */
const RENOMMAGES: Array<{ de: string; vers: string; motif: string }> = [
  { de: 'Autonomie', vers: 'Autonome', motif: 'faute de mon relevé de la table 5-1; le Manuel écrit AUTONOME p. 90 et p. 92' },
]

for (const r of RENOMMAGES) {
  const [ancienne] = await sql`SELECT id, est_catalogue,
      (SELECT count(*)::int FROM character_feats cf WHERE cf.feat_id = f.id) porteurs
    FROM feats f WHERE nom = ${r.de}` as any[]
  const [cible] = await sql`SELECT id FROM feats WHERE nom = ${r.vers}` as any[]
  if (!ancienne) { console.log(`renommage « ${r.de} » → « ${r.vers} » : déjà fait`); continue }
  if (cible) {
    console.log(`✗ renommage REFUSÉ : « ${r.vers} » existe déjà [${cible.id}] — fusion à trancher, pas un renommage`)
    continue
  }
  console.log(`renommage [${ancienne.id}] « ${r.de} » → « ${r.vers} » (${ancienne.porteurs} porteur(s)) — ${r.motif}`)
  if (ECRIRE) await sql`UPDATE feats SET nom = ${r.vers} WHERE id = ${ancienne.id}`
}

const rows = await sql`SELECT id, nom, categorie, prerequis, description, effet_mecanique
  FROM feats WHERE est_catalogue ORDER BY nom` as any[]
const parCle = new Map<string, any>()
for (const r of rows) parCle.set(cle(r.nom), r)

let descriptions = 0, prerequis = 0, dejaOk = 0
const absents: string[] = []
const divergences: string[] = []
const notesGardees: string[] = []
const complets: string[] = []

for (const f of fiches) {
  const r = parCle.get(cle(f.nom))
  if (!r) { absents.push(f.nom); continue }

  const aDesc = r.description != null && String(r.description).trim() !== ''
  const aPrereq = r.prerequis != null && String(r.prerequis).trim() !== ''

  if (aDesc && String(r.description).trim() !== f.description.trim()) {
    notesGardees.push(`[${r.id}] ${r.nom}\n        note d'André : « ${String(r.description).trim()} »\n        Avantage     : « ${r.effet_mecanique} »`)
  }

  // Le texte du livre ne remplace pas une saisie : il la complète. Ce que la
  // base dit autrement est RAPPORTÉ, pas écrasé — sauf si la valeur en base est
  // mon propre relevé abrégé de la table 5-1, auquel cas on le complète.
  let completerPrereq = false
  if (aPrereq && f.conditions && cle(String(r.prerequis)) !== cle(f.conditions)) {
    const mien = catalogueP10.get(r.nom)
    const vientDeMonSemis = mien != null && cle(String(mien)) === cle(String(r.prerequis))
    // Garde-fou : ne compléter que si le chapitre contient bien TOUT ce que
    // disait la table. Sinon ce n'est pas un abrégé, c'est une contradiction —
    // et une contradiction se rapporte, elle ne s'écrase pas.
    const chapitreCouvre = vientDeMonSemis && String(mien).split(',')
      .map(x => cle(x)).filter(Boolean)
      .every(x => cle(f.conditions!).includes(x))
    if (chapitreCouvre) {
      completerPrereq = true
      complets.push(`[${r.id}] ${r.nom} : « ${r.prerequis} » → « ${f.conditions} »`)
    } else {
      divergences.push(`[${r.id}] ${r.nom} — conditions : base « ${r.prerequis} » / livre « ${f.conditions} »`)
    }
  }

  const ecrireDesc = !aDesc
  const ecrirePrereq = !aPrereq && !!f.conditions
  if (!ecrireDesc && !ecrirePrereq && !completerPrereq) { dejaOk++; continue }

  if (ECRIRE) {
    if (completerPrereq) {
      await sql`UPDATE feats SET prerequis = ${f.conditions} WHERE id = ${r.id}`
    }
    await sql`UPDATE feats SET
      description = COALESCE(NULLIF(description, ''), ${f.description}),
      prerequis   = COALESCE(NULLIF(prerequis, ''), ${f.conditions})
      WHERE id = ${r.id}`
  }
  if (ecrireDesc) descriptions++
  if (ecrirePrereq) prerequis++
}

console.log(`\n${ECRIRE ? 'écrit' : 'à écrire'} : ${descriptions} description(s), ${prerequis} ligne(s) de conditions`)
console.log(`déjà complètes : ${dejaOk}`)

if (complets.length) {
  console.log(`
${complets.length} condition(s) de MON relevé complétée(s) par le chapitre (la table 5-1 n'imprime pas les prérequis hérités) :`)
  for (const c of complets) console.log('   ' + c)
}

if (notesGardees.length) {
  console.log(`\n${notesGardees.length} note(s) abrégée(s) d'André GARDÉE(S) — le texte du chapitre n'est PAS écrit dessus :`)
  for (const n of notesGardees) console.log('   ' + n)
}

// Un don du livre sans entrée de catalogue en face, c'est une fiche qui
// resterait vide en silence. On le dit, et on refuse de se taire.
if (absents.length) {
  console.log(`\n⚠ ${absents.length} don(s) du livre SANS entrée de catalogue :`)
  for (const n of absents) console.log('   ' + n)
}
if (divergences.length) {
  console.log(`\n⚠ ${divergences.length} champ(s) déjà remplis qui disent autre chose — RIEN ÉCRASÉ :`)
  for (const d of divergences) console.log('   ' + d)
}

const [c] = await sql`SELECT
  count(*) FILTER (WHERE est_catalogue)::int cat,
  count(*) FILTER (WHERE est_catalogue AND (description IS NULL OR trim(description) = ''))::int sans_desc
  FROM feats` as any[]
console.log(`\ncontrôle : ${c.cat} entrées de catalogue, dont ${c.sans_desc} sans description`)
if (!ECRIRE) console.log('\nEssai à blanc — relancer avec --ecrire.')

// Phase 2 — campagne des descriptions (Manuel des Joueurs ch. 11).
// Charge les transcriptions p4-fiches/lot-*.json, matche par nom normalisé
// contre spells, et remplit UNIQUEMENT les champs encore vides (jamais
// d'écrasement). Les conflits (champ déjà rempli, valeur du livre différente)
// sont rapportés sans toucher la base. Les noms transcrits sans correspondance
// en base (8 retenus par la garde, variantes suprême/de groupe, etc.) sortent
// au rapport pour arbitrage.
// Usage : npx tsx menage-references/p4-fiches-appliquer.mts [--dry]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

const DRY = process.argv.includes('--dry')
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const DIR = 'X:/Claude-Tools/cormac/menage-references/p4-fiches'

const norm = (s: string) => s.toLowerCase()
  .replace(/[’´`]/g, "'")
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').trim()

type Entree = {
  nom: string, ecole?: string | null, composantes?: string | null,
  temps?: string | null, portee?: string | null, zone_effet?: string | null,
  duree?: string | null, jds?: string | null, rm?: string | null,
  description?: string | null, page?: number | null
}

// ── Noms du relevé qui désignent une entrée existante sous un autre nom ──────
// Le Manuel imprime parfois DEUX noms pour le même sort : un dans la liste de classe
// du chapitre 11 (qui a servi au semis, donc au nom en base) et un autre en tête de
// la fiche descriptive (que les copistes ont relevé). Vérifié à l'image dans chaque cas.
const ALIAS: Record<string, string> = {
  // p. 296 titre « Téléportation sans erreur » ; liste Ens/Mag 7 « Téléportation suprême ».
  // Le texte du sort cite lui-même les deux noms.
  'teleportation sans erreur': 'Téléportation suprême',
  // p. 205 titre « Blessure grave de groupe », Prê 7 ; liste de prêtre niveau 7
  // « Blessure importante de groupe ».
  'blessure grave de groupe': 'Blessure importante de groupe',
  // Les quatre sorts d'alignement : la liste de classe les regroupe sur une ligne,
  // le corps du chapitre leur donne une fiche chacun. La base porte l'entrée groupée.
  'cercle magique contre la loi': 'Cercle magique contre la Loi/le Bien/le Chaos/le Mal',
  'cercle magique contre le bien': 'Cercle magique contre la Loi/le Bien/le Chaos/le Mal',
  'detection de la loi': 'Détection de la Loi/du Bien/du Chaos/du Mal',
  'detection du bien': 'Détection de la Loi/du Bien/du Chaos/du Mal',
  'detection du chaos': 'Détection de la Loi/du Bien/du Chaos/du Mal',
  'protection contre la loi': 'Protection contre la Loi/le Bien/le Chaos/le Mal',
  'protection contre le bien': 'Protection contre la Loi/le Bien/le Chaos/le Mal',
  'rejet de la loi': 'Rejet de la Loi/du Bien/du Chaos/du Mal',
  'rejet du bien': 'Rejet de la Loi/du Bien/du Chaos/du Mal',
}
// Entrées groupées : la fiche écrite est celle d'une seule version — on le dit.
const GROUPEES = new Set(Object.values(ALIAS).filter(n => n.includes('/')))

// Remarques du copiste ajoutées en queue de description, par nom relevé.
const NOTES: Record<string, string> = {
  // Vérifié à l'image p. 223-224 : le Manuel se contredit lui-même sur ce sort.
  "courroux de l'ordre":
    "*Note du copiste : le bloc technique du Manuel (p. 223) indique « Jet de sauvegarde : Volonté, partiel », "
    + "mais le texte de description (p. 224) écrit « Un jet de Réflexes réussi annule l'hébétement ». "
    + "La contradiction est dans le livre ; les deux mentions sont reproduites telles quelles. Arbitrage du MJ.*",
}

// ── Charger les lots ─────────────────────────────────────────────────────────
const lots = fs.readdirSync(DIR).filter(f => /^lot-\d+\.json$/.test(f)).sort()
const entrees: Array<Entree & { lot: string }> = []
for (const f of lots) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
  for (const e of data) entrees.push({ ...e, lot: f })
}
console.log(`lots : ${lots.length} (${lots.join(', ')}) | entrées : ${entrees.length}`)

// Doublons entre lots (sort à cheval transcrit deux fois) : on garde la 1re.
const vus = new Set<string>()
const uniques = entrees.filter(e => {
  const k = norm(e.nom)
  if (vus.has(k)) { console.log(`  doublon inter-lots ignoré : ${e.nom} (${e.lot})`); return false }
  vus.add(k); return true
})

// ── Charger la base ──────────────────────────────────────────────────────────
const base = await sql`SELECT id, nom, ecole, composantes, portee, duree, zone_effet,
  jet_de_sauvegarde, resistance_magique, description FROM spells`
const parNom = new Map<string, any>()
for (const s of base) {
  const k = norm(s.nom)
  if (!parNom.has(k)) parNom.set(k, s)
}

const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''
const borne = (v: string, max: number) => v.length <= max ? v : v.slice(0, max - 1) + '…'

// Les copistes ont gardé le libellé imprimé du livre (« Cible : », « Effet : »,
// « Zone d'effet : »…). Les 386 fiches déjà en base n'en portent pas, et la page de
// la Bibliothèque affiche déjà son propre intitulé « Zone d'effet / cible » — sans
// quoi on lirait deux fois le mot. On retire le libellé, on garde la valeur.
const sansLibelle = (v: string | null | undefined) => {
  const t = v?.trim()
  if (!t) return null
  const nettoye = t.replace(/^(cibles?|effets?|zone d['’]effet|cible,? effet ou zone d['’]effet)\s*:\s*/i, '').trim()
  return nettoye || null
}

let matches = 0, champsRemplis = 0, conflits: string[] = [], sansCorrespondance: string[] = []
let sortsTouches = 0

for (const e of uniques) {
  const clef = norm(e.nom)
  const vise = ALIAS[clef] ? norm(ALIAS[clef]) : clef
  const s = parNom.get(vise)
  if (!s) { sansCorrespondance.push(`${e.nom} (p. ${e.page ?? '?'}, ${e.lot})`); continue }
  matches++

  // Temps d'incantation : pas de colonne dédiée — en tête de description quand ≠ 1 action simple.
  // Certains copistes préfixent leur réécriture d'une marque d'honnêteté — on la retire de la fiche.
  let desc = e.description?.trim().replace(/^\[Résumé[^\]]*\]\s*/u, '') || null
  if (desc && e.temps && !/^1 action simple$/i.test(e.temps.trim()))
    desc = `*Temps d'incantation : ${e.temps.trim()}.*\n\n${desc}`
  if (desc && GROUPEES.has(s.nom))
    desc = `*Le Manuel décrit ce sort en quatre versions (Loi, Bien, Chaos, Mal), identiques au mot d'alignement près. Texte ci-dessous : version « ${e.nom} ».*

${desc}`
  if (desc && NOTES[clef]) desc = `${desc}

${NOTES[clef]}`

  const cibles: Array<[col: string, valeur: string | null, max: number]> = [
    ['ecole', e.ecole?.trim() || null, 100],
    ['composantes', e.composantes?.trim() || null, 50],
    ['portee', e.portee?.trim() || null, 100],
    ['duree', e.duree?.trim() || null, 100],
    ['zone_effet', sansLibelle(e.zone_effet), 100000],
    ['jet_de_sauvegarde', e.jds?.trim() || null, 100],
    ['resistance_magique', e.rm?.trim() || null, 50],
    ['description', desc, 10000000],
  ]
  let touche = false
  for (const [col, brute, max] of cibles) {
    if (!brute) continue
    const valeur = borne(brute, max)
    if (!vide(s[col])) {
      if (norm(String(s[col])) !== norm(valeur)) conflits.push(`[${s.id}] ${s.nom} · ${col} : base « ${String(s[col]).slice(0, 60)} » ≠ livre « ${valeur.slice(0, 60)} »`)
      continue
    }
    if (!DRY) {
      // une requête par colonne, garde-fou vide dans le WHERE
      const r = col === 'ecole' ? await sql`UPDATE spells SET ecole = ${valeur} WHERE id = ${s.id} AND (ecole IS NULL OR trim(ecole)='') RETURNING id`
        : col === 'composantes' ? await sql`UPDATE spells SET composantes = ${valeur} WHERE id = ${s.id} AND (composantes IS NULL OR trim(composantes)='') RETURNING id`
        : col === 'portee' ? await sql`UPDATE spells SET portee = ${valeur} WHERE id = ${s.id} AND (portee IS NULL OR trim(portee)='') RETURNING id`
        : col === 'duree' ? await sql`UPDATE spells SET duree = ${valeur} WHERE id = ${s.id} AND (duree IS NULL OR trim(duree)='') RETURNING id`
        : col === 'zone_effet' ? await sql`UPDATE spells SET zone_effet = ${valeur} WHERE id = ${s.id} AND (zone_effet IS NULL OR trim(zone_effet)='') RETURNING id`
        : col === 'jet_de_sauvegarde' ? await sql`UPDATE spells SET jet_de_sauvegarde = ${valeur} WHERE id = ${s.id} AND (jet_de_sauvegarde IS NULL OR trim(jet_de_sauvegarde)='') RETURNING id`
        : col === 'resistance_magique' ? await sql`UPDATE spells SET resistance_magique = ${valeur} WHERE id = ${s.id} AND (resistance_magique IS NULL OR trim(resistance_magique)='') RETURNING id`
        : await sql`UPDATE spells SET description = ${valeur} WHERE id = ${s.id} AND (description IS NULL OR trim(description)='') RETURNING id`
      if (r.length === 1) { champsRemplis++; touche = true }
    } else { champsRemplis++; touche = true }
  }
  if (touche) sortsTouches++
}

console.log(`\n${DRY ? '[DRY RUN] ' : ''}matchés : ${matches}/${uniques.length} | sorts touchés : ${sortsTouches} | champs remplis : ${champsRemplis}`)
if (sansCorrespondance.length) {
  console.log(`\nSans correspondance en base (${sansCorrespondance.length}) :`)
  for (const n of sansCorrespondance) console.log('  - ' + n)
}
if (conflits.length) {
  console.log(`\nConflits base ≠ livre, non touchés (${conflits.length}) :`)
  for (const c of conflits) console.log('  - ' + c)
}

const apres = await sql`SELECT count(*)::int n FROM spells WHERE description IS NULL OR trim(description)=''`
console.log(`\nsorts encore sans description : ${apres[0].n}`)

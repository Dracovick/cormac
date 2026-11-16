/* Déposer l'histoire d'un personnage dans sa page d'histoire, depuis un fichier texte.
 *
 *   node scripts/deposer-histoire.mjs <chemin.md> --personnage 97 --nom "Duncan Darkvale"
 *   node scripts/deposer-histoire.mjs <chemin.md> --personnage 97 --nom "Duncan Darkvale" --appliquer
 *
 * Options : --signature <nom> (défaut Dracovick), --temoin <mot> (répétable).
 *
 * Généralisation de scripts/deposer-histoire-azadrielle.mjs, écrit pour Aza [98]
 * le 2026-11-15 : mêmes garde-fous, mais le personnage, les témoins d'accentuation
 * et la source ne sont plus codés en dur. Le fichier source découpe les chapitres
 * sur des lignes « === Titre du chapitre ».
 *
 * ⚠ Le texte vient d'un FICHIER en UTF-8, jamais d'un argument de ligne de
 * commande : un accent passé en argument sous Windows est détruit en route.
 *
 * ⛔ Le script REFUSE d'écrire si l'histoire porte déjà des chapitres. Deux
 * passages créeraient un doublon complet du récit.
 *
 * ⛔ Aucun process.exit() au succès : sur Windows, la connexion neon encore
 * ouverte fait sortir Node en 127 — un succès qui ressemble à un échec.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAX_CONTENU = 12_000 // doit rester égal à MAX_CONTENU_CHAPITRE de src/lib/histoire.ts
const MAX_TITRE = 200

const argv = process.argv.slice(2)
const APPLIQUER = argv.includes('--appliquer')
const lire = (drapeau) => {
  const i = argv.indexOf(drapeau)
  return i === -1 ? null : argv[i + 1]
}
const lireTous = (drapeau) => argv.flatMap((a, i) => (a === drapeau ? [argv[i + 1]] : []))

const SOURCE = argv[0]
const PERSONNAGE = Number(lire('--personnage'))
const NOM_ATTENDU = lire('--nom')
const SIGNATURE = lire('--signature') ?? 'Dracovick'
const TEMOINS = lireTous('--temoin')

if (!SOURCE || SOURCE.startsWith('--') || !Number.isInteger(PERSONNAGE) || !NOM_ATTENDU) {
  throw new Error('Usage : node scripts/deposer-histoire.mjs <chemin.md> --personnage <id> --nom "<nom de la fiche>" [--signature X] [--temoin mot]... [--appliquer]')
}

// ── Découpage de la source ───────────────────────────────────────────────────
const brut = fs.readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n')
const chapitres = []
for (const bloc of brut.split(/^=== /m)) {
  if (!bloc.trim()) continue
  const saut = bloc.indexOf('\n')
  if (saut === -1) throw new Error(`chapitre sans contenu : « ${bloc.slice(0, 60)} »`)
  chapitres.push({ titre: bloc.slice(0, saut).trim(), contenu: bloc.slice(saut + 1).trim() })
}
if (!chapitres.length) throw new Error('aucun chapitre trouvé — les titres se marquent « === Titre » en début de ligne')

const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

// ── Relevé ───────────────────────────────────────────────────────────────────
const [fiche] = await sql`select id, nom, historique from characters where id = ${PERSONNAGE}`
if (!fiche) throw new Error(`aucun personnage ${PERSONNAGE}`)

// ⚠ Le nom est VÉRIFIÉ, pas supposé : un identifiant de fiche se tape de travers,
// et déposer la vie d'un personnage sur la fiche d'un autre serait invisible
// jusqu'à ce qu'un joueur ouvre sa page.
if (fiche.nom !== NOM_ATTENDU) throw new Error(`la fiche ${PERSONNAGE} s'appelle « ${fiche.nom} », pas « ${NOM_ATTENDU} »`)

const dejaLa = await sql`
  select id, titre from character_story_chapters
  where personnage_id = ${PERSONNAGE} order by ordre`

console.log(`FICHE   [${fiche.id}] ${fiche.nom}`)
console.log(`        historique de fiche : ${fiche.historique ? `${fiche.historique.length} car.` : 'aucun'}`)
console.log(`        chapitres déjà en base : ${dejaLa.length}`)
console.log('')
console.log(`SOURCE  ${SOURCE}`)
console.log(`        ${chapitres.length} chapitre(s), signés « ${SIGNATURE} »`)

const defauts = []
let total = 0
for (const [i, c] of chapitres.entries()) {
  const n = c.contenu.length
  total += n
  console.log(`        ${i + 1}. ${c.titre} — ${n} car.`)
  if (!c.titre) defauts.push(`chapitre ${i + 1} sans titre`)
  if (c.titre.length > MAX_TITRE) defauts.push(`titre ${i + 1} trop long (${c.titre.length} > ${MAX_TITRE})`)
  if (n === 0) defauts.push(`chapitre ${i + 1} vide`)
  if (n > MAX_CONTENU) defauts.push(`chapitre ${i + 1} trop long (${n} > ${MAX_CONTENU})`)
}
console.log(`        total : ${total} caractères`)

// Les témoins doivent déjà être dans la source : un témoin absent AVANT l'écriture
// est une faute de frappe dans l'appel, pas une preuve d'encodage.
const texteSource = chapitres.map(c => c.contenu).join('\n')
for (const t of TEMOINS) if (!texteSource.includes(t)) defauts.push(`témoin « ${t} » absent de la source elle-même`)

if (defauts.length) {
  console.error('')
  console.error('⛔ La source est refusée :')
  for (const d of defauts) console.error('- ' + d)
  process.exitCode = 1
} else if (dejaLa.length > 0) {
  console.log('')
  console.log(`⛔ ${dejaLa.length} chapitre(s) existent déjà — rien n'est écrit, pour ne pas doubler le récit.`)
  process.exitCode = 1
} else if (!APPLIQUER) {
  console.log('')
  console.log('Essai seulement — rien n’a été écrit. Relancez avec --appliquer.')
} else {
  // ── Écriture ───────────────────────────────────────────────────────────────
  for (const [i, c] of chapitres.entries()) {
    await sql`
      insert into character_story_chapters (personnage_id, titre, contenu, ordre, signature)
      values (${PERSONNAGE}, ${c.titre}, ${c.contenu}, ${i}, ${SIGNATURE})`
  }

  // ── Contrôle : relu depuis la base, comparé caractère par caractère ────────
  // ⚠ On ne contrôle PAS ce qu'on vient d'envoyer, on relit ce que la base a
  // gardé : c'est le seul moyen de voir une troncature de colonne ou un accent
  // mangé en route.
  const relus = await sql`
    select titre, contenu, ordre, signature from character_story_chapters
    where personnage_id = ${PERSONNAGE} order by ordre asc, id asc`

  const apres = []
  if (relus.length !== chapitres.length) apres.push(`${relus.length} chapitres relus au lieu de ${chapitres.length}`)
  for (const [i, attendu] of chapitres.entries()) {
    const obtenu = relus[i]
    if (!obtenu) { apres.push(`chapitre ${i + 1} absent`); continue }
    if (obtenu.titre !== attendu.titre) apres.push(`titre ${i + 1} : « ${obtenu.titre} » ≠ « ${attendu.titre} »`)
    if (obtenu.contenu !== attendu.contenu) {
      apres.push(`contenu ${i + 1} : ${obtenu.contenu.length} car. relus contre ${attendu.contenu.length} envoyés`)
    }
    if (obtenu.ordre !== i) apres.push(`ordre ${i + 1} : ${obtenu.ordre} au lieu de ${i}`)
    if (obtenu.signature !== SIGNATURE) apres.push(`signature ${i + 1} : ${JSON.stringify(obtenu.signature)}`)
  }

  // Témoins d'accentuation : si les accents étaient détruits, ces mots-là ne se
  // retrouveraient pas. Un contrôle de LONGUEUR seul ne le verrait pas forcément.
  const texteEntier = relus.map(r => r.contenu).join('\n')
  for (const t of TEMOINS) if (!texteEntier.includes(t)) apres.push(`témoin d'accentuation introuvable en base : « ${t} »`)

  // La fiche elle-même ne doit pas avoir bougé : on ajoute une histoire, on ne
  // touche pas au personnage.
  const [ficheApres] = await sql`select nom, historique, xp from characters where id = ${PERSONNAGE}`
  if (ficheApres.nom !== fiche.nom) apres.push('le nom de la fiche a changé')
  if ((ficheApres.historique ?? null) !== (fiche.historique ?? null)) apres.push('l’historique de la fiche a changé')

  console.log('')
  console.log(`RELU    ${relus.length} chapitre(s), ${texteEntier.length} caractères en base`)
  console.log(`        ${TEMOINS.length} témoin(s) d'accentuation retrouvé(s)`)

  if (apres.length) {
    console.error('')
    console.error('⛔ ÉCHEC :')
    for (const d of apres) console.error('- ' + d)
    process.exitCode = 1
  } else {
    console.log('')
    console.log('✅ Histoire déposée et relue à l’identique. La fiche n’a pas bougé.')
  }
}

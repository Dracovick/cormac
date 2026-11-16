/* Déposer l'histoire d'Azadrielle Pétales de Lune [98] dans sa page d'histoire.
 *
 *   node scripts/deposer-histoire-azadrielle.mjs <chemin du JSON>              → relève, n'écrit rien
 *   node scripts/deposer-histoire-azadrielle.mjs <chemin du JSON> --appliquer  → écrit
 *
 * André, le 2026-11-15 : « …et où l'on pourrait déposer l'histoire d'Azadrielle. »
 *
 * ⚠ Le texte vient d'un fichier JSON en UTF-8, jamais d'un argument de ligne de
 * commande : un accent passé en argument sous Windows est détruit en route
 * (leçon payée plusieurs fois).
 *
 * ⛔ Le script REFUSE d'écrire si l'histoire porte déjà des chapitres. Deux
 * passages créeraient un doublon complet du récit, et c'est ce qu'on fait quand
 * un script d'import ne dit pas qu'il a déjà servi.
 *
 * ⛔ Aucun process.exit() au succès : sur Windows, la connexion neon encore
 * ouverte fait sortir Node en 127 — un succès qui ressemble à un échec.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APPLIQUER = process.argv.includes('--appliquer')
const SOURCE = process.argv[2]
if (!SOURCE || SOURCE.startsWith('--')) throw new Error('Usage : node scripts/deposer-histoire-azadrielle.mjs <chemin.json> [--appliquer]')

const MAX_CONTENU = 12_000 // doit rester égal à MAX_CONTENU_CHAPITRE de src/lib/histoire.ts

const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'))
const { personnageId, nomAttendu, signature, chapitres } = source

// ── Relevé ───────────────────────────────────────────────────────────────────
const [fiche] = await sql`select id, nom, historique from characters where id = ${personnageId}`
if (!fiche) throw new Error(`aucun personnage ${personnageId}`)

// ⚠ Le nom est VÉRIFIÉ, pas supposé : un identifiant de fiche se tape de
// travers, et déposer la vie d'Azadrielle sur la fiche d'un autre personnage
// serait invisible jusqu'à ce qu'un joueur ouvre sa page.
if (fiche.nom !== nomAttendu) throw new Error(`la fiche ${personnageId} s'appelle « ${fiche.nom} », pas « ${nomAttendu} »`)

const dejaLa = await sql`
  select id, titre from character_story_chapters
  where personnage_id = ${personnageId} order by ordre`

console.log(`FICHE   [${fiche.id}] ${fiche.nom}`)
console.log(`        historique de fiche : ${fiche.historique ? `${fiche.historique.length} car.` : 'aucun'}`)
console.log(`        chapitres déjà en base : ${dejaLa.length}`)
console.log('')
console.log(`SOURCE  ${chapitres.length} chapitre(s), signés « ${signature} »`)

const defauts = []
let total = 0
for (const [i, c] of chapitres.entries()) {
  const n = c.contenu.length
  total += n
  console.log(`        ${i + 1}. ${c.titre} — ${n} car.`)
  if (!c.titre?.trim()) defauts.push(`chapitre ${i + 1} sans titre`)
  if (c.titre.length > 200) defauts.push(`titre ${i + 1} trop long (${c.titre.length} > 200)`)
  if (n === 0) defauts.push(`chapitre ${i + 1} vide`)
  if (n > MAX_CONTENU) defauts.push(`chapitre ${i + 1} trop long (${n} > ${MAX_CONTENU})`)
}
console.log(`        total : ${total} caractères`)

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
      values (${personnageId}, ${c.titre}, ${c.contenu}, ${i}, ${signature})`
  }

  // ── Contrôle : relu depuis la base, comparé caractère par caractère ────────
  // ⚠ On ne contrôle PAS ce qu'on vient d'envoyer, on relit ce que la base a
  // gardé : c'est le seul moyen de voir une troncature de colonne ou un accent
  // mangé en route.
  const relus = await sql`
    select titre, contenu, ordre, signature from character_story_chapters
    where personnage_id = ${personnageId} order by ordre asc, id asc`

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
    if (obtenu.signature !== signature) apres.push(`signature ${i + 1} : ${JSON.stringify(obtenu.signature)}`)
  }

  // Témoin d'accentuation : si les accents étaient détruits, ces mots-là ne se
  // retrouveraient pas. Un contrôle de LONGUEUR seul ne le verrait pas forcément.
  const texteEntier = relus.map(r => r.contenu).join('\n')
  for (const temoin of ['Pétales de Lune', 'sagespectres', 'céleste', 'Lluirbois', 'déjà ton âge']) {
    if (!texteEntier.includes(temoin)) apres.push(`témoin d'accentuation introuvable en base : « ${temoin} »`)
  }

  // La fiche elle-même ne doit pas avoir bougé : on ajoute une histoire, on ne
  // touche pas au personnage.
  const [ficheApres] = await sql`select nom, historique, xp from characters where id = ${personnageId}`
  if (ficheApres.nom !== fiche.nom) apres.push('le nom de la fiche a changé')
  if ((ficheApres.historique ?? null) !== (fiche.historique ?? null)) apres.push('l’historique de la fiche a changé')

  console.log('')
  console.log(`RELU    ${relus.length} chapitre(s), ${texteEntier.length} caractères en base`)

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

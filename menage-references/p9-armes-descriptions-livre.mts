/**
 * Passe les SIX fiches du catalogue d'armes au texte du Manuel.
 *
 * Pourquoi elles avaient été épargnées : le semis p7 ne remplit que le vide,
 * il n'écrase jamais une valeur saisie. Ces six portaient déjà une note
 * d'André — bonne mais abrégée —, donc le texte du livre est resté dehors.
 * André a tranché le 2026-10-08 : « corrige ». Même procédé que les quatre
 * corrections de règle de p8 — une seconde passe, explicite et bornée.
 *
 * GARDE-FOU : chaque fiche ne bascule que si la description en base est
 * EXACTEMENT la note archivée ci-dessous (ou déjà le texte du livre, auquel
 * cas rien n'est écrit). Si André a retouché une description entre-temps, le
 * script refuse plutôt que d'effacer son travail.
 *
 * La description du livre vient de p7-armes-catalogue.json, relevé à l'image
 * du Manuel des Joueurs VF, table 7-5 et texte du chapitre 7 (p. 114-121).
 *
 * Usage : npx tsx menage-references/p9-armes-descriptions-livre.mts [--ecrire]
 * Sans --ecrire : essai à blanc.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { descriptionComplete, type EntreeArme } from './p7-description-arme.mts'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

const livre: EntreeArme[] = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p7-armes-catalogue.json', 'utf8')
).armes

/** Casse, accents, apostrophes typographiques, espaces — comme p7 et p8. */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[\u2018\u2019\u02bc]/g, "'").replace(/\s+/g, ' ').trim()

/** Les six fiches, avec la note d'André telle qu'elle est en base aujourd'hui. */
const CIBLES: { nom: string; noteAndre: string }[] = [
  { nom: 'Épée longue',           noteAndre: 'Arme de guerre polyvalente, de prédilection des guerriers.' },
  { nom: 'Arc long composite',    noteAndre: 'Arc long composite, tire des flèches à longue portée.' },
  { nom: 'Hache de guerre naine', noteAndre: 'Arme de guerre exotique naine. Un nain la manie comme une arme de guerre (Familiarité avec les armes naines).' },
  { nom: 'Marteau léger',         noteAndre: 'Arme légère, peut être lancée (portée 6 m).' },
  { nom: 'Arbalète lourde',       noteAndre: 'Rechargement : action complexe. Pas d’attaque itérative.' },
  { nom: 'Masse d’armes lourde',  noteAndre: 'Masse d’armes lourde.' },
]

const enBase = await sql`
  select id, nom, description from weapons where est_catalogue = true
` as { id: number; nom: string; description: string | null }[]

let aEcrire = 0, dejaBon = 0, refuses = 0
const majs: { id: number; texte: string }[] = []

for (const cible of CIBLES) {
  const ligne = enBase.find(w => norm(w.nom) === norm(cible.nom))
  if (!ligne) { console.log(`❌ REFUS « ${cible.nom} » — absente du catalogue`); refuses++; continue }

  const entree = livre.find(a => norm(a.nom) === norm(cible.nom))
  if (!entree?.description?.trim()) { console.log(`❌ REFUS [${ligne.id}] ${ligne.nom} — pas de texte du livre`); refuses++; continue }

  // La fiche stockée = le texte du livre + les notes de table, exactement comme
  // le semis p7 l'écrit pour les 72 autres entrées. Un texte nu ferait une
  // deuxième forme de fiche dans le même catalogue.
  const cibleTexte = descriptionComplete(entree)
  const actuelle = (ligne.description ?? '').trim()
  if (norm(actuelle) === norm(cibleTexte)) {
    console.log(`= [${ligne.id}] ${ligne.nom} — déjà au texte du livre`); dejaBon++; continue
  }
  // Points de départ acceptés : la note d'André, ou le texte nu du livre
  // (état laissé par la première passe de ce script, avant l'ajout des notes).
  if (norm(actuelle) !== norm(cible.noteAndre) && norm(actuelle) !== norm(entree.description)) {
    console.log(`❌ REFUS [${ligne.id}] ${ligne.nom} — la description en base n'est plus celle archivée`)
    console.log(`     base   : ${JSON.stringify(actuelle)}`)
    console.log(`     archive: ${JSON.stringify(cible.noteAndre)}`)
    refuses++; continue
  }

  console.log(`→ [${ligne.id}] ${ligne.nom}`)
  console.log(`     note d'André (remplacée) : ${cible.noteAndre}`)
  console.log(`     texte du Manuel          : ${entree.description.slice(0, 110)}…`)
  majs.push({ id: ligne.id, texte: cibleTexte })
  aEcrire++
}

console.log(`\n${aEcrire} à écrire · ${dejaBon} déjà bonnes · ${refuses} refusées`)

if (!ECRIRE) { console.log('\nEssai à blanc — rien touché. Relancer avec --ecrire.'); process.exit(refuses > 0 ? 1 : 0) }
if (refuses > 0) { console.log('\n⛔ Des refus : rien écrit. Instruire les cas d\'abord.'); process.exit(1) }

for (const m of majs) await sql`update weapons set description = ${m.texte} where id = ${m.id}`
console.log(`\n✅ ${majs.length} description(s) écrite(s).`)

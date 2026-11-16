// Vérification, après coup et depuis la base, du lot « métier de Duncan ».
//
//   node scripts/controle-metier-duncan.mjs
//
// ⛔ Le critère « l'ancre a disparu » employé dans le script d'écriture était
// FAUX pour deux des cinq retouches : celles-là conservent leur ancre et
// ajoutent du texte après. Il faut vérifier que le REMPLACEMENT est présent,
// exactement une fois — et pas que l'ancien a disparu.
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import { grasImbriques } from './lib-gras-imbrique.mjs'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const sql = neon(env.match(/DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/)[1].trim())

let n = 0
let echecs = 0
const verifier = (titre, ok, detail = '') => {
  n++
  if (!ok) { echecs++; console.log(`  ❌ ${n}. ${titre}${detail ? ` — ${detail}` : ''}`) }
  else console.log(`  ✅ ${n}. ${titre}${detail ? ` — ${detail}` : ''}`)
}

const chapitres = await sql`SELECT id, ordre, titre, contenu FROM character_story_chapters WHERE personnage_id = 97 ORDER BY ordre`
const par = (t) => chapitres.find(c => c.titre === t)
const uneFois = (texte, motif) => texte.split(motif).length - 1 === 1

console.log('— LA STRUCTURE')
verifier('9 chapitres', chapitres.length === 9, `${chapitres.length}`)
verifier('ordres 0..8 sans trou', chapitres.map(c => c.ordre).join(',') === '0,1,2,3,4,5,6,7,8', chapitres.map(c => c.ordre).join(','))
verifier('aucun titre en double', new Set(chapitres.map(c => c.titre)).size === 9)
verifier('« Le métier » est au rang 2', par('Le métier — joueur professionnel')?.ordre === 2)
verifier('« Tymora » reste au rang 1', par('Tymora, et les trois pièces')?.ordre === 1)
verifier('« Darkvale » est passé au rang 3', par('Darkvale — ce qui y est arrivé il y a trois ans')?.ordre === 3)
verifier('« Le trio » ferme au rang 8', par('Le trio')?.ordre === 8)

console.log('\n— LE TEXTE AJOUTÉ, présent une seule fois')
const attendus = [
  ['Vingt et un ans, et déjà « le magnifique »', '**Duncan est joueur professionnel.**'],
  ['Vingt et un ans, et déjà « le magnifique »', 'Et **Profession (joueur) 8**.'],
  ['Le métier — joueur professionnel', 'degré de maîtrise de 5 en Profession (joueur)'],
  ['Le métier — joueur professionnel', '**Escamotage : 0.** Pas un rang.'],
  ['Le métier — joueur professionnel', "Elle s'appelle **maître du destin**"],
  ['Le métier — joueur professionnel', 'forcent la main de la chance'],
  ['Darkvale — ce qui y est arrivé il y a trois ans', 'qui gagnait déjà sa vie assis à une table'],
  ['Aza — l\'énigme qu\'il ne sous-estime pas', 'Un joueur professionnel voyait parfaitement'],
  ['Aza — l\'énigme qu\'il ne sous-estime pas', 'une halfeline de trente-huit ans qu\'il a prise pour une enfant perdue'],
  ['Le trio', '**Où il a appris à jouer**'],
]
for (const [titre, motif] of attendus) {
  const c = par(titre)
  verifier(`« ${titre.slice(0, 28)}… » porte « ${motif.slice(0, 40)}… »`, !!c && uneFois(c.contenu, motif))
}

console.log('\n— L\'ANCIEN TEXTE, là où il devait vraiment disparaître')
const disparus = [
  ['Vingt et un ans, et déjà « le magnifique »', 'Et **Profession 8**. Huit rangs.'],
  ['Vingt et un ans, et déjà « le magnifique »', 'que sa fiche ne nomme pas encore'],
  ['Darkvale — ce qui y est arrivé il y a trois ans', 'qui avait un métier et des mains habiles'],
  ['Le trio', 'huit rangs de Profession attendent un nom'],
]
for (const [titre, motif] of disparus) {
  const c = par(titre)
  verifier(`« ${titre.slice(0, 28)}… » ne porte plus « ${motif.slice(0, 36)}… »`, !!c && !c.contenu.includes(motif))
}

console.log('\n— LA MISE EN FORME')
let totalGras = 0
for (const c of chapitres) {
  const avales = grasImbriques(c.contenu)
  totalGras += (c.contenu.match(/\*\*/g) ?? []).length / 2
  verifier(`« ${c.titre.slice(0, 32)}… » : aucun gras imbriqué`, avales.length === 0, avales.length ? JSON.stringify(avales[0].contenu.slice(0, 50)) : '')
}
verifier('aucun chapitre au-dessus du plafond de 12 000 car.', chapitres.every(c => c.contenu.length <= 12000), `max ${Math.max(...chapitres.map(c => c.contenu.length))}`)
console.log(`  (paires de gras sur les 9 chapitres : ${totalGras})`)

console.log('\n— LA FICHE')
const comp = await sql`
  SELECT s.id, s.nom, s.caracteristique, s.catalogue_id, cs.rangs_investis, cs.modif_divers
  FROM character_skills cs JOIN skills s ON s.id = cs.skill_id
  WHERE cs.personnage_id = 97 AND s.nom ILIKE 'profession%'`
verifier('une seule ligne de Profession', comp.length === 1, `${comp.length}`)
verifier('nommée « Profession (joueur) »', comp[0]?.nom === 'Profession (joueur)', comp[0]?.nom)
verifier('basée sur la Sagesse', comp[0]?.caracteristique === 'SAG', comp[0]?.caracteristique)
verifier('rattachée au catalogue 174', comp[0]?.catalogue_id === 174, `${comp[0]?.catalogue_id}`)
verifier('8 rangs intacts', comp[0]?.rangs_investis === 8, `${comp[0]?.rangs_investis}`)
verifier('0 en divers', (comp[0]?.modif_divers ?? 0) === 0, `${comp[0]?.modif_divers}`)

console.log('\n— LES TÉMOINS QUI NE DEVAIENT PAS BOUGER')
const drakara = await sql`SELECT s.nom, cs.rangs_investis FROM character_skills cs JOIN skills s ON s.id = cs.skill_id WHERE cs.personnage_id = 70 AND s.id = 174`
verifier('Drakara [70] garde « Profession » générique', drakara[0]?.nom === 'Profession' && drakara[0]?.rangs_investis === 11, `${drakara[0]?.nom} ${drakara[0]?.rangs_investis}`)
const generique = await sql`SELECT nom, caracteristique FROM skills WHERE id = 174`
verifier('skills 174 n\'a pas été renommée', generique[0]?.nom === 'Profession', generique[0]?.nom)
const aza = await sql`SELECT count(*)::int AS n, sum(length(contenu))::int AS t FROM character_story_chapters WHERE personnage_id = 98`
verifier('Azadrielle [98] : 7 chapitres, 14 561 car.', aza[0]?.n === 7 && aza[0]?.t === 14561, `${aza[0]?.n} / ${aza[0]?.t}`)
// ⛔ Le rayon des compétences a des TROUS d'identifiants : 91 lignes pour un
// max(id) de 195. Compter le total ne dit donc rien — on vérifie la ligne elle-même.
const creee = await sql`SELECT id, nom FROM skills WHERE nom = 'Profession (joueur)'`
verifier('une seule ligne « Profession (joueur) » au rayon', creee.length === 1, creee.map(c => c.id).join(','))
const autres = await sql`SELECT count(*)::int AS n FROM character_skills WHERE skill_id = 195`
verifier('« Profession (joueur) » n\'est portée que par Duncan', autres[0]?.n === 1, `${autres[0]?.n} ligne(s)`)

const total = chapitres.reduce((a, c) => a + c.contenu.length, 0)
console.log(`\n${n} contrôles, ${echecs} échec(s). Histoire de Duncan : ${chapitres.length} chapitres, ${total} caractères.`)
if (echecs > 0) process.exit(1)

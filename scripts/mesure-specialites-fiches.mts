/* Mesure (lecture seule) de l'effet du repli de statut sur les 74 fiches :
 * combien de lignes de compétences passent de hors-classe à compétence de classe,
 * et combien voient leur caractéristique changer (attendu : zéro).
 *
 *   npx tsx scripts/mesure-specialites-fiches.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import { getCompetenceRef, caracteristiqueDe, estCompetenceDeClasse } from '../src/lib/dnd35/skills'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const sql = neon(env.match(/DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/)![1].trim())

const lignes = await sql`
  SELECT cs.personnage_id, c.nom AS perso, c.joueur_prenom, s.nom, s.caracteristique AS carac_base,
         cs.rangs_investis AS rangs
  FROM character_skills cs
  JOIN skills s ON s.id = cs.skill_id
  JOIN characters c ON c.id = cs.personnage_id
  ORDER BY cs.personnage_id, s.nom`

const classesParPerso = new Map<number, string[]>()
for (const r of await sql`SELECT cc.personnage_id, cl.nom FROM character_classes cc JOIN classes cl ON cl.id = cc.classe_id`) {
  if (!classesParPerso.has(r.personnage_id)) classesParPerso.set(r.personnage_id, [])
  classesParPerso.get(r.personnage_id)!.push(r.nom)
}

let gagnent = 0
let caracBouge = 0
const detail: string[] = []
for (const l of lignes) {
  const classes = classesParPerso.get(l.personnage_id) ?? []
  // « avant » = l'ancien code, reproduit : nom exact, sinon hors-classe.
  const avantClasse = getCompetenceRef(l.nom)?.classesCompetence.some(cc => classes.includes(cc)) ?? false
  const apresClasse = estCompetenceDeClasse(l.nom, classes)
  // La caractéristique n'a pas changé de code : on la relit quand même, c'est
  // elle qui porte le risque d'un total qui bouge.
  const avantCarac = l.carac_base ?? '—'
  const apresCarac = caracteristiqueDe(l.nom, l.carac_base)
  if (avantClasse !== apresClasse) {
    gagnent++
    detail.push(`  ■ [${l.personnage_id}] ${l.perso} (${l.joueur_prenom ?? '?'}) — « ${l.nom} » ${l.rangs} rangs — ${classes.join('/')}`)
  }
  if (avantCarac !== apresCarac && getCompetenceRef(l.nom) === undefined) caracBouge++
}

console.log(`lignes de compétences sur les fiches : ${lignes.length}`)
console.log(`  □ -> ■ (deviennent compétence de classe) : ${gagnent}`)
console.log(`  caractéristique qui bouge par le repli   : ${caracBouge}   (doit être 0)`)
console.log('\n' + detail.join('\n'))
if (caracBouge !== 0) { console.error('\n❌ ECHEC : le repli a touché une caractéristique.'); process.exit(1) }

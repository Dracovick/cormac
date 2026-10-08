/**
 * FUSION — « Connaissance de la magie » [20] → « Art de la magie » [164].
 *
 * Décision d'André (DM, 2026-10-08) : « Change seulement Connaissance de la
 * magie pour Art de la Magie chez les personnages... Ne touche pas les autres
 * compétences. » Ce script ne touche QUE ces deux lignes de `skills` et les
 * lignes de `character_skills` qui les portent.
 *
 * ⚠ Ma proposition de la veille (p11-fusions-proposees.txt) visait
 * « Connaissances (mystères) », et le rattachement p11 avait posé
 * catalogue_id = 192 (Connaissances). André tranche autrement : c'est Art de
 * la magie, la compétence qui sert à identifier un sort et à utiliser un
 * parchemin. C'est sa table.
 *
 * CINQ DES SEPT PORTEURS ONT DÉJÀ LES DEUX LIGNES. La fusion n'est donc pas un
 * simple repointage :
 *   - 2 porteurs exclusifs (Vallin, Radriel) : la ligne change de compétence.
 *   - 5 porteurs doubles : la ligne de Connaissance disparaît, et les rangs
 *     retenus sont le MAXIMUM des deux. On ne retire jamais un rang à un
 *     personnage parce que deux lignes disaient la même chose de deux façons.
 *     Un seul cas diverge réellement (Zébulon 15 vs 17) ; DracoVick garde ses
 *     11, les trois autres portaient des chiffres identiques.
 *
 * PLAFONDS VÉRIFIÉS : les 7 personnages restent sous niveau + 3 (Art de la
 * magie est compétence de classe pour Magicien et Ensorceleur). Aucun rang
 * n'est écrêté — le script REFUSE d'écrire s'il en trouvait un au-dessus.
 *
 * Usage : npx tsx menage-references/p13-fusion-art-de-la-magie.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

const SOURCE_ID = 20
const SOURCE_NOM = 'Connaissance de la magie'
const CIBLE_ID = 164
const CIBLE_NOM = 'Art de la magie'

// --- Garde-fou 1 : les deux lignes sont bien celles qu'on croit -------------
const src = (await sql`SELECT id, nom, est_catalogue FROM skills WHERE id = ${SOURCE_ID}`)[0] as any
const cib = (await sql`SELECT id, nom, est_catalogue FROM skills WHERE id = ${CIBLE_ID}`)[0] as any

if (!src) {
  console.log(`✅ Rien à faire : la ligne [${SOURCE_ID}] n'existe plus — la fusion est déjà passée.`)
  const reste = await sql`SELECT count(*)::int AS n FROM skills WHERE nom = ${SOURCE_NOM}`
  console.log(`   Contrôle : ${(reste[0] as any).n} ligne(s) nommée(s) « ${SOURCE_NOM} » en base.`)
  process.exit(0)
}
if (src.nom !== SOURCE_NOM) throw new Error(`REFUS : [${SOURCE_ID}] se nomme « ${src.nom} », pas « ${SOURCE_NOM} ». La table a bougé depuis l'écriture du script.`)
if (!cib) throw new Error(`REFUS : la cible [${CIBLE_ID}] est absente.`)
if (cib.nom !== CIBLE_NOM) throw new Error(`REFUS : [${CIBLE_ID}] se nomme « ${cib.nom} », pas « ${CIBLE_NOM} ».`)
if (!cib.est_catalogue) throw new Error(`REFUS : la cible « ${CIBLE_NOM} » n'est pas une entrée de catalogue — on ne fusionne pas vers une ligne de fiche.`)

// --- Garde-fou 2 : aucune autre table ne pointe vers la source --------------
const refSkills = await sql`SELECT id, nom FROM skills WHERE catalogue_id = ${SOURCE_ID}`
if (refSkills.length) throw new Error(`REFUS : ${refSkills.length} ligne(s) de skills ont catalogue_id = ${SOURCE_ID} : ${JSON.stringify(refSkills)}`)
const refClasses = await sql`SELECT id FROM class_skill_list WHERE skill_id = ${SOURCE_ID}`
if (refClasses.length) throw new Error(`REFUS : ${refClasses.length} ligne(s) de class_skill_list pointent vers ${SOURCE_ID}.`)

// --- État avant, archivé ----------------------------------------------------
const avant = await sql`
  SELECT cs.id, cs.personnage_id, c.nom AS perso, cs.skill_id, cs.rangs_investis, cs.modif_divers
  FROM character_skills cs JOIN characters c ON c.id = cs.personnage_id
  WHERE cs.skill_id IN (${SOURCE_ID}, ${CIBLE_ID}) ORDER BY cs.personnage_id, cs.skill_id`

const niveaux = await sql`
  SELECT cc.personnage_id, sum(cc.niveau)::int AS niveau_total,
         bool_or(EXISTS (SELECT 1 FROM class_skill_list csl
                         WHERE csl.classe_id = cc.classe_id AND csl.skill_id = ${CIBLE_ID})) AS de_classe
  FROM character_classes cc GROUP BY cc.personnage_id`
const plafondDe = new Map<number, number>()
for (const n of niveaux as any[]) plafondDe.set(n.personnage_id, n.de_classe ? n.niveau_total + 3 : Math.floor((n.niveau_total + 3) / 2))

// --- Plan -------------------------------------------------------------------
type Ligne = { id: number; personnage_id: number; perso: string; skill_id: number; rangs_investis: number; modif_divers: number }
const parPerso = new Map<number, Ligne[]>()
for (const l of avant as Ligne[]) {
  if (!parPerso.has(l.personnage_id)) parPerso.set(l.personnage_id, [])
  parPerso.get(l.personnage_id)!.push(l)
}

const repointer: Ligne[] = []
const supprimer: Ligne[] = []
const majRangs: { ligne: Ligne; de: number; vers: number }[] = []
const depassements: string[] = []

for (const [pid, lignes] of parPerso) {
  const srcL = lignes.find(l => l.skill_id === SOURCE_ID)
  const cibL = lignes.find(l => l.skill_id === CIBLE_ID)
  if (!srcL) continue // ne porte qu'Art de la magie : on n'y touche pas

  const plafond = plafondDe.get(pid) ?? 0
  if (!cibL) {
    // Porteur exclusif : la ligne change de compétence, rangs inchangés.
    repointer.push(srcL)
    if (srcL.rangs_investis > plafond) depassements.push(`${srcL.perso} : ${srcL.rangs_investis} rangs > plafond ${plafond}`)
  } else {
    const rangs = Math.max(srcL.rangs_investis, cibL.rangs_investis)
    const divers = Math.max(srcL.modif_divers, cibL.modif_divers)
    if (rangs > plafond) depassements.push(`${srcL.perso} : max(${srcL.rangs_investis}, ${cibL.rangs_investis}) = ${rangs} rangs > plafond ${plafond}`)
    if (rangs !== cibL.rangs_investis || divers !== cibL.modif_divers) {
      majRangs.push({ ligne: cibL, de: cibL.rangs_investis, vers: rangs })
      cibL.modif_divers = divers
      cibL.rangs_investis = rangs
    }
    supprimer.push(srcL)
  }
}

console.log(`\n=== FUSION « ${SOURCE_NOM} » [${SOURCE_ID}] vers « ${CIBLE_NOM} » [${CIBLE_ID}] ===`)
console.log(`Mode : ${ECRIRE ? 'ÉCRITURE' : 'essai à blanc (ajouter --ecrire)'}\n`)

console.log(`— ${repointer.length} ligne(s) qui changent de compétence (porteur exclusif) :`)
for (const l of repointer) console.log(`   ${l.perso} — ${l.rangs_investis} rangs, divers ${l.modif_divers} (plafond ${plafondDe.get(l.personnage_id)})`)

console.log(`\n— ${supprimer.length} ligne(s) redondante(s) supprimee(s) (le personnage portait deja « ${CIBLE_NOM} ») :`)
for (const l of supprimer) {
  const maj = majRangs.find(m => m.ligne.personnage_id === l.personnage_id)
  console.log(`   ${l.perso} — Connaissance ${l.rangs_investis} rangs${maj ? ` ; Art passe de ${maj.de} a ${maj.vers} rangs ⚠` : ' ; Art inchange'}`)
}

if (depassements.length) {
  console.error(`\n❌ REFUS — ${depassements.length} rang(s) au-dessus du plafond :`)
  for (const d of depassements) console.error('   ' + d)
  process.exit(1)
}

if (!ECRIRE) {
  console.log('\nRien ecrit. Relancer avec --ecrire.')
  process.exit(0)
}

// --- Archive avant écriture -------------------------------------------------
const archive = 'X:/Claude-Tools/cormac/menage-references/p13-fusion-etat-avant.json'
fs.writeFileSync(archive + '.tmp', JSON.stringify({ source: src, cible: cib, lignes: avant }, null, 1), 'utf8')
fs.renameSync(archive + '.tmp', archive)
console.log(`\nEtat d'avant archive : ${archive}`)

// --- Écriture ---------------------------------------------------------------
for (const m of majRangs) {
  await sql`UPDATE character_skills SET rangs_investis = ${m.vers}, modif_divers = ${m.ligne.modif_divers} WHERE id = ${m.ligne.id}`
  console.log(`   * ${m.ligne.perso} : Art de la magie ${m.de} -> ${m.vers} rangs`)
}
for (const l of repointer) {
  await sql`UPDATE character_skills SET skill_id = ${CIBLE_ID} WHERE id = ${l.id} AND skill_id = ${SOURCE_ID}`
  console.log(`   * ${l.perso} : ligne repointee vers « ${CIBLE_NOM} »`)
}
for (const l of supprimer) {
  await sql`DELETE FROM character_skills WHERE id = ${l.id} AND skill_id = ${SOURCE_ID}`
  console.log(`   x ${l.perso} : ligne redondante supprimee`)
}

// --- La ligne de catalogue, seulement si elle est devenue orpheline ---------
const restants = (await sql`SELECT count(*)::int AS n FROM character_skills WHERE skill_id = ${SOURCE_ID}`)[0] as any
if (restants.n !== 0) throw new Error(`ARRET : ${restants.n} porteur(s) pointent encore vers [${SOURCE_ID}] — la ligne n'est PAS supprimee.`)
await sql`DELETE FROM skills WHERE id = ${SOURCE_ID} AND nom = ${SOURCE_NOM}`
console.log(`   x skills [${SOURCE_ID}] « ${SOURCE_NOM} » supprimee (0 porteur restant)`)

// --- Contrôle final ---------------------------------------------------------
const apres = await sql`
  SELECT c.nom AS perso, cs.rangs_investis, cs.modif_divers
  FROM character_skills cs JOIN characters c ON c.id = cs.personnage_id
  WHERE cs.skill_id = ${CIBLE_ID} ORDER BY c.nom`
const orph = await sql`SELECT count(*)::int AS n FROM skills WHERE id = ${SOURCE_ID}`
const doubles = await sql`
  SELECT personnage_id, count(*)::int AS n FROM character_skills
  WHERE skill_id = ${CIBLE_ID} GROUP BY personnage_id HAVING count(*) > 1`
console.log(`\n=== APRES ===`)
console.log(`« ${CIBLE_NOM} » : ${apres.length} porteurs (18 avant + 2 repointes = 20 attendu)`)
console.log(`ligne [${SOURCE_ID}] en base : ${(orph[0] as any).n} (0 attendu)`)
console.log(`personnages avec deux lignes « ${CIBLE_NOM} » : ${doubles.length} (0 attendu)`)
for (const a of apres as any[]) console.log(`   ${a.perso} — ${a.rangs_investis} rangs, divers ${a.modif_divers}`)

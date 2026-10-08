/**
 * Mesure l'impact AVANT de corriger la liste de compétences de classe en dur
 * (src/lib/dnd35/skills.ts).
 *
 * Le plafond de rangs dépend de ce statut : niveau global + 3 en compétence de
 * classe, la moitié hors classe. 19 entrées de la liste en dur accordent le
 * statut « de classe » là où le livre ne le donne pas. Les retirer peut rendre
 * ILLÉGAUX des rangs déjà saisis sur des fiches existantes.
 *
 * On ne corrige rien ici : on compte qui serait touché, pour qu'André décide
 * en connaissance de cause. Lecture seule.
 *
 * Usage : npx tsx menage-references/p12-impact-plafonds.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills.ts'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const apos = (s: string) => s.replace(/[\u2018\u2019\u02bc]/g, "'")
const mere = (nom: string) => {
  const n = apos(nom)
  const i = n.indexOf(' (')
  return i > 0 && n.endsWith(')') ? n.slice(0, i) : n
}

const releve = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p12-classes-competences.json', 'utf8')
).classes as Record<string, { competences: { nom: string }[] }>

const livre = new Map<string, Set<string>>()
for (const [classe, v] of Object.entries(releve)) livre.set(classe, new Set(v.competences.map(c => apos(c.nom))))

const code = new Map<string, Set<string>>()
for (const c of COMPETENCES_DND35) {
  for (const classe of c.classesCompetence) {
    if (!code.has(classe)) code.set(classe, new Set())
    code.get(classe)!.add(mere(c.nom))
  }
}

/** Les rangs saisis, avec le niveau total du porteur et ses classes. */
const lignes = await sql`
  SELECT p.id, p.nom personnage, s.nom competence, cs.rangs_investis rangs,
    COALESCE((SELECT sum(cl.niveau)::int FROM character_classes cl WHERE cl.personnage_id = p.id), 0) niveau,
    COALESCE((SELECT string_agg(c.nom, '|') FROM character_classes cl JOIN classes c ON c.id = cl.classe_id
              WHERE cl.personnage_id = p.id), '') classes
  FROM character_skills cs
  JOIN characters p ON p.id = cs.personnage_id
  JOIN skills s ON s.id = cs.skill_id
  WHERE cs.rangs_investis > 0
  ORDER BY p.nom, s.nom` as any[]

const statut = (table: Map<string, Set<string>>, classes: string[], competence: string) =>
  classes.some(cl => table.get(cl)?.has(mere(competence)))

const perdent: any[] = []
const gagnent: any[] = []
const illegaux: any[] = []

for (const l of lignes) {
  const classes = l.classes ? l.classes.split('|') : []
  if (!classes.length || !l.niveau) continue
  const avant = statut(code, classes, l.competence)
  const apres = statut(livre, classes, l.competence)
  if (avant === apres) continue
  const plafondApres = apres ? l.niveau + 3 : Math.floor((l.niveau + 3) / 2)
  const ligne = { ...l, classes, plafondApres }
  if (avant && !apres) {
    perdent.push(ligne)
    if (l.rangs > plafondApres) illegaux.push(ligne)
  } else gagnent.push(ligne)
}

console.log('=== IMPACT DE L\'ALIGNEMENT DE LA LISTE EN DUR SUR LE LIVRE ===')
console.log(`  ${lignes.length} lignes de compétence avec au moins 1 rang, sur les fiches\n`)
console.log(`  PERDENT le statut « de classe » : ${perdent.length} lignes chez ${new Set(perdent.map(p => p.personnage)).size} personnages`)
console.log(`  GAGNENT le statut « de classe »  : ${gagnent.length} lignes chez ${new Set(gagnent.map(p => p.personnage)).size} personnages`)
console.log(`\n  ⚠️  RANGS QUI DEVIENDRAIENT ILLÉGAUX : ${illegaux.length}`)
for (const i of illegaux) {
  console.log(`      ${i.personnage.padEnd(22)} ${i.competence.padEnd(26)} ${i.rangs} rangs > plafond ${i.plafondApres}   (${i.classes.join('/')}, niveau ${i.niveau})`)
}
if (!illegaux.length) console.log('      aucun — toutes les fiches restent légales après alignement.')

console.log('\n  --- détail des pertes de statut (rangs toujours légaux) ---')
const parCompetence = new Map<string, number>()
for (const p of perdent) parCompetence.set(p.competence, (parCompetence.get(p.competence) ?? 0) + 1)
for (const [c, n] of [...parCompetence].sort((a, b) => b[1] - a[1])) console.log(`      ${c.padEnd(26)} ${n} ligne(s)`)

/* ÉPROUVER LES CONTRÔLES DE L'HISTOIRE PAR MUTATION.
 *
 *   node scripts/eprouve-controle-histoire.mjs
 *
 * Un contrôle qui passe au vert ne prouve rien tant qu'on n'a pas vu ce qui le
 * fait rougir. Ce script casse `src/lib/histoire.ts` d'une façon précise, relance
 * `controle-histoire.mts`, et EXIGE qu'il échoue. Puis il restaure le fichier.
 *
 * Chaque mutation vise un piège réel, pas une faute improbable :
 *   1. écraser les lignes vides du récit — c'est la faute naturelle quand on
 *      « nettoie » du texte, et elle détruirait tous les paragraphes;
 *   2. chercher l'italique avant le gras — `**mot**` rendrait des astérisques;
 *   3. accepter « -5 au jet » comme une puce — un tiret sans espace n'est pas
 *      une liste;
 *   4. laisser la signature vide au lieu de null — une colonne qui dit
 *      « quelqu'un a signé, sans nom ».
 *
 * ⛔ Le fichier est restauré dans un `finally` : une épreuve qui laisse le code
 * muté derrière elle est pire que pas d'épreuve.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CIBLE = path.join(RACINE, 'src', 'lib', 'histoire.ts')
const original = fs.readFileSync(CIBLE, 'utf8')

const MUTATIONS = [
  {
    nom: '1. le récit perd ses lignes vides (paragraphes détruits)',
    de: `    .replace(/^\\n+|\\n+$/g, '')`,
    vers: `    .replace(/\\n{2,}/g, '\\n')
    .replace(/^\\n+|\\n+$/g, '')`,
  },
  {
    nom: '2. l’italique est cherché AVANT le gras (** rend des astérisques)',
    de: `    if (reste.startsWith('**')) {`,
    vers: `    if (false) {`,
  },
  {
    nom: '3. « -5 au jet » passe pour une puce de liste',
    de: `    const item = /^(?:[-*•]|—|–)\\s+(.*)$/.exec(l)`,
    vers: `    const item = /^(?:[-*•]|—|–)\\s*(.*)$/.exec(l)`,
  },
  {
    nom: '4. la signature vide part en base au lieu de null',
    de: `    signature: signature || null,`,
    vers: `    signature: signature,`,
  },
]

function lanceControles() {
  try {
    const sortie = execFileSync('npx', ['tsx', 'scripts/controle-histoire.mts'], {
      cwd: RACINE, encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, sortie }
  } catch (e) {
    return { code: e.status ?? 1, sortie: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

const resultats = []
try {
  // Référence : le code intact doit passer. Sans ce point de départ, une épreuve
  // « le code muté échoue » serait satisfaite par un contrôle cassé en permanence.
  const ref = lanceControles()
  const nbRef = /(\d+) contrôle\(s\) réussi\(s\), (\d+) échec/.exec(ref.sortie)
  console.log(`RÉFÉRENCE  code=${ref.code} · ${nbRef ? `${nbRef[1]} réussis, ${nbRef[2]} échecs` : 'illisible'}`)
  resultats.push({ nom: '0. code intact (doit PASSER)', attendu: 'vert', obtenu: ref.code === 0 ? 'vert' : 'rouge' })

  for (const m of MUTATIONS) {
    if (!original.includes(m.de)) {
      resultats.push({ nom: m.nom, attendu: 'rouge', obtenu: 'MOTIF INTROUVABLE' })
      continue
    }
    fs.writeFileSync(CIBLE, original.replace(m.de, m.vers), 'utf8')
    const r = lanceControles()
    const n = /(\d+) contrôle\(s\) réussi\(s\), (\d+) échec/.exec(r.sortie)
    console.log(`MUTATION   ${m.nom}`)
    console.log(`           code=${r.code} · ${n ? `${n[1]} réussis, ${n[2]} échecs` : 'illisible'}`)
    resultats.push({ nom: m.nom, attendu: 'rouge', obtenu: r.code === 0 ? 'vert' : 'rouge', echecs: n?.[2] })
    fs.writeFileSync(CIBLE, original, 'utf8')
  }
} finally {
  fs.writeFileSync(CIBLE, original, 'utf8')
  const restaure = fs.readFileSync(CIBLE, 'utf8') === original
  console.log(`\nFichier restauré à l’identique : ${restaure}`)
  if (!restaure) {
    console.error('⛔ LE FICHIER N’EST PAS RESTAURÉ — à vérifier à la main avant tout commit.')
    process.exitCode = 1
  }
}

console.log('')
let rates = 0
for (const r of resultats) {
  const bon = r.obtenu === r.attendu
  if (!bon) rates++
  console.log(`${bon ? '✅' : '⛔'} ${r.nom} — attendu ${r.attendu}, obtenu ${r.obtenu}${r.echecs ? ` (${r.echecs} échecs)` : ''}`)
}
console.log(`\n${resultats.length - rates} épreuve(s) sur ${resultats.length} concluante(s).`)
if (rates) process.exitCode = 1

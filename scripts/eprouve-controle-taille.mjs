/* ÉPROUVER LES CONTRÔLES DE LA TAILLE PAR MUTATION.
 *
 *   node scripts/eprouve-controle-taille.mjs
 *
 * Un contrôle vert ne prouve rien tant qu'on n'a pas vu ce qui le fait rougir.
 *
 * Les mutations visent les erreurs que j'aurais pu commettre pour de vrai, et
 * les deux premières sont celles qui auraient faussé une fiche en silence :
 *   1. les signes de la table s'inversent — c'est EXACTEMENT ce que mon premier
 *      relevé du SRD produisait, parce que le signe moins y est le mot de
 *      contrôle `\endash` qu'un déshabillage naïf efface sans trace;
 *   2. la Discrétion reçoit la table de la CA (+1 au lieu de +4) — trois tables
 *      pour la même catégorie, et rien sur la fiche ne dirait laquelle a servi;
 *   3. la catégorie est reconnue par inclusion — « très petite » devient
 *      « petite » et perd la moitié de son modificateur;
 *   4. le modificateur s'ajoute aux DÉGÂTS, où le livre ne lui donne rien;
 *   5. une taille inconnue est devinée « Moyenne » au lieu de ne rien donner;
 *   6. le multiplicateur de charge par défaut n'est plus neutre — les 68 fiches
 *      de taille moyenne verraient leurs seuils bouger;
 *   7. la ligne de détail de l'attaque disparaît : le total bouge sans
 *      explication, et personne ne peut le vérifier à la table.
 *
 * ⛔ Les fichiers sont restaurés dans un `finally`.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const FICHIERS = {
  taille: path.join(RACINE, 'src', 'lib', 'dnd35', 'taille.ts'),
  attaque: path.join(RACINE, 'src', 'lib', 'dnd35', 'attaque.ts'),
  encumbrance: path.join(RACINE, 'src', 'lib', 'dnd35', 'encumbrance.ts'),
}
const ORIGINAUX = Object.fromEntries(
  Object.entries(FICHIERS).map(([k, p]) => [k, fs.readFileSync(p, 'utf8')])
)

const MUTATIONS = [
  {
    nom: '1. ⛔ les signes de la table s’inversent (le piège du RTF)',
    cible: 'taille',
    de: `  'Grande':      { modificateur: -1, discretion: -4,  charge: 2,     abrege: 'G' },`,
    vers: `  'Grande':      { modificateur: 1, discretion: 4,  charge: 2,     abrege: 'G' },`,
  },
  {
    nom: '2. ⛔ la Discrétion reçoit la table de la CA (+1 au lieu de +4)',
    cible: 'taille',
    de: `  const cat = categorieTaille(brut)
  return cat ? TAILLES[cat].discretion : 0`,
    vers: `  const cat = categorieTaille(brut)
  return cat ? TAILLES[cat].modificateur : 0`,
  },
  {
    nom: '3. ⛔ la catégorie est reconnue par inclusion (« très petite » → « petite »)',
    cible: 'taille',
    de: `  for (const [cat, mots] of formes) if (mots.includes(n)) return cat`,
    vers: `  for (const [cat, mots] of formes) if (mots.some(m => n.includes(m))) return cat`,
  },
  {
    nom: '4. ⛔ le modificateur de taille s’ajoute aux DÉGÂTS',
    cible: 'attaque',
    de: `  const degatsMod = alteration + caracDmg + donsDmg + bonusPerspicace`,
    vers: `  const degatsMod = alteration + caracDmg + donsDmg + bonusPerspicace + modTaille`,
  },
  {
    nom: '5. ⛔ une taille inconnue est devinée « Moyenne »',
    cible: 'taille',
    de: `  for (const [cat, mots] of formes) if (mots.includes(n)) return cat
  return null`,
    vers: `  for (const [cat, mots] of formes) if (mots.includes(n)) return cat
  return 'Moyenne'`,
  },
  {
    nom: '6. ⛔ le multiplicateur de charge par défaut n’est plus neutre',
    cible: 'encumbrance',
    de: `export function getChargeLimites(str: number, multTaille = 1): { legere: number; moyenne: number; lourde: number } {`,
    vers: `export function getChargeLimites(str: number, multTaille = 0.75): { legere: number; moyenne: number; lourde: number } {`,
  },
  {
    nom: '8. ⛔ le défaut de la version en KILOGRAMMES n’est plus neutre',
    cible: 'encumbrance',
    de: `export function getChargeLimitesKg(str: number, multTaille = 1): { legere: number; moyenne: number; lourde: number } {`,
    vers: `export function getChargeLimitesKg(str: number, multTaille = 0.75): { legere: number; moyenne: number; lourde: number } {`,
  },
  {
    nom: '7. la ligne de détail de l’attaque disparaît (total sans explication)',
    cible: 'attaque',
    de: `      ...(modTaille !== 0
        ? [{
            label: 'modificateur de taille',`,
    vers: `      ...(false
        ? [{
            label: 'modificateur de taille',`,
  },
]

function lanceControles() {
  try {
    const sortie = execFileSync('npx', ['tsx', 'scripts/controle-taille.mts'], {
      cwd: RACINE, encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, sortie }
  } catch (e) {
    return { code: e.status ?? 1, sortie: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

function restaureTout() {
  for (const [k, p] of Object.entries(FICHIERS)) fs.writeFileSync(p, ORIGINAUX[k], 'utf8')
}

const resultats = []
try {
  const ref = lanceControles()
  const nbRef = /(\d+) contrôle\(s\) réussi\(s\), (\d+) échec/.exec(ref.sortie)
  console.log(`RÉFÉRENCE  code=${ref.code} · ${nbRef ? `${nbRef[1]} réussis, ${nbRef[2]} échecs` : 'illisible'}`)
  resultats.push({ nom: '0. code intact (doit PASSER)', attendu: 'vert', obtenu: ref.code === 0 ? 'vert' : 'rouge' })

  for (const m of MUTATIONS) {
    const original = ORIGINAUX[m.cible]
    if (!original.includes(m.de)) {
      resultats.push({ nom: m.nom, attendu: 'rouge', obtenu: 'MOTIF INTROUVABLE' })
      continue
    }
    fs.writeFileSync(FICHIERS[m.cible], original.replace(m.de, m.vers), 'utf8')
    const r = lanceControles()
    const n = /(\d+) contrôle\(s\) réussi\(s\), (\d+) échec/.exec(r.sortie)
    console.log(`MUTATION   ${m.nom}`)
    console.log(`           code=${r.code} · ${n ? `${n[1]} réussis, ${n[2]} échecs` : 'illisible'}`)
    resultats.push({ nom: m.nom, attendu: 'rouge', obtenu: r.code === 0 ? 'vert' : 'rouge', echecs: n?.[2] })
    restaureTout()
  }
} finally {
  restaureTout()
  const intacts = Object.entries(FICHIERS).every(([k, p]) => fs.readFileSync(p, 'utf8') === ORIGINAUX[k])
  console.log(`\nFichiers restaurés à l’identique : ${intacts}`)
  if (!intacts) {
    console.error('⛔ UN FICHIER N’EST PAS RESTAURÉ — à vérifier à la main avant tout commit.')
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

/**
 * PAGINATION DES FICHES RÉELLES — avant / après une retouche du papier
 *
 *   node scripts/mesure-pagination-fiches.mjs avant
 *   node scripts/mesure-pagination-fiches.mjs apres
 *   node scripts/mesure-pagination-fiches.mjs apres https://www.dracovick.com 104,27,20
 *
 * `mesure-pagination.mjs` couvre les feuilles VIERGES. Celui-ci couvre les
 * fiches de personnages, parce qu'une cellule qui s'allonge n'y déborde pas de
 * la même façon : la table d'en-tête a des largeurs en pourcentage, et un texte
 * trop long y boucle sur deux lignes au lieu d'élargir la colonne. Une ligne de
 * plus en tête de feuille repousse tout le reste — c'est ce qui a fait passer
 * Lucky de 4 à 5 pages.
 *
 * ⛔ La largeur mesurée à l'ÉCRAN ne dit rien du papier : 779 px à l'écran
 * contre ~652 à l'impression. Seul le PDF tranche.
 */
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOMENT = process.argv[2] === 'apres' ? 'apres' : 'avant'
const BASE = process.argv[3] ?? 'https://www.dracovick.com'
const CIBLES = process.argv[4]?.split(',').map(Number)
const COOKIE = 'cormac_auth=granted'

function pagesDe(fichier) {
  const sortie = execFileSync('pdfinfo', [fichier], { encoding: 'utf8' })
  return Number(sortie.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0)
}

async function page(url) {
  const r = await fetch(url, { headers: { Cookie: COOKIE }, redirect: 'follow' })
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`)
  return r.text()
}

let ids = CIBLES
if (!ids) {
  const accueil = await page(`${BASE}/`)
  ids = [...new Set([...accueil.matchAll(/\/personnage\/(\d+)/g)].map(m => Number(m[1])))].sort((a, b) => a - b)
}
console.log(`${ids.length} fiche(s) à mesurer sur ${BASE}`)

const lignes = []
for (const id of ids) {
  const url = `${BASE}/api/pdf?cible=${encodeURIComponent(`/personnage/${id}/imprimer`)}`
  const r = await fetch(url, { headers: { Cookie: COOKIE } })
  if (!r.ok) { lignes.push(`[${id}] HTTP ${r.status}`); continue }
  const fichier = join(tmpdir(), `pagination-fiche-${id}.pdf`)
  writeFileSync(fichier, Buffer.from(await r.arrayBuffer()))
  lignes.push(`[${id}] ${pagesDe(fichier)} page(s)`)
  unlinkSync(fichier)
}

mkdirSync(join(RACINE, '.scratch'), { recursive: true })
const sortie = join(RACINE, '.scratch', `pagination-${MOMENT}.txt`)
writeFileSync(sortie, lignes.join('\n') + '\n', 'utf8')
console.log(lignes.join('\n'))
console.log(`\n→ ${sortie}`)

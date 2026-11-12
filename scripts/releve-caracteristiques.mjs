/**
 * RELEVÉ DES CARACTÉRISTIQUES EN PRODUCTION — avant / après
 *
 *   node scripts/releve-caracteristiques.mjs avant
 *   node scripts/releve-caracteristiques.mjs apres
 *
 * Les six caractéristiques totales d'une fiche ne sont pas stockées : elles
 * sont calculées à l'affichage en ajoutant `races.bonus_*` aux valeurs de base.
 * Toucher aux races est donc exactement le genre de changement qui déplace un
 * chiffre sur une fiche à laquelle on croyait ne pas toucher.
 *
 * Ce script lit les panneaux rendus par la page du personnage, fiche par fiche,
 * et écrit un fichier plat comparable d'un déploiement à l'autre.
 *
 *   diff .scratch/releve-avant.txt .scratch/releve-apres.txt
 *
 * ⚠ `-L` est indispensable : dracovick.com répond 308 vers www.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MOMENT = process.argv[2] === 'apres' ? 'apres' : 'avant'
const BASE = process.argv[3] ?? 'https://www.dracovick.com'
const COOKIE = 'cormac_auth=granted'

const sortie = path.join(RACINE, '.scratch', `releve-${MOMENT}.txt`)
fs.mkdirSync(path.dirname(sortie), { recursive: true })

async function page(url) {
  const r = await fetch(url, { headers: { Cookie: COOKIE }, redirect: 'follow' })
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`)
  return r.text()
}

// La liste des fiches, pour ne pas supposer les identifiants.
const liste = await page(`${BASE}/`)
const ids = [...new Set([...liste.matchAll(/\/personnage\/(\d+)/g)].map(m => Number(m[1])))].sort((a, b) => a - b)
console.log(`${ids.length} fiches à relever sur ${BASE}`)

const lignes = []
let panneaux = 0
for (const id of ids) {
  let html
  try { html = await page(`${BASE}/personnage/${id}`) }
  catch (e) { lignes.push(`[${id}] ERREUR ${e.message}`); continue }

  // Le nom, la race, puis chaque bloc de caractéristique : le libellé court
  // (FOR, DEX…) suivi de son total. On relève la forme brute, sans
  // interprétation — c'est la comparaison qui juge, pas ce script.
  const nom = html.match(/>Nom<\/dt><dd[^>]*>([^<]{1,60})</)?.[1]?.trim()
    ?? html.match(/<h1[^>]*>([^<]{1,60})</)?.[1]?.trim() ?? '?'
  // Le panneau rendu : <span …>FOR</span><span …>12</span><span …>+1</span>
  // On relève la VALEUR et le MODIFICATEUR, parce qu'un bonus racial mal
  // appliqué déplace les deux — et qu'un seul des deux suffirait à passer
  // inaperçu si l'autre n'était pas relevé.
  const carac = [...html.matchAll(/>(FOR|DEX|CON|INT|SAG|CHA)<\/span><span[^>]*>(-?\d+)<\/span><span[^>]*>([+-]\d+)</g)]
    .map(m => `${m[1]}=${m[2]}(${m[3]})`)
  const race = html.match(/>Race<\/dt><dd[^>]*>([^<]{1,40})</)?.[1]?.trim() ?? '?'
  panneaux += carac.length
  lignes.push(`[${id}] ${nom} | race=${race} | ${carac.join(' ')}`)
}

fs.writeFileSync(sortie, lignes.join('\n') + '\n', 'utf8')
console.log(`${lignes.length} fiches, ${panneaux} panneaux de caractéristique → ${sortie}`)

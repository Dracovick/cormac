/**
 * RELEVÉ EN PRODUCTION — les compteurs d'emplacements de sorts de chaque fiche.
 *
 *   node scripts/releve-prod-emplacements.mjs avant
 *   node scripts/releve-prod-emplacements.mjs apres
 *
 * Lit les infobulles `title="Niveau N : …"` servies par la production et les
 * écrit dans `.scratch/`. Relève AUSSI les six panneaux de caractéristique de
 * chaque fiche : ce sont eux qui ne doivent PAS bouger.
 *
 * ⚠️ Mesuré sur la page servie, pas sur le code : c'est en lisant le HTML de la
 * production qu'on a vu, le 12 novembre, que l'encart du formulaire affichait
 * encore « Halfelin vaillant » sous un menu qui disait « Petite-gens ».
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const etiquette = process.argv[2] ?? 'releve'
const SORTIE = path.join(RACINE, '.scratch', `prod-emplacements-${etiquette}.json`)
fs.mkdirSync(path.dirname(SORTIE), { recursive: true })

const COOKIE = 'cormac_auth=granted'
const BASE = 'https://www.dracovick.com'

// Les 74 fiches : on balaie large et on ignore les 404.
const ids = Array.from({ length: 110 }, (_, i) => i + 1)

const resultat = {}
for (const id of ids) {
  const r = await fetch(`${BASE}/personnage/${id}`, { headers: { Cookie: COOKIE }, redirect: 'follow' })
  if (!r.ok) continue
  const html = await r.text()
  const compteurs = [...html.matchAll(/title="Niveau (\d) : ([^"]*)"/g)].map(m => `${m[1]}:${m[2]}`)
  // Les six panneaux de caractéristique : « >16</div> » suivi du modificateur.
  const panneaux = [...html.matchAll(/>(FOR|DEX|CON|INT|SAG|CHA)<\/span><span[^>]*>(\d+)<\/span><span[^>]*>([+-]\d+)<\/span>/g)]
    .map(m => `${m[1]} ${m[2]} ${m[3]}`)
  if (compteurs.length === 0 && panneaux.length === 0) continue
  resultat[id] = { compteurs, panneaux }
  process.stdout.write('.')
}
fs.writeFileSync(SORTIE, JSON.stringify(resultat, null, 1), 'utf8')
const nbFiches = Object.keys(resultat).length
const nbCompteurs = Object.values(resultat).reduce((s, v) => s + v.compteurs.length, 0)
const nbPanneaux = Object.values(resultat).reduce((s, v) => s + v.panneaux.length, 0)
console.log(`\n${nbFiches} fiche(s), ${nbCompteurs} compteur(s) d'emplacements, ${nbPanneaux} panneau(x) de caractéristique → ${SORTIE}`)

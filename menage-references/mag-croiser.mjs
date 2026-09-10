// Croise un relevé du Manuel (fichier NIVEAU|ÉCOLE|NOM|DESCRIPTION) avec le
// catalogue statique déjà en place, pour savoir quel sort est DÉJÀ présent
// (et dans quel fichier) et lequel est réellement nouveau.
//
// Un sort déjà présent ne doit JAMAIS être recopié : SORTS_DND35 est une
// concaténation brute et le nom est une clé de jointure.
//
// Usage : node menage-references/mag-croiser.mjs menage-references/mag-releve-0-2.txt

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')
const FICHIERS = ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-supplements.ts']

function cle(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Index du catalogue existant : clé normalisée -> entrées
const index = new Map()
for (const f of FICHIERS) {
  const chemin = join(RACINE, f)
  if (!existsSync(chemin)) continue
  const texte = readFileSync(chemin, 'utf8')
  const re = /\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = re.exec(texte)) !== null) {
    const nom = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"')
    const suite = texte.slice(m.index, m.index + 900)
    const nv = suite.match(/niveaux:\s*\{([^}]*)\}/)
    const ec = suite.match(/ecole:\s*'([^']*)'/)
    const ligne = texte.slice(0, m.index).split('\n').length
    const k = cle(nom)
    if (!index.has(k)) index.set(k, [])
    index.get(k).push({ nom, fichier: f, ligne, niveaux: nv ? nv[1].trim() : '', ecole: ec ? ec[1] : '' })
  }
}

const releve = readFileSync(process.argv[2], 'utf8').split('\n')
  .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(l => { const [niveau, ecole, nom, desc] = l.split('|'); return { niveau: +niveau, ecole, nom, desc } })

const nouveaux = []
const presents = []
const aCorriger = []

for (const s of releve) {
  const trouve = index.get(cle(s.nom))
  if (!trouve) { nouveaux.push(s); continue }
  const e = trouve[0]
  presents.push({ ...s, ...e })
  // Le sort existe : porte-t-il déjà les DEUX niveaux, et les bons ?
  const mag = e.niveaux.match(/Magicien:\s*(\d+)/)
  const ens = e.niveaux.match(/Ensorceleur:\s*(\d+)/)
  const pbs = []
  if (!mag) pbs.push('Magicien ABSENT')
  else if (+mag[1] !== s.niveau) pbs.push(`Magicien: ${mag[1]} ≠ ${s.niveau} (Manuel)`)
  if (!ens) pbs.push('Ensorceleur ABSENT')
  else if (+ens[1] !== s.niveau) pbs.push(`Ensorceleur: ${ens[1]} ≠ ${s.niveau} (Manuel)`)
  if (e.ecole && s.ecole && e.ecole !== s.ecole) pbs.push(`école « ${e.ecole} » ≠ « ${s.ecole} » (Manuel)`)
  if (trouve.length > 1) pbs.push(`DOUBLON DÉJÀ EN PLACE (${trouve.length}×)`)
  if (pbs.length) aCorriger.push({ ...s, ...e, pbs })
}

const n = releve.length
console.log(`Relevé : ${n} sorts.  Déjà présents : ${presents.length}.  Nouveaux : ${nouveaux.length}.`)
console.log(`Par niveau : ` + [...new Set(releve.map(s => s.niveau))].sort()
  .map(l => `niv.${l} = ${releve.filter(s => s.niveau === l).length}`).join(', '))

console.log(`\n${'═'.repeat(78)}\nÀ CORRIGER SUR PLACE — ${aCorriger.length} entrées existantes incomplètes ou divergentes\n${'═'.repeat(78)}`)
for (const s of aCorriger) {
  console.log(`niv.${s.niveau}  « ${s.nom} »  →  ${s.fichier}:${s.ligne}`)
  console.log(`        actuel : ecole '${s.ecole}', niveaux { ${s.niveaux} }`)
  console.log(`        ${s.pbs.join(' ; ')}`)
}

console.log(`\n${'═'.repeat(78)}\nNOUVEAUX — ${nouveaux.length} sorts absents du catalogue, à écrire\n${'═'.repeat(78)}`)
for (const s of nouveaux) console.log(`niv.${s.niveau}  ${s.ecole.padEnd(14)} ${s.nom}`)

console.log(`\n${'═'.repeat(78)}\nDÉJÀ CORRECTS — ${presents.length - aCorriger.length} entrées, rien à faire\n${'═'.repeat(78)}`)
const ok = presents.filter(p => !aCorriger.some(c => c.nom === p.nom))
for (const s of ok) console.log(`niv.${s.niveau}  ${s.nom}  (${s.fichier}:${s.ligne})`)

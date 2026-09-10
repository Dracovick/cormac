// Contrôle de COMPLÉTUDE : chaque sort de la liste « ensorceleur ou magicien »
// du Manuel est-il réellement accessible dans le catalogue, au bon niveau ?
//
// Ne fait aucune confiance au fichier généré : relit les sources TypeScript.
//
// Usage : node menage-references/mag-verifier.mjs

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')
const MENAGE = join(process.cwd(), 'menage-references')

function cle(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Catalogue réel
const index = new Map()
for (const f of ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-supplements.ts']) {
  const chemin = join(RACINE, f)
  if (!existsSync(chemin)) continue
  const texte = readFileSync(chemin, 'utf8')
  const re = /\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = re.exec(texte)) !== null) {
    const nom = m[2].replace(/\\'/g, "'")
    const suite = texte.slice(m.index, m.index + 900)
    const nv = suite.match(/niveaux:\s*\{([^}]*)\}/)
    const k = cle(nom)
    if (!index.has(k)) index.set(k, [])
    index.get(k).push({ nom, fichier: f, niveaux: nv ? nv[1] : '' })
  }
}

const releve = readFileSync(join(MENAGE, 'mag-releve-tout.txt'), 'utf8').split('\n')
  .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(l => { const [n, e, nom, d] = l.split('|'); return { niveau: +n, ecole: e, nom, desc: d } })

const absents = [], mauvaisNiveau = [], sansEns = []
let ok = 0
for (const s of releve) {
  const e = index.get(cle(s.nom))
  if (!e) { absents.push(s); continue }
  const toutes = e.map(x => x.niveaux).join(' ')
  const mag = toutes.match(/Magicien:\s*(\d+)/)
  const ens = toutes.match(/Ensorceleur:\s*(\d+)/)
  if (!mag || +mag[1] !== s.niveau) { mauvaisNiveau.push({ ...s, trouve: mag ? mag[1] : 'aucun' }); continue }
  if (!ens || +ens[1] !== s.niveau) { sansEns.push({ ...s, trouve: ens ? ens[1] : 'aucun' }); ok++; continue }
  ok++
}

console.log(`Liste du Manuel : ${releve.length} sorts.`)
console.log(`Accessibles au magicien au bon niveau : ${ok}`)
console.log(`Par niveau : ` + [...Array(10).keys()]
  .map(l => `${l}:${releve.filter(s => s.niveau === l).length}`).join('  '))

if (absents.length) {
  console.log(`\n⛔ ABSENTS DU CATALOGUE — ${absents.length} :`)
  for (const s of absents) console.log(`   niv.${s.niveau}  ${s.nom}`)
}
if (mauvaisNiveau.length) {
  console.log(`\n⛔ NIVEAU MAGICIEN FAUX — ${mauvaisNiveau.length} :`)
  for (const s of mauvaisNiveau) console.log(`   ${s.nom} : Manuel ${s.niveau}, catalogue ${s.trouve}`)
}
if (sansEns.length) {
  console.log(`\nSans niveau Ensorceleur (attendu pour les sorts « Magiciens uniquement ») — ${sansEns.length} :`)
  for (const s of sansEns) console.log(`   niv.${s.niveau}  ${s.nom} (Ensorceleur : ${s.trouve})`)
}
if (!absents.length && !mauvaisNiveau.length) console.log('\n✅ La liste du Manuel est couverte en entier.')

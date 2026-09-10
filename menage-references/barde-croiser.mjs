// Croise le relevé du barde avec le catalogue statique existant.
// Usage : node menage-references/barde-croiser.mjs
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')
const FICHIERS = ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-paladin-rodeur.ts', 'spells-supplements.ts', 'spells-barde.ts']

function cle(n) {
  return n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()
}

const catalogue = new Map()
for (const f of FICHIERS) {
  const p = join(RACINE, f)
  if (!existsSync(p)) { console.log(`(absent) ${f}`); continue }
  const texte = readFileSync(p, 'utf8')
  const re = /\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = re.exec(texte)) !== null) {
    const nom = m[2].replace(/\\'/g, "'")
    const suite = texte.slice(m.index, m.index + 900)
    const nv = suite.match(/niveaux:\s*\{([^}]*)\}/)
    const ligne = texte.slice(0, m.index).split('\n').length
    if (!catalogue.has(cle(nom))) catalogue.set(cle(nom), [])
    catalogue.get(cle(nom)).push({ nom, fichier: f, ligne, niveaux: nv ? nv[1].trim() : '' })
  }
}

const releve = readFileSync(join(process.cwd(), 'menage-references', 'barde-releve.txt'), 'utf8')
  .split('\n').filter(l => l.trim() && !l.startsWith('#'))
  .map(l => { const [n, nom] = l.split('|'); return { niveau: Number(n), nom: nom.trim() } })

console.log(`Relevé : ${releve.length} sorts de barde\n`)
const parNiveau = {}
for (const r of releve) parNiveau[r.niveau] = (parNiveau[r.niveau] || 0) + 1
console.log('Par niveau :', JSON.stringify(parNiveau), '\n')

const presents = [], absents = [], dejaBarde = []
for (const r of releve) {
  const e = catalogue.get(cle(r.nom))
  if (!e) { absents.push(r); continue }
  const bardeExistant = e[0].niveaux.match(/Barde:\s*(\d+)/)
  if (bardeExistant) {
    dejaBarde.push({ ...r, ...e[0], niveauExistant: Number(bardeExistant[1]) })
  } else {
    presents.push({ ...r, ...e[0] })
  }
}

console.log(`═══ DÉJÀ un niveau Barde : ${dejaBarde.length}`)
for (const d of dejaBarde) {
  const marque = d.niveauExistant === d.niveau ? '  ok' : ` ⚠ ÉCART livre=${d.niveau}`
  console.log(`  ${d.nom.padEnd(34)} ${d.fichier}:${d.ligne}  Barde:${d.niveauExistant}${marque}`)
}
console.log(`\n═══ PRÉSENT sans niveau Barde (ajout sur place) : ${presents.length}`)
for (const p of presents) console.log(`  Barde:${p.niveau}  ${p.nom.padEnd(34)} ${p.fichier}:${p.ligne}`)
console.log(`\n═══ ABSENT du catalogue (à créer) : ${absents.length}`)
for (const a of absents) console.log(`  Barde:${a.niveau}  ${a.nom}`)

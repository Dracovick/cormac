// Ajoute Paladin: n / Rôdeur: n aux entrées de sorts DÉJÀ présentes dans le
// catalogue, sur place, sans jamais recopier un sort.
//
//   node menage-references/palrod-appliquer.mjs          → simulation
//   node menage-references/palrod-appliquer.mjs --ecrire → applique (avec .bak)
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ECRIRE = process.argv.includes('--ecrire')
const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')
const FICHIERS = ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-supplements.ts']

const cle = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()

function niveauDe(texte, classe) {
  const i = texte.indexOf(classe + ':')
  if (i === -1) return null
  const n = parseInt(texte.slice(i + classe.length + 1).trim(), 10)
  return Number.isNaN(n) ? null : n
}

// ── index : nom normalisé → [{fichier, ligne(0-based), niveaux}] ──
const lignes = {}
const index = new Map()
for (const f of FICHIERS) {
  lignes[f] = readFileSync(join(RACINE, f), 'utf8').split('\n')
  lignes[f].forEach((ligne, i) => {
    const m = ligne.match(/\{\s*nom:\s*'((?:[^'\\]|\\.)*)'/)
    if (!m) return
    const nv = ligne.match(/niveaux:\s*\{([^}]*)\}/)
    if (!nv) return
    const k = cle(m[1].replace(/\\'/g, "'"))
    if (!index.has(k)) index.set(k, [])
    index.get(k).push({ fichier: f, i, niveaux: nv[1] })
  })
}

const releve = readFileSync(join(process.cwd(), 'menage-references', 'palrod-releve.txt'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(l => { const [c, n, nom] = l.split('|'); return { classe: c === 'P' ? 'Paladin' : 'Rôdeur', niveau: +n, nom } })

// ── plan : {fichier, i} → [{classe, niveau, action}] ──
const plan = new Map()
const absents = []
for (const s of releve) {
  const e = index.get(cle(s.nom))
  if (!e) { absents.push(s); continue }
  // Si la classe est déjà présente quelque part au bon niveau, rien à faire.
  const tout = e.map(x => x.niveaux).join(' , ')
  const trouve = niveauDe(tout, s.classe)
  if (trouve === s.niveau) continue
  const cible = e[0]                       // une seule entrée par nom (doublons contrôlés)
  const k = cible.fichier + '#' + cible.i
  if (!plan.has(k)) plan.set(k, { ...cible, ops: [] })
  plan.get(k).ops.push({ classe: s.classe, niveau: s.niveau, action: trouve === null ? 'ajout' : `correction ${trouve}→${s.niveau}` })
}

let nAjouts = 0, nCorr = 0
for (const [, p] of plan) {
  let ligne = lignes[p.fichier][p.i]
  for (const op of p.ops) {
    const m = ligne.match(/niveaux:\s*\{([^}]*)\}/)
    const dedans = m[1]
    if (op.action === 'ajout') {
      const remplace = `niveaux: {${dedans.replace(/\s*$/, '')}, ${op.classe}: ${op.niveau} }`
      ligne = ligne.replace(m[0], remplace)
      nAjouts++
    } else {
      const i = dedans.indexOf(op.classe + ':')
      const avant = dedans.slice(0, i + op.classe.length + 1)
      const apres = dedans.slice(i + op.classe.length + 1).replace(/^\s*\d+/, ` ${op.niveau}`)
      ligne = ligne.replace(m[0], `niveaux: {${avant}${apres}}`)
      nCorr++
    }
  }
  lignes[p.fichier][p.i] = ligne
  console.log(`${p.fichier}:${p.i + 1}  ${p.ops.map(o => o.classe + ' ' + o.niveau + ' (' + o.action + ')').join(' + ')}`)
  console.log(`    → ${ligne.match(/niveaux:\s*\{[^}]*\}/)[0]}`)
}

console.log(`\nLignes touchées : ${plan.size}   ajouts : ${nAjouts}   corrections : ${nCorr}`)
console.log(`Sorts ABSENTS du catalogue (à créer dans le nouveau fichier) : ${absents.length}`)

if (ECRIRE) {
  for (const f of FICHIERS) {
    const src = join(RACINE, f)
    const bak = join(process.cwd(), 'menage-references', f + '.avant-palrod.bak')
    if (!existsSync(bak)) copyFileSync(src, bak)
    writeFileSync(src, lignes[f].join('\n'))
  }
  console.log('\n✅ Écrit. Sauvegardes : menage-references/*.avant-palrod.bak')
} else {
  console.log('\n(simulation — relancer avec --ecrire pour appliquer)')
}

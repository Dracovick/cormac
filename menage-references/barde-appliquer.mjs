// Ajoute `Barde: n` aux entrées de sorts DÉJÀ présentes dans le catalogue, sur
// place, sans jamais recopier un sort. Corrige aussi les niveaux Barde erronés.
//
//   node menage-references/barde-appliquer.mjs          → simulation
//   node menage-references/barde-appliquer.mjs --ecrire → applique (avec .bak)
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const ECRIRE = process.argv.includes('--ecrire')
const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')
const FICHIERS = ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-paladin-rodeur.ts', 'spells-supplements.ts']

const cle = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()

// ── relevé du livre ────────────────────────────────────────────────────────
const releve = readFileSync(join(process.cwd(), 'menage-references', 'barde-releve.txt'), 'utf8')
  .split('\n').filter(l => l.trim() && !l.startsWith('#'))
  .map(l => { const [n, nom] = l.split('|'); return { niveau: Number(n), nom: nom.trim() } })
const voulu = new Map(releve.map(r => [cle(r.nom), r.niveau]))

// ── index ligne par ligne (une entrée = une ligne) ─────────────────────────
const lignes = {}
for (const f of FICHIERS) lignes[f] = readFileSync(join(RACINE, f), 'utf8').split('\n')

let ajouts = 0, corrections = 0, dejaBons = 0
const journal = []

for (const f of FICHIERS) {
  lignes[f].forEach((ligne, i) => {
    const m = ligne.match(/\{\s*nom:\s*'((?:[^'\\]|\\.)*)'/)
    if (!m) return
    const nom = m[1].replace(/\\'/g, "'")
    const k = cle(nom)
    if (!voulu.has(k)) return
    const n = voulu.get(k)

    const bloc = ligne.match(/niveaux:\s*\{([^}]*)\}/)
    if (!bloc) { journal.push(`!! ${f}:${i + 1} ${nom} — pas de bloc niveaux`); return }
    const contenu = bloc[1]

    const existant = contenu.match(/Barde:\s*(\d+)/)
    if (existant) {
      if (Number(existant[1]) === n) { dejaBons++; return }
      lignes[f][i] = ligne.replace(/Barde:\s*\d+/, `Barde: ${n}`)
      corrections++
      journal.push(`~~ ${f}:${i + 1} ${nom} — Barde ${existant[1]} → ${n}`)
      return
    }
    // Insertion en tête du bloc niveaux, en conservant la longueur de ligne au mieux.
    const nouveau = `niveaux: {${contenu.trimEnd() === '' ? '' : ''} Barde: ${n},${contenu.replace(/^\s*/, ' ')}}`
    lignes[f][i] = ligne.replace(/niveaux:\s*\{[^}]*\}/, nouveau)
    ajouts++
  })
}

console.log(`Ajouts de Barde: n      ${ajouts}`)
console.log(`Corrections de niveau   ${corrections}`)
console.log(`Déjà corrects           ${dejaBons}`)
console.log(`Total touché/vérifié    ${ajouts + corrections + dejaBons} / ${releve.length} du relevé`)
for (const l of journal) console.log(l)

if (ECRIRE) {
  for (const f of FICHIERS) {
    copyFileSync(join(RACINE, f), join(process.cwd(), 'menage-references', `${f}.avant-barde.bak`))
    writeFileSync(join(RACINE, f), lignes[f].join('\n'), 'utf8')
  }
  console.log('\nÉcrit. Sauvegardes .avant-barde.bak dans menage-references/.')
} else {
  console.log('\n(simulation — relancer avec --ecrire)')
}

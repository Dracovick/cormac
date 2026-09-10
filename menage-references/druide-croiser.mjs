import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = 'X:/Claude-Tools/cormac/src/lib/dnd35'
const FICHIERS = ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-paladin-rodeur.ts', 'spells-barde.ts', 'spells-supplements.ts']

const index = new Map()
for (const f of FICHIERS) {
  const chemin = join(RACINE, f)
  if (!existsSync(chemin)) continue
  const lignes = readFileSync(chemin, 'utf8').split('\n')
  lignes.forEach((l, i) => {
    const m = l.match(/\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/)
    if (!m) return
    const nom = m[2].replace(/\\'/g, "'")
    const niv = l.match(/niveaux:\s*\{([^}]*)\}/)
    index.set(nom, { fichier: f, ligne: i + 1, niveaux: niv ? niv[1].trim() : '?' })
  })
}

const releve = readFileSync('X:/Claude-Tools/cormac/menage-references/druide-releve.txt', 'utf8')
  .split('\n').filter(Boolean).map(l => { const [n, nom] = l.split('|'); return { niv: +n, nom } })

const parNiveau = {}
releve.forEach(r => { parNiveau[r.niv] = (parNiveau[r.niv] || 0) + 1 })
console.log('Relevé :', releve.length, 'sorts —', JSON.stringify(parNiveau))

const presents = [], absents = [], conflits = []
for (const r of releve) {
  const e = index.get(r.nom)
  if (!e) { absents.push(r); continue }
  presents.push({ ...r, ...e })
  const m = e.niveaux.match(/Druide:\s*(\d+)/)
  if (m && +m[1] !== r.niv) conflits.push({ ...r, ...e, actuel: +m[1] })
}
console.log('\nDÉJÀ PRÉSENTS :', presents.length, '— ABSENTS (à créer) :', absents.length)
console.log('\n── ABSENTS ──')
absents.forEach(a => console.log(`  Dru ${a.niv}  ${a.nom}`))
console.log('\n── CONFLITS de niveau Druide existant ──')
conflits.forEach(c => console.log(`  ${c.nom} : catalogue Druide ${c.actuel} → Manuel ${c.niv}   (${c.fichier}:${c.ligne})`))
console.log('\n── PRÉSENTS SANS niveau Druide (à ajouter) ──')
const aAjouter = presents.filter(p => !/Druide:/.test(p.niveaux))
console.log(aAjouter.length)

// Sorts du catalogue portant un niveau Druide mais ABSENTS du Manuel (info)
const horsManuel = []
const noms = new Set(releve.map(r => r.nom))
for (const [nom, e] of index) if (/Druide:/.test(e.niveaux) && !noms.has(nom)) horsManuel.push(`${nom} (${e.fichier})`)
console.log('\n── Catalogue : niveau Druide mais hors liste du Manuel :', horsManuel.length)
horsManuel.forEach(h => console.log('   ', h))

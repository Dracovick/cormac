import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = 'X:/Claude-Tools/cormac/src/lib/dnd35'
// spells-druide.ts est EXCLU : ses entrées portent déjà leur niveau Druide.
const FICHIERS = ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-paladin-rodeur.ts', 'spells-barde.ts', 'spells-supplements.ts']

const releve = new Map(
  readFileSync('X:/Claude-Tools/cormac/menage-references/druide-releve.txt', 'utf8')
    .split('\n').filter(Boolean).map(l => { const [n, nom] = l.split('|'); return [nom, +n] })
)

let ajouts = 0, corrections = 0, deja = 0
const journal = []

for (const f of FICHIERS) {
  const chemin = join(RACINE, f)
  if (!existsSync(chemin)) continue
  const lignes = readFileSync(chemin, 'utf8').split('\n')
  let modifie = false

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i]
    const m = l.match(/\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/)
    if (!m) continue
    const nom = m[2].replace(/\\'/g, "'")
    if (!releve.has(nom)) continue
    const niv = releve.get(nom)

    const mn = l.match(/(niveaux:\s*\{)([^}]*)(\})/)
    if (!mn) { journal.push(`  ⚠ ${f}:${i + 1} « ${nom} » : pas de bloc niveaux lisible`); continue }
    const corps = mn[2]

    const existant = corps.match(/Druide:\s*(\d+)/)
    if (existant) {
      if (+existant[1] === niv) { deja++; continue }
      lignes[i] = l.replace(/Druide:\s*\d+/, `Druide: ${niv}`)
      corrections++
      journal.push(`  ✎ ${f}:${i + 1} « ${nom} » : Druide ${existant[1]} → ${niv}`)
      modifie = true
      continue
    }

    // Ajout sur place, à la fin du bloc niveaux, en gardant l'espacement.
    const corpsNet = corps.trim().replace(/,\s*$/, '')
    const nouveau = corpsNet.length ? `${corpsNet}, Druide: ${niv}` : `Druide: ${niv}`
    lignes[i] = l.replace(mn[0], `${mn[1]} ${nouveau} ${mn[3]}`)
    ajouts++
    modifie = true
  }

  if (modifie) writeFileSync(chemin, lignes.join('\n'), 'utf8')
}

console.log(`Ajouts de « Druide: n » sur place : ${ajouts}`)
console.log(`Corrections de niveau Druide       : ${corrections}`)
console.log(`Déjà au bon niveau                 : ${deja}`)
if (journal.length) console.log('\n' + journal.join('\n'))

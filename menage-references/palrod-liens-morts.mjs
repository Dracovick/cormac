// Combien de sorts référencés par domains.ts n'ont AUCUNE entrée au catalogue ?
// (le nom d'un sort est une clé de jointure : un nom sans entrée = lien mort)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const R = join(process.cwd(), 'src', 'lib', 'dnd35')
const cle = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()

const cat = new Set()
for (const f of ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-paladin-rodeur.ts', 'spells-supplements.ts'])
  for (const m of readFileSync(join(R, f), 'utf8').matchAll(/\{\s*nom:\s*'((?:[^'\\]|\\.)*)'/g))
    cat.add(cle(m[1].replace(/\\'/g, "'")))

const dom = readFileSync(join(R, 'domains.ts'), 'utf8')
const morts = new Set()
for (const bloc of dom.matchAll(/sorts:\s*\[([^\]]*)\]/g))
  for (const m of bloc[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
    const nom = m[1].replace(/\\'/g, "'")
    if (!cat.has(cle(nom))) morts.add(nom)
  }
console.log(`Catalogue : ${cat.size} noms distincts.`)
console.log(`Sorts de domaine SANS entrée au catalogue : ${morts.size}`)
for (const n of [...morts].sort()) console.log('  ' + n)

// Parmi les sorts que ce mandat va CRÉER, combien sont aujourd'hui des liens
// morts référencés par domains.ts ?
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const R = join(process.cwd(), 'src', 'lib', 'dnd35')
const cle = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()

const cat = new Set()
for (const f of ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-paladin-rodeur.ts', 'spells-supplements.ts'])
  for (const m of readFileSync(join(R, f), 'utf8').matchAll(/\{\s*nom:\s*'((?:[^'\\]|\\.)*)'/g))
    cat.add(cle(m[1].replace(/\\'/g, "'")))

const refDom = new Set()
for (const bloc of readFileSync(join(R, 'domains.ts'), 'utf8').matchAll(/sorts:\s*\[([^\]]*)\]/g))
  for (const m of bloc[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) refDom.add(cle(m[1].replace(/\\'/g, "'")))

const releve = readFileSync(join(process.cwd(), 'menage-references', 'palrod-releve.txt'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(l => l.split('|')[2])

const aCreer = releve.filter(n => !cat.has(cle(n)))
const repares = aCreer.filter(n => refDom.has(cle(n)))
console.log(`À créer : ${new Set(aCreer.map(cle)).size} noms distincts.`)
console.log(`Parmi eux, référencés par un domaine (liens morts réparés) : ${new Set(repares.map(cle)).size}`)
for (const n of [...new Set(repares)].sort()) console.log('  ' + n)

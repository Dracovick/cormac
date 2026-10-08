/** Contrôle en production : les noms d'arme d'une fiche et leurs liens 📖. */
import fs from 'node:fs'
const h = fs.readFileSync(process.argv[2], 'utf8')
const bloc = /\{"className":"text-white font-semibold","children":"((?:[^"\\]|\\.)*)"\}\],(?:\["\$","\$L\d+",null,\{"href":"(\/bibliotheque\/arme\/\d+\?from=[^"]*)")?/g
let m, n = 0
while ((m = bloc.exec(h.replace(/\\"/g, '"')))) {
  n++
  console.log(`  ${m[1].padEnd(32)} ${m[2] ? '📖 ' + m[2] : '— pas de lien'}`)
}
if (!n) console.log('  (aucun bloc reconnu)')

import fs from 'fs'
let s = fs.readFileSync('X:/Claude-Tools/cormac/src/lib/dnd35/domains.ts', 'utf8')
// On garde uniquement le littéral du tableau et on l'évalue tel quel.
const debut = s.indexOf('[', s.indexOf('DOMAINES_DND35'))
const fin = s.indexOf('\n]', debut) + 2
const DOM = eval(s.slice(debut, fin))

console.log('TOTAL domaines :', DOM.length)

const pasNeuf = DOM.filter(d => d.sorts.length !== 9).map(d => `${d.nom}=${d.sorts.length}`)
console.log('Domaines n\'ayant pas 9 sorts :', pasNeuf.length ? pasNeuf : 'AUCUN — tous à 9')

const vides = DOM.filter(d => !d.nom || !d.pouvoir || d.sorts.some(x => !x || !x.trim()))
console.log('Entrées vides ou trouées :', vides.length ? vides.map(d => d.nom) : 'aucune')

const noms = DOM.map(d => d.nom)
const dup = noms.filter((n, i) => noms.indexOf(n) !== i)
console.log('Doublons de nom :', dup.length ? dup : 'aucun')

for (const n of ['Force', 'Chance']) {
  const d = DOM.find(x => x.nom === n)
  console.log(`\n--- ${n} (domaine de Krugg) ---`)
  console.log('  pouvoir :', d.pouvoir)
  console.log('  sorts   :', d.sorts.join(' | '))
}

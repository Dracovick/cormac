import { chercherFloue, existeAuCatalogue } from '../src/lib/recherche-floue'
import { aliasPour } from '../src/lib/dnd35/anciens-noms'
const catalogue = [
  'Potion Xenaton (verte)', 'Potion Xenaton (rouge)', 'Potion Xenaton (grise)', 'Potion Xenaton (jaune)',
  'Potion brune (Poison)', 'Neutralisation du poison', "Fiole d'eau Bénite", 'Fiole Crystal liquide magique',
  "Potion d'orientation infaillible", 'Potion de compréhension animale', 'Potion de perspicacité sauvage',
  'Potion de soins', 'Potion de soins importants',
].map(nom => ({ nom, alias: aliasPour(nom) }))
const essais = [
  'grand soin', 'grands soins', 'potion de grand soin', 'Posion Grand Soin', 'guérison majeure',
  'soins légers', 'soins importants', 'posion gran', 'soin', 'xenaton', 'eau benite',
]
for (const e of essais) {
  const r = chercherFloue(e, catalogue, s => s.nom, 8, s => s.alias)
  console.log(`« ${e} » → [${r.map(s => s.nom).join(' | ')}]  existe=${existeAuCatalogue(e, catalogue, s => s.nom)}`)
}
console.log('--- tour 2 ---')
for (const e of ['eau benite', 'xenaton verte', 'potion verte', 'neutralisation']) {
  const r = chercherFloue(e, catalogue, s => s.nom, 8, s => s.alias)
  console.log(`« ${e} » → [${r.map(s => s.nom).join(' | ')}]`)
}

import { getFeatPassiveBonuses } from '../src/lib/dnd35/feat-bonuses'
const cas: [string, string[], string][] = [
  // [nom du don], catégories attendues, commentaire
  ["Science de l'initiative", ['initiative:4'], 'officiel'],
  ["5- Science de l'initiative (+4)", ['initiative:4'], 'préfixe numéroté'],
  ['Improved initiative +5', ['initiative:5'], 'valeur explicite +5 (Gorm)'],
  ['Improved Initiative (+4)', ['initiative:4'], ''],
  ['Initiative améliorée', ['initiative:4'], ''],
  ['NIV6 - Improved initiative', ['initiative:4'], ''],
  ["Don initial: Sens de l'initiative", ['initiative:4'], ''],
  ['Lightning Reflexes (+4 init)', ['reflexes:2'], 'don de Réflexes malgré la note erronée — PAS initiative'],
  ['Ligthning reflexes', ['reflexes:2'], 'coquille'],
  ['Réflexes surnaturels (+2  sur les jets de réflexe)', ['reflexes:2'], ''],
  ['Volonté de fer', ['volonte:2'], ''],
  ['Iron Will (+2 will save)', ['volonte:2'], ''],
  ['Iron will +2 save', ['volonte:2'], ''],
  ['vigueur surhumaine', ['vigueur:2'], ''],
  ['Great Fortitude +2 save', ['vigueur:2'], ''],
  ['Grande résistance', ['vigueur:2'], 'vieille traduction (Lucky)'],
  ['Esquive', ['ca:1'], 'conditionnel'],
  ['Dodge', ['ca:1'], ''],
  ['Esquive (+1 CA contre un adversaire choisi)', ['ca:1'], ''],
  ['Esquive instinctive', [], 'capacité de classe, pas le don'],
  ['Esquive totale', [], ''],
  ['Esquive surnaturelle', [], ''],
  ['Esquive (aucun dégâts si jet de réflexe réussi)', [], 'Esquive totale mal nommée'],
  ['Esquive instinctive (+2 contre les pièges)', [], ''],
  ['Mobility (+4 AC)', ['ca:4'], ''],
  ['Mobilité +4 AC', ['ca:4'], ''],
  ['Vigilance', ['comp:2'], ''],
  ['Vigilence', ['comp:2'], 'coquille (Tatiana)'],
  ['Alertness', ['comp:2'], ''],
  ['Alertness (+2 listen  and Spot)', ['comp:2'], ''],
  ['Vigilance (Familier)', [], 'conditionnel au familier — exclu'],
  ['Robustesse', ['pv:3'], ''],
  ['NIV12 - Toughness', ['pv:3'], ''],
  ['Endurance (+4 vigueur)', [], 'Endurance ≠ Vigueur surhumaine — exclu'],
  ['Tir à bout portant', [], 'don d’arme, géré ailleurs'],
  ['Esprit fuyant', [], ''],
  ['Combat Reflexes', [], 'PAS Lightning Reflexes'],
]
let ok = 0, ko = 0
for (const [nom, attendu] of cas) {
  const r = getFeatPassiveBonuses([nom])
  const obtenu: string[] = [
    ...r.initiative.map(b => `initiative:${b.value}`),
    ...r.vigueur.map(b => `vigueur:${b.value}`),
    ...r.reflexes.map(b => `reflexes:${b.value}`),
    ...r.volonte.map(b => `volonte:${b.value}`),
    ...r.caConditionnelle.map(b => `ca:${b.value}`),
    ...r.competences.map(c => `comp:${c.item.value}`),
    ...r.pv.map(b => `pv:${b.value}`),
  ]
  const pass = JSON.stringify(obtenu.sort()) === JSON.stringify([...attendu].sort())
  if (pass) ok++
  else { ko++; console.log(`ÉCHEC « ${nom} » — attendu [${attendu}] obtenu [${obtenu}]`) }
}
// Dédoublonnage : les deux Volonté de fer de DracoVick ne comptent qu'une fois
const d = getFeatPassiveBonuses(['Volonté de fer', 'Volonté de fer (+2 Volonté)'])
if (d.volonte.length === 1) ok++; else { ko++; console.log('ÉCHEC dédoublonnage Volonté de fer') }
console.log(`${ok} réussis, ${ko} échoués sur ${cas.length + 1}`)

/** ÉPREUVE de l'aperçu de description (src/lib/apercu.ts). */
import { apercuDescription } from '../src/lib/apercu'
let e = 0
const v = (t: string, o: unknown, a: unknown) => {
  const ok = JSON.stringify(o) === JSON.stringify(a); if (!ok) e++
  console.log(`  ${ok ? '✓' : '✗'} ${t}`); if (!ok) console.log(`      attendu ${JSON.stringify(a)}\n      obtenu  ${JSON.stringify(o)}`)
}
v('le gras disparaît', apercuDescription('le carquois de **Cormac**'), 'le carquois de Cormac')
v("l'italique aussi", apercuDescription('du *Dragon Magazine* no 133'), 'du Dragon Magazine no 133')
v('les sauts de ligne se referment', apercuDescription('une ligne\n\nune autre'), 'une ligne une autre')
v('un tableau est retiré', apercuDescription('avant\n| a | b |\n| 1 | 2 |\naprès'), 'avant après')
v('une puce perd son tiret', apercuDescription('- premier point'), 'premier point')
v('le texte court passe entier', apercuDescription('750 po'), '750 po')
v('null rend une chaîne vide', apercuDescription(null), '')
v('le texte long est coupé avec une ellipse', apercuDescription('x'.repeat(300)).length, 220)
v('… et finit par l’ellipse', apercuDescription('x'.repeat(300)).endsWith('…'), true)
v('un texte de 220 exactement n’est pas coupé', apercuDescription('y'.repeat(220)), 'y'.repeat(220))
console.log(`\n${e === 0 ? '✓ TOUTES LES ÉPREUVES PASSENT' : `✗ ${e} ÉCHEC(S)`}`)
process.exit(e === 0 ? 0 : 1)

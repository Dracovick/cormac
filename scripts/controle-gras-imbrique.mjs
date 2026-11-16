/* Contrôles du détecteur de gras imbriqué — avec le faux positif qui m'a trompé
 * comme témoin principal.
 *
 *   node scripts/controle-gras-imbrique.mjs
 */
import { grasImbriques, italiquesDe } from './lib-gras-imbrique.mjs'

let n = 0
let echecs = 0
const verifier = (titre, obtenu, attendu) => {
  n++
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (!ok) { echecs++; console.log(`  ❌ ${n}. ${titre} — obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`) }
  else console.log(`  ✅ ${n}. ${titre}`)
}

console.log('— Ce qui DOIT sonner')
verifier('gras seul dans un italique', grasImbriques('*un **mot** ici*').length, 1)
verifier('gras en fin d’italique', grasImbriques('*la note se termine en **gras***').length, 1)
verifier('deux italiques fautifs', grasImbriques('*a **b** c* puis *d **e** f*').length, 2)

console.log('\n— ⛔ Le faux positif qui m’a trompé : un italique FERMÉ, suivi d’un gras')
verifier('Tome of Battle', grasImbriques('Dans le *Tome of Battle*, un épéiste-sage nommé **Harran Turiyeshor** — ...').length, 0)
verifier('italique court puis gras plus loin', grasImbriques('*Le* Tome of Battle *n’a jamais été traduit.* Et **Darkvale** est nommé.').length, 0)
verifier('gras AVANT un italique', grasImbriques('Il s’appelle **Darkvale**. *C’est un nom de lieu.*').length, 0)
verifier('gras ENTRE deux italiques', grasImbriques('*un* **deux** *trois*').length, 0)

console.log('\n— Ce qui ne doit rien déclencher')
verifier('texte sans marque', grasImbriques('Duncan a vingt et un ans.').length, 0)
verifier('gras seul', grasImbriques('**Profession (joueur) 8**').length, 0)
verifier('italique seul', grasImbriques('*une note de règles*').length, 0)
verifier('astérisque isolé', grasImbriques('3 * 4 = 12').length, 0)
verifier('liste à puces', grasImbriques('- **Détection : 8.** Le maximum.').length, 0)

console.log('\n— Appariement')
verifier('deux italiques distincts sont vus', italiquesDe('*a* et *b*').map(i => i.contenu), ['a', 'b'])
verifier('un italique qui contient un gras est vu entier', italiquesDe('*a **b** c*').map(i => i.contenu), ['a **b** c'])

console.log(`\n${n} contrôles, ${echecs} échec(s).`)
if (echecs > 0) process.exit(1)

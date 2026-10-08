/** Contrôle de la table ancien nom → nom du Manuel : chaque couple doit
 *  concorder sur les dégâts ET le critique, sinon ce n'est pas la même arme. */
import fs from 'node:fs'
import { WEAPONS_DND35 } from '../src/lib/dnd35/weapons.ts'

const ANCIENNE = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/zz-p9-ancienne-liste.json', 'utf8')) as
  { nom: string; degats: string; crit: string }[]

const COUPLES: [string, string][] = [
  ['Hache de bataille', "Hache d'armes"],
  ['Masse légère', "Masse d'armes légère"],
  ['Masse lourde', "Masse d'armes lourde"],
  ['Lance courte', 'Épieu'],
  ['Lance longue', 'Pique'],
  ['Lance de cavalerie', "Lance d'arçon"],
  ['Bâton de combat', 'Bâton'],
  ['Faucille', 'Serpe'],
  ['Grand gourdin', 'Massue'],
  ['Fléau', "Fléau d'armes léger"],
  ['Fléau lourd', "Fléau d'armes lourd"],
  ['Pic léger', 'Pic de guerre léger'],
  ['Pic lourd', 'Pic de guerre lourd'],
  ['Fauchon', 'Cimeterre à deux mains'],
  ['Glaive', 'Coutille'],
  ['Faux de guerre', 'Faux'],
  ['Ranseur', 'Corsèque'],
  ['Sai', 'Saï'],
  ['Shuriken', 'Shuriken (5)'],
  ['Épée à deux lames', 'Double-lame'],
  ['Double hache orque', 'Hache double orque'],
  ['Hallebarde naine', 'Urgrosh nain'],
  ['Marteau-crochet gnome', 'Marteau-piolet gnome'],
]

let ok = 0, ecarts = 0
for (const [ancien, nouveau] of COUPLES) {
  const a = ANCIENNE.find(w => w.nom === ancien)
  const n = WEAPONS_DND35.find(w => w.nom === nouveau && !w.modeLancer)
  if (!a) { console.log(`⛔ « ${ancien} » absent de l'ancienne liste`); ecarts++; continue }
  if (!n) { console.log(`⛔ « ${nouveau} » absent de la nouvelle liste`); ecarts++; continue }
  const critNouveau = n.critMin != null && n.critMin < 20 ? `${n.critMin}-20/×${n.critMult}` : `20-20/×${n.critMult}`
  const memeDe = a.degats === n.degats
  const memeCrit = a.crit === critNouveau
  if (memeDe && memeCrit) { ok++; console.log(`  ✓ ${ancien.padEnd(24)} → ${nouveau.padEnd(24)} ${n.degats} ${critNouveau}`) }
  else { ecarts++; console.log(`  ⚠ ${ancien.padEnd(24)} → ${nouveau.padEnd(24)} ancien ${a.degats} ${a.crit} / livre ${n.degats} ${critNouveau}`) }
}
console.log(`\nconcordants=${ok}  à vérifier=${ecarts}  (sur ${COUPLES.length} couples)`)

const ancienNoms = new Set(ANCIENNE.map(w => w.nom))
const renommes = new Set(COUPLES.map(c => c[0]))
const disparus = ANCIENNE.filter(w => !WEAPONS_DND35.some(n => n.nom === w.nom) && !renommes.has(w.nom))
console.log(`\ndisparus NON expliqués par la table (${disparus.length}) :`)
for (const d of disparus) console.log(`  « ${d.nom} » ${d.degats} ${d.crit}`)
const apparus = WEAPONS_DND35.filter(w => !ancienNoms.has(w.nom) && !COUPLES.some(c => c[1] === w.nom))
console.log(`\napparus, jamais offerts avant (${apparus.length}) :`)
for (const a of apparus) console.log(`  « ${a.nom} »  ${a.famille}`)

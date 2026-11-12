/** La recherche du sélecteur trouve-t-elle le don, et sous quels mots ? */
import { FEATS_DND35 } from '../src/lib/dnd35/feats'
import { chercherFloue } from '../src/lib/recherche-floue'
import { aAttaqueEnFinesse, armeEligibleFinesse } from '../src/lib/dnd35/attaque'

const essais = [
  'attaque en finesse', 'finesse', 'Attaque en Finesse', 'atttaque en finese',
  'weapon finesse', 'acuité martiale', 'acuite martiale', 'acuité',
]
for (const q of essais) {
  const r = chercherFloue(q, FEATS_DND35, f => f.nom, 5, f => f.alias ?? [])
  console.log(`« ${q} » → ${r.map(f => f.nom).join(' | ') || '(rien)'}`)
}

const def = FEATS_DND35.find(f => f.nom === 'Attaque en finesse')
console.log('\nfiche :', JSON.stringify(def))
console.log('« Acuité martiale » encore présente comme nom ?',
  FEATS_DND35.some(f => f.nom === 'Acuité martiale'))
console.log('dons portant needsWeapon :',
  FEATS_DND35.filter(f => f.needsWeapon).map(f => f.nom).join(', '))

// Les six écritures de fiche relevées en base, et un témoin qui doit échouer.
const temoins: [string, boolean][] = [
  ['Weapon finesse (dagger)', true],
  ['Weapon Finesse (peut utiliser le bonus de Dex sur jets d\'attaque)', true],
  ['3rd level feat: Weapon finesse (dagger)', true],
  ['Acuité martiale (Dague)', true],
  ['Attaque en finesse', true],
  ['Attaque en puissance', false],      // témoin : ne doit PAS passer
  ['Arme de prédilection (Dague)', false],
]
console.log('\n--- reconnaissance du don dans le texte libre des fiches')
let ko = 0
for (const [txt, attendu] of temoins) {
  const vu = aAttaqueEnFinesse([txt])
  if (vu !== attendu) ko++
  console.log(`  ${vu === attendu ? 'ok ' : 'KO '} ${vu} (attendu ${attendu}) « ${txt} »`)
}

// Éligibilité des armes : les trois exceptions nommées et un témoin négatif.
const armes: [string, string | null, string | null, boolean][] = [
  ['Dague', null, 'Arme courante — corps à corps légère', true],
  ['Rapier +2', 'Rapière', 'Arme de guerre — corps à corps à une main', true],
  ['Fouet', null, 'Arme exotique — corps à corps à une main', true],
  ['Chaîne cloutée', null, 'Arme exotique — corps à corps à deux mains', true],
  ['Main nue', 'Attaque à mains nues', 'Arme courante — combat à mains nues', true],
  ['Bastard sword +2', 'Épée bâtarde', 'Arme exotique — corps à corps à une main', false],
  ['Épée longue', null, 'Arme de guerre — corps à corps à une main', false],
  ['Tentacles', null, null, false],
]
console.log('\n--- éligibilité des armes')
for (const [nom, nomCat, fam, attendu] of armes) {
  const vu = armeEligibleFinesse(nom, nomCat, fam)
  if (vu !== attendu) ko++
  console.log(`  ${vu === attendu ? 'ok ' : 'KO '} ${vu} (attendu ${attendu}) « ${nom} »`)
}
console.log(ko === 0 ? '\n=== tous les témoins passent' : `\n=== ${ko} TÉMOIN(S) EN ÉCHEC`)

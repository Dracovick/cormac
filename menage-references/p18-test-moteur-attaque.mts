/**
 * ÉPREUVE du moteur d'attaque (src/lib/dnd35/attaque.ts).
 *
 * Le build local est impossible (chemin UNC) : ce script est le seul moyen
 * d'éprouver la règle avant de déployer. Il n'interroge pas la base — il nourrit
 * le moteur de cas construits à la main, dont les cas réels de la table d'André,
 * et compare au chiffre que le SRD 3.5 impose.
 *
 * Usage : ./node_modules/.bin/tsx menage-references/p18-test-moteur-attaque.mts
 */
import { alterationEffective, sequenceAttaques, calculeArme, type EntreeArme } from '../src/lib/dnd35/attaque'

let echecs = 0
function verifie(titre: string, obtenu: unknown, attendu: unknown) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (!ok) echecs++
  console.log(`  ${ok ? '✓' : '✗'} ${titre}`)
  if (!ok) console.log(`      attendu ${JSON.stringify(attendu)}\n      obtenu  ${JSON.stringify(obtenu)}`)
}

const BASE: EntreeArme = {
  nom: 'Arc long composite', famille: 'Arme de guerre — à distance', portee: 33,
  degats: '1d8', bonusArme: 0, bonusMunitions: null, coteDeForce: null,
  dons: [], bbaBrutCorps: 0, bbaBrutDistance: 0, forMod: 0, dexMod: 0,
}

console.log('\n── 1. Le non-cumul : on garde le meilleur, jamais la somme ──')
verifie('arc +1 et flèches +2 → +2 (pas +3)',
  alterationEffective({ bonusArme: 1, bonusMunitions: 2, estADistance: true }).total, 2)
verifie('arc +3 et flèches +1 → +3',
  alterationEffective({ bonusArme: 3, bonusMunitions: 1, estADistance: true }).total, 3)
verifie('arc +2 et flèches +2 → +2',
  alterationEffective({ bonusArme: 2, bonusMunitions: 2, estADistance: true }).total, 2)
verifie('arc nu et flèches +2 → +2',
  alterationEffective({ bonusArme: 0, bonusMunitions: 2, estADistance: true }).total, 2)
verifie('arc +1 et aucune munition → +1',
  alterationEffective({ bonusArme: 1, bonusMunitions: 0, estADistance: true }).total, 1)
verifie('épée +1, munitions saisies par erreur → +1 (le corps à corps ignore les munitions)',
  alterationEffective({ bonusArme: 1, bonusMunitions: 2, estADistance: false }).total, 1)

console.log('\n── 2. Ce qui est écarté est nommé, avec son motif ──')
verifie("arc +1 / flèches +2 : c'est l'arme qui est écartée",
  alterationEffective({ bonusArme: 1, bonusMunitions: 2, estADistance: true }).ecarte,
  { label: 'arme magique', valeur: 1, motif: "ne se cumule pas, les munitions +2 l'emportent" })
verifie('arc +3 / flèches +1 : ce sont les munitions qui sont écartées',
  alterationEffective({ bonusArme: 3, bonusMunitions: 1, estADistance: true }).ecarte,
  { label: 'munitions magiques', valeur: 1, motif: "ne se cumule pas, l'arme +3 l'emporte" })
verifie('à égalité, on écarte les munitions (même total)',
  alterationEffective({ bonusArme: 2, bonusMunitions: 2, estADistance: true }).ecarte?.label,
  'munitions magiques')
verifie("rien d'écarté quand un seul des deux porte un bonus",
  alterationEffective({ bonusArme: 0, bonusMunitions: 2, estADistance: true }).ecarte, null)
verifie('le bonus retenu est attribué à sa source',
  alterationEffective({ bonusArme: 0, bonusMunitions: 2, estADistance: true }).source, 'munitions')

console.log('\n── 3. La séquence d’attaques suit le BAB BRUT ──')
verifie('BAB 5 → une seule attaque', sequenceAttaques(9, 5), '+9')
verifie('BAB 6 → deux attaques', sequenceAttaques(13, 6), '+13 / +8')
verifie('BAB 11 → trois', sequenceAttaques(16, 11), '+16 / +11 / +6')
verifie('BAB 16 → quatre', sequenceAttaques(20, 16), '+20 / +15 / +10 / +5')
verifie('un total négatif reste signé', sequenceAttaques(-1, 0), '-1')

console.log("\n── 4. LE CAS DE LA TABLE — l'arc de Cormac ──")
// Cormac : BAB brut à distance 6, DEX +5, arc long composite +1 avec côte de
// Force +3, flèches +2 du carquois, FOR +3, dons Arme de prédilection (arc long
// composite), Tir à bout portant, Spécialisation martiale (arc long composite).
const CORMAC: EntreeArme = {
  ...BASE,
  bonusArme: 1, bonusMunitions: 2, coteDeForce: 3,
  dons: ['Arme de prédilection (arc long composite)', 'Tir à bout portant', 'Spécialisation martiale (arc long composite)'],
  bbaBrutCorps: 6, bbaBrutDistance: 6, forMod: 3, dexMod: 5,
}
const c = calculeArme(CORMAC)
verifie('bonus d’altération retenu = +2 (flèches), pas +3', c.alteration, 2)
verifie('attaque = 6 BAB + 5 DEX + 2 altération + 2 dons = +15', c.attaque, 15)
verifie('séquence = +15 / +10', c.sequence, '+15 / +10')
verifie('dégâts = 2 altération + 3 FOR plafonnée + 3 dons = 1d8+8', c.degatsTexte, '1d8+8')
verifie('le nom affiché garde la côte de Force et le bonus de l’arc',
  c.nomAffiche, 'Arc long composite (Force +3) +1')
verifie("l'arc +1 écarté est nommé", c.ecartes, [
  { label: 'arme magique', valeur: 1, motif: "ne se cumule pas, les munitions +2 l'emportent" },
])
verifie('le détail attribue le +2 aux munitions, pas à l’arme',
  c.attaqueLignes.find(l => l.valeur === 2 && l.label.includes('munitions'))?.label,
  'munitions magiques')

console.log('\n── 5. La côte de Force plafonne la FOR aux dégâts ──')
verifie('FOR +5, côte +3 → +3 aux dégâts',
  calculeArme({ ...BASE, coteDeForce: 3, forMod: 5 }).degatsMod, 3)
verifie('FOR +2, côte +3 → +2 (la côte est un plafond, pas un plancher)',
  calculeArme({ ...BASE, coteDeForce: 3, forMod: 2 }).degatsMod, 2)
verifie('arc ordinaire sans côte → aucune FOR aux dégâts',
  calculeArme({ ...BASE, nom: 'Arc long', forMod: 4 }).degatsMod, 0)
verifie('arme de contact → la FOR entière',
  calculeArme({ ...BASE, nom: 'Épée longue', famille: 'Arme de guerre — corps à corps à une main', portee: null, forMod: 4 }).degatsMod, 4)

console.log('\n── 6. C’est la FAMILLE qui tranche, pas la portée ──')
// Leçon du 2026-10-08 : remplir la portée de la dague (3 m) avait fait calculer
// neuf armes de contact au BAB de projectiles.
verifie('une dague lançable reste une arme de contact',
  calculeArme({ ...BASE, nom: 'Dague', famille: 'Arme courante — corps à corps légère', portee: 3, forMod: 4, dexMod: 1, bbaBrutCorps: 5, bbaBrutDistance: 9 }).estADistance,
  false)
verifie('… et son attaque passe par la FOR et le BAB de contact',
  calculeArme({ ...BASE, nom: 'Dague', famille: 'Arme courante — corps à corps légère', portee: 3, forMod: 4, dexMod: 1, bbaBrutCorps: 5, bbaBrutDistance: 9 }).attaque,
  9)
verifie('une ligne d’inventaire sans famille retombe sur la portée',
  calculeArme({ ...BASE, nom: 'Vieille ligne', famille: null, portee: 20, dexMod: 2, forMod: 4 }).estADistance,
  true)

console.log('\n── 7. Le dé nu quand rien ne s’ajoute ──')
verifie('aucun modificateur → le dé seul', calculeArme({ ...BASE, nom: 'Arc long' }).degatsTexte, '1d8')
verifie('un dé absent reste « — »', calculeArme({ ...BASE, nom: 'Arc long', degats: null }).degatsTexte, '—')
verifie('un modificateur négatif garde son signe',
  calculeArme({ ...BASE, nom: 'Dague', famille: 'Arme courante — corps à corps légère', portee: 3, degats: '1d4', forMod: -1 }).degatsTexte,
  '1d4-1')

console.log(`\n${echecs === 0 ? '✓ TOUTES LES ÉPREUVES PASSENT' : `✗ ${echecs} ÉCHEC(S)`}\n`)
process.exit(echecs === 0 ? 0 : 1)

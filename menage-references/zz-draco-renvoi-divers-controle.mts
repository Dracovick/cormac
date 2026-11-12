/**
 * CONTRÔLE DU RENVOI DES CASES « DIVERS » DE LA FEUILLE IMPRIMÉE
 *
 * Le seul invariant qui compte : le renvoi tient sur UNE ligne de la bande de
 * titre. Mesuré au PDF le 12 novembre 2026 sur la feuille de Lucky [20], la
 * plus serrée du lot : 155 caractères tiennent, 160 font sortir une page de
 * plus. Le module se donne 145 de marge.
 *
 * Ce contrôle énumère TOUTES les combinaisons de sources que le Grimoire peut
 * produire — les quatre dons à bonus permanent, le bonus d'initiative saisi à
 * la fiche et la Grâce du Bretteur à ses trois paliers — et vérifie qu'aucune
 * ne dépasse la borne mesurée. Témoins négatifs compris : le vide doit rendre
 * null, et une source inventée assez longue doit déclencher le repli.
 *
 *   npx tsx menage-references/zz-draco-renvoi-divers-controle.mts
 */
import { renvoiCasesDivers, SEUIL_RENVOI_DIVERS, type JetDivers } from '../src/lib/dnd35/renvoi-divers'
import { getFeatPassiveBonuses, sommeBonus, type BonusItem } from '../src/lib/dnd35/feat-bonuses'
import { getBonusClasse } from '../src/lib/dnd35/bonus-classe'

// 155 à l'impression ; on contrôle contre la mesure, pas contre le réglage du module.
const BORNE_MESUREE = 155

let cas = 0, echecs = 0
function verifie(nom: string, condition: boolean, detail = '') {
  cas++
  if (!condition) { echecs++; console.log(`  ✘ ${nom}${detail ? ` — ${detail}` : ''}`) }
}

// ── Les sources que le moteur sait produire, prises à la source ──
// Dérivées des vraies fonctions : une liste écrite à côté divergerait le jour
// où un don s'ajoute.
const initDon = getFeatPassiveBonuses(["Science de l'initiative"]).initiative
const refDon = getFeatPassiveBonuses(['Réflexes surhumains']).reflexes
const vigDon = getFeatPassiveBonuses(['Vigueur surhumaine']).vigueur
const volDon = getFeatPassiveBonuses(['Volonté de fer']).volonte
verifie('les quatre dons à bonus permanent sont bien reconnus',
  initDon.length === 1 && refDon.length === 1 && vigDon.length === 1 && volDon.length === 1,
  `${initDon.length}/${refDon.length}/${vigDon.length}/${volDon.length}`)

const initSaisi: BonusItem[] = [{ label: 'bonus saisi à la fiche', value: 4 }]
// Les trois paliers de la Grâce, pris à getBonusClasse — dont le +3 du niveau 20,
// le plus long à écrire, avec sa condition.
const graces = [2, 11, 20].map(n => getBonusClasse([{ nom: 'Bretteur', niveau: n }]).reflexes)
verifie('la Grâce rend un bonus à ses trois paliers',
  graces.every(g => g.length === 1) && graces.map(g => g[0].value).join(',') === '1,2,3',
  graces.map(g => g.map(x => x.value).join('')).join('|'))
verifie('la Grâce porte bien une condition', !!graces[2][0].conditional)

// ── Toutes les combinaisons : 2 (don init) × 2 (bonus saisi) × 2 × 4 (grâce) × 2 × 2 ──
const optionsInit: BonusItem[][] = [[], initDon, initSaisi, [...initDon, ...initSaisi]]
const optionsRef: BonusItem[][] = []
for (const d of [[], refDon] as BonusItem[][])
  for (const g of [[], ...graces] as BonusItem[][])
    optionsRef.push([...d, ...g])
const optionsVig: BonusItem[][] = [[], vigDon]
const optionsVol: BonusItem[][] = [[], volDon]

let combinaisons = 0, plusLong = '', plusLongue = 0, replis = 0, sansCondition = 0
for (const i of optionsInit) for (const r of optionsRef) for (const v of optionsVig) for (const w of optionsVol) {
  const jets: JetDivers[] = [
    { jet: 'Init.', sources: i },
    { jet: 'Réflexes', sources: r },
    { jet: 'Vigueur', sources: v },
    { jet: 'Volonté', sources: w },
  ]
  const texte = renvoiCasesDivers(jets)
  combinaisons++
  const aucuneSource = [i, r, v, w].every(s => s.length === 0)
  if (aucuneSource) {
    verifie('aucune source → aucun renvoi', texte === null, String(texte))
    continue
  }
  if (texte === null) { verifie('une source → un renvoi', false); continue }
  if (texte.length > plusLongue) { plusLongue = texte.length; plusLong = texte }
  verifie(`≤ ${BORNE_MESUREE} caractères`, texte.length <= BORNE_MESUREE, `${texte.length} : ${texte}`)
  // Chaque jet renseigné doit être nommé, et son total doit figurer.
  for (const { jet, sources } of jets.filter(j => j.sources.length > 0)) {
    verifie(`le jet ${jet} est nommé`, texte.includes(jet), texte)
    const somme = sommeBonus(sources)
    const total = sources.reduce((s, b) => s + b.value, 0)
    verifie(`le total du jet ${jet} est juste`, somme === total)
  }
  if (texte.includes('détail à l’écran')) replis++
  else if (!texte.includes('(')) sansCondition++
}

// ── Témoins négatifs : il faut que le repli puisse se déclencher ──
const monstrueux: JetDivers[] = [
  { jet: 'Init.', sources: [{ label: 'don : une source au nom interminable pour forcer le repli', value: 4 }] },
  { jet: 'Réflexes', sources: [{ label: 'don : une deuxième source au nom tout aussi interminable', value: 2 }] },
  { jet: 'Vigueur', sources: [{ label: 'don : et une troisième, pour être bien sûr de dépasser', value: 2 }] },
]
const texteMonstrueux = renvoiCasesDivers(monstrueux)
verifie('un cas trop long bascule sur le repli', !!texteMonstrueux?.includes('détail à l’écran'), String(texteMonstrueux))
verifie('le repli respecte la borne', (texteMonstrueux?.length ?? 999) <= BORNE_MESUREE, `${texteMonstrueux?.length}`)
verifie('un cas trop long garde les chiffres', !!texteMonstrueux?.includes('+4') && !!texteMonstrueux?.includes('+2'))
verifie('le seuil du module reste sous la borne mesurée', SEUIL_RENVOI_DIVERS <= BORNE_MESUREE, `${SEUIL_RENVOI_DIVERS}`)
verifie('le préfixe « don : » ne passe pas sur le papier',
  !renvoiCasesDivers([{ jet: 'Volonté', sources: volDon }])!.includes('don :'))

console.log(`\n${combinaisons} combinaisons de sources · renvoi le plus long ${plusLongue} caractères (borne ${BORNE_MESUREE})`)
console.log(`  ↳ ${plusLong}`)
console.log(`${replis} cas au repli chiffré · ${sansCondition} cas sans condition écrite`)
console.log(`${cas} contrôles, ${echecs} échec(s).`)
if (echecs > 0) process.exit(1)

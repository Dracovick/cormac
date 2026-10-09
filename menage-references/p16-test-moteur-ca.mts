/**
 * ÉPREUVE du moteur de classe d'armure (src/lib/dnd35/classe-armure.ts).
 *
 * Le build local est impossible (chemin UNC) : ce script est le seul moyen
 * d'éprouver la règle avant de déployer. Il n'interroge pas la base — il nourrit
 * le moteur de cas construits à la main, dont les six cas réels de la table
 * d'André, et compare au chiffre que le PHB 3.5 impose.
 *
 * Usage : npx tsx menage-references/p16-test-moteur-ca.mts
 */
import { calculeClasseArmure, sourcesCAObjets, sourcesCASaisies, libelleTypeBonus, type SourceCA } from '../src/lib/dnd35/classe-armure'

let echecs = 0
function verifie(titre: string, obtenu: unknown, attendu: unknown) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (!ok) echecs++
  console.log(`  ${ok ? '✓' : '✗'} ${titre}`)
  if (!ok) console.log(`      attendu ${JSON.stringify(attendu)}\n      obtenu  ${JSON.stringify(obtenu)}`)
}

const objet = (id: number, nom: string, bonus: number | null, bonusType: string | null) => ({ item: { id, nom, bonus, bonusType } })
const SANS_EQUIPEMENT = { bonusArmurePortee: 0, bonusBouclierPorte: 0 }

console.log('\n── 1. Un objet dont le bonus ne va pas à la CA est ignoré ──')
verifie(
  "bandeau d'Intelligence +2 → 0",
  calculeClasseArmure(sourcesCAObjets([objet(9, "Bandeau d'intelligence +2", 2, null)]), SANS_EQUIPEMENT).total,
  0,
)
verifie(
  'cape de résistance +1 → 0',
  calculeClasseArmure(sourcesCAObjets([objet(10, 'Cape de résistance +1', 1, null)]), SANS_EQUIPEMENT).total,
  0,
)
verifie(
  'gantelets de Dextérité +2 → 0 (le +2 passe par la Dextérité, pas par la CA)',
  calculeClasseArmure(sourcesCAObjets([objet(5, 'Gantelets de dextérité +2', 2, null)]), SANS_EQUIPEMENT).total,
  0,
)

console.log('\n── 2. Deux bonus de parade ne se cumulent pas (Cormac) ──')
{
  const r = calculeClasseArmure(
    [
      ...sourcesCAObjets([
        objet(2, 'Anneau de protection +2', 2, 'parade'),
        objet(1, 'Cape de protection +1', 1, 'parade'),
        objet(5, 'Gantelets de dextérité +2', 2, null),
      ]),
      ...sourcesCASaisies({ caNaturelle: 0, caDeflexion: 1, caDivers: 0 }),
    ],
    SANS_EQUIPEMENT,
  )
  verifie('total = +2, pas +5', r.total, 2)
  verifie(
    "la cape et le champ de la fiche sont écartés par l'anneau",
    r.contributions.filter(c => c.effective === 0).map(c => [c.label, c.remplacePar]),
    [['Cape de protection +1', 'Anneau de protection +2'], ['parade (fiche)', 'Anneau de protection +2']],
  )
}

console.log('\n── 3. Un bonus d\'armure ne se cumule pas avec une armure portée ──')
verifie(
  "bracelets d'armure +2 sans armure → +2 (Elbereth)",
  calculeClasseArmure(sourcesCAObjets([objet(8, "Bracers d'armure +2", 2, 'armure')]), SANS_EQUIPEMENT).total,
  2,
)
verifie(
  "les mêmes bracelets sous une plaque complète +8 → 0",
  calculeClasseArmure(sourcesCAObjets([objet(8, "Bracers d'armure +2", 2, 'armure')]), { bonusArmurePortee: 8, bonusBouclierPorte: 0 }).total,
  0,
)
verifie(
  "sous une armure de cuir +1, les bracelets +2 n'ajoutent que le delta",
  calculeClasseArmure(sourcesCAObjets([objet(8, "Bracers d'armure +2", 2, 'armure')]), { bonusArmurePortee: 1, bonusBouclierPorte: 0 }).total,
  1,
)

console.log('\n── 4. Les types cumulables se cumulent, eux ──')
{
  const sources: SourceCA[] = [
    { cle: 'a', origine: 'objet', label: 'pierre d\'ioun', typeBonus: 'esquive', valeur: 1 },
    { cle: 'b', origine: 'sort', label: 'Hâte', typeBonus: 'esquive', valeur: 1 },
    ...sourcesCASaisies({ caDivers: 20, caDeflexion: 0, caNaturelle: 0 }),
  ]
  verifie('deux esquives +1 et divers +20 → +22', calculeClasseArmure(sources, SANS_EQUIPEMENT).total, 22)
}

console.log('\n── 5. Les champs de la fiche sont arbitrés, jamais perdus (Rham) ──')
{
  const r = calculeClasseArmure(
    [...sourcesCAObjets([objet(18, 'Anneau de jade', 2, 'parade')]), ...sourcesCASaisies({ caNaturelle: 4, caDeflexion: 0, caDivers: 20 })],
    SANS_EQUIPEMENT,
  )
  verifie('parade 2 + naturelle 4 + divers 20 = +26', r.total, 26)
  verifie('aucune source écartée', r.contributions.filter(c => c.effective === 0).length, 0)
}

console.log('\n── 6. Un bonus de parade de sort et un d\'objet s\'arbitrent ensemble ──')
{
  const r = calculeClasseArmure(
    [
      ...sourcesCAObjets([objet(12, 'Anneau de protection +1', 1, 'parade')]),
      { cle: 'sort:7', origine: 'sort', label: 'Bouclier de la foi', typeBonus: 'parade', valeur: 3 },
    ],
    SANS_EQUIPEMENT,
  )
  verifie('le sort +3 l\'emporte sur l\'anneau +1 → +3', r.total, 3)
  verifie(
    "l'anneau est écarté, nommément",
    r.contributions.filter(c => c.effective === 0).map(c => [c.label, c.remplacePar]),
    [['Anneau de protection +1', 'Bouclier de la foi']],
  )
}

console.log('\n── 7. Un objet à bonus nul ou sans type n\'entre pas dans l\'arbitrage ──')
verifie(
  'bonus NULL et type « parade » → ignoré',
  sourcesCAObjets([objet(99, 'Anneau quelconque', null, 'parade')]).length,
  0,
)
verifie(
  'bonus 0 → ignoré',
  sourcesCAObjets([objet(99, 'Anneau quelconque', 0, 'parade')]).length,
  0,
)

console.log('\n── 8. L\'élision du libellé affiché sur la fiche ──')
verifie('« bonus de parade »', libelleTypeBonus('parade'), 'bonus de parade')
verifie('« bonus d’armure naturelle », et non « bonus de armure naturelle »', libelleTypeBonus('armure naturelle'), 'bonus d’armure naturelle')
verifie('« bonus d’esquive »', libelleTypeBonus('esquive'), 'bonus d’esquive')
verifie('« bonus d’intuition »', libelleTypeBonus('intuition'), 'bonus d’intuition')
verifie('« bonus de bouclier »', libelleTypeBonus('bouclier'), 'bonus de bouclier')
verifie('« bonus de taille »', libelleTypeBonus('taille'), 'bonus de taille')

console.log(echecs === 0 ? '\n✓ Les 20 épreuves passent.\n' : `\n✗ ${echecs} épreuve(s) en échec.\n`)
process.exit(echecs === 0 ? 0 : 1)

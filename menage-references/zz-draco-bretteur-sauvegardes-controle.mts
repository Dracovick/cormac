/**
 * LE BRETTEUR ET LES JETS DE SAUVEGARDE — contrôle demandé par André le
 * 12 novembre 2026 : « vérifie si la classe Bretteur a une incidence sur les
 * jets de sauvegardes et prends les en compte ».
 *
 * Le livre lui en donne deux, et une seule est un bonus :
 *
 *   • la PROGRESSION : Réflexes seuls en bonne sauvegarde (2 + niveau/2), donc
 *     Vigueur et Volonté en faible (niveau/3) — c'est la base du jet;
 *   • la GRÂCE : +1 au niveau 2, +2 au niveau 11, +3 au niveau 20, aux Réflexes,
 *     perdue en armure intermédiaire ou lourde;
 *   • l'ESPRIT FUYANT (niveau 17) relance un jet de Volonté raté contre un
 *     enchantement : aucune case de fiche ne porte une relance.
 *
 * Les valeurs attendues sont écrites ici d'après le livre, et comparées à ce
 * que rendent les fonctions qui alimentent VRAIMENT les fiches.
 *
 *   npx tsx menage-references/zz-draco-bretteur-sauvegardes-controle.mts
 */
import { getMultiClassSave, getModifier } from '../src/lib/dnd35/rules'
import { getClasseInfo } from '../src/lib/dnd35/classes'
import { getBonusClasse, graceBretteur, NOM_BRETTEUR } from '../src/lib/dnd35/bonus-classe'
import { sommeBonus } from '../src/lib/dnd35/feat-bonuses'
import { CAPACITES_PAR_CLASSE } from '../src/lib/dnd35/class-features'

let cas = 0, echecs = 0
const verifie = (nom: string, ok: boolean, detail = '') => {
  cas++
  if (!ok) { echecs++; console.log(`  ✘ ${nom}${detail ? ` — ${detail}` : ''}`) }
}

const info = getClasseInfo(NOM_BRETTEUR)
verifie('la classe est connue du moteur', !!info)
verifie('Réflexes est sa seule bonne sauvegarde',
  JSON.stringify(info?.bonsSauvegardes) === JSON.stringify(['reflexes']),
  JSON.stringify(info?.bonsSauvegardes))

// ── La base, niveau par niveau, contre la formule du Manuel ──
console.log('── Base des jets, Bretteur seul ──')
for (let n = 1; n <= 20; n++) {
  const classes = [{ bonsSauvegardes: info!.bonsSauvegardes, niveau: n }]
  const ref = getMultiClassSave('reflexes', classes)
  const vig = getMultiClassSave('vigueur', classes)
  const vol = getMultiClassSave('volonte', classes)
  const refAttendu = 2 + Math.floor(n / 2)
  const faibleAttendu = Math.floor(n / 3)
  verifie(`niv.${n} Réflexes base`, ref === refAttendu, `${ref} au lieu de ${refAttendu}`)
  verifie(`niv.${n} Vigueur base`, vig === faibleAttendu, `${vig} au lieu de ${faibleAttendu}`)
  verifie(`niv.${n} Volonté base`, vol === faibleAttendu, `${vol} au lieu de ${faibleAttendu}`)
  if ([1, 2, 5, 11, 17, 20].includes(n)) console.log(`  niv.${String(n).padStart(2)} · Réflexes +${ref} · Vigueur +${vig} · Volonté +${vol}`)
}

// ── La Grâce, palier par palier ──
console.log('── Grâce (Réflexes) ──')
const PALIERS_LIVRE: Record<number, number> = { 1: 0, 2: 1, 10: 1, 11: 2, 19: 2, 20: 3 }
for (const [niveauTexte, attendu] of Object.entries(PALIERS_LIVRE)) {
  const n = Number(niveauTexte)
  verifie(`Grâce au niv.${n}`, graceBretteur(n) === attendu, `${graceBretteur(n)} au lieu de ${attendu}`)
  const bc = getBonusClasse([{ nom: NOM_BRETTEUR, niveau: n }])
  verifie(`Grâce au niv.${n} dans le total des Réflexes`, sommeBonus(bc.reflexes) === attendu,
    `${sommeBonus(bc.reflexes)} au lieu de ${attendu}`)
  console.log(`  niv.${String(n).padStart(2)} · Grâce ${attendu > 0 ? `+${attendu}` : '—'}`)
}

// ── Les paliers se mesurent au niveau de la CLASSE, pas du personnage ──
const multi = getBonusClasse([{ nom: NOM_BRETTEUR, niveau: 2 }, { nom: 'Roublard', niveau: 9 }])
verifie('Bretteur 2 / Roublard 9 → Grâce +1 (niveau de classe, pas de personnage)',
  sommeBonus(multi.reflexes) === 1, `${sommeBonus(multi.reflexes)}`)
const refMulti = getMultiClassSave('reflexes', [
  { bonsSauvegardes: getClasseInfo(NOM_BRETTEUR)!.bonsSauvegardes, niveau: 2 },
  { bonsSauvegardes: getClasseInfo('Roublard')!.bonsSauvegardes, niveau: 9 },
])
verifie('Bretteur 2 / Roublard 9 → base de Réflexes 3 + 6 = 9', refMulti === 9, `${refMulti}`)
console.log(`── Multi-classe ──\n  Bretteur 2 / Roublard 9 · base Réflexes +${refMulti} · Grâce +${sommeBonus(multi.reflexes)}`)

// ── L'armure éteint la Grâce, et elle seule le fait ──
for (const [type, doitEteindre] of [['Légère', false], ['Armure lourde', true], ['Intermédiaire', true], [null, false]] as [string | null, boolean][]) {
  const bc = getBonusClasse([{ nom: NOM_BRETTEUR, niveau: 11 }], [type])
  const eteinte = sommeBonus(bc.reflexes) === 0
  verifie(`armure « ${type ?? '(aucune)'} » ${doitEteindre ? 'éteint' : 'laisse'} la Grâce`,
    eteinte === doitEteindre, `Grâce +${sommeBonus(bc.reflexes)}`)
}

// ── Témoins négatifs : pas de bonus là où le livre n'en donne pas ──
const bc11 = getBonusClasse([{ nom: NOM_BRETTEUR, niveau: 20 }])
verifie('la Grâce ne touche QUE les Réflexes',
  !('vigueur' in bc11) && !('volonte' in bc11))
const autre = getBonusClasse([{ nom: 'Guerrier', niveau: 20 }])
verifie('une autre classe ne rend aucun bonus de sauvegarde', sommeBonus(autre.reflexes) === 0)

// ── Esprit fuyant : présent comme capacité, sans chiffre ──
const capacites = CAPACITES_PAR_CLASSE[NOM_BRETTEUR] ?? []
const fuyant = capacites.find(c => /esprit fuyant|slippery/i.test(c.nom))
verifie('Esprit fuyant est écrit sur la fiche', !!fuyant, capacites.map(c => c.nom).join(', '))
verifie('Esprit fuyant est au niveau 17', fuyant?.niveau === 17, `niveau ${fuyant?.niveau}`)
const grace = capacites.find(c => /grâce|grace/i.test(c.nom))
verifie('Grâce est écrite au niveau 2', grace?.niveau === 2, `niveau ${grace?.niveau}`)

// ── Un cas complet, chiffré de bout en bout ──
// Bretteur 11, DEX 18 (+4), armure légère : 7 (base) + 4 (DEX) + 2 (Grâce) = 13.
const base11 = getMultiClassSave('reflexes', [{ bonsSauvegardes: info!.bonsSauvegardes, niveau: 11 }])
const total11 = base11 + getModifier(18) + sommeBonus(getBonusClasse([{ nom: NOM_BRETTEUR, niveau: 11 }], ['Légère']).reflexes)
verifie('Bretteur 11, DEX 18, armure légère → Réflexes +13', total11 === 13, `+${total11}`)
console.log(`── Cas complet ──\n  Bretteur 11, DEX 18, armure légère · Réflexes = base ${base11} + DEX ${getModifier(18)} + Grâce 2 = +${total11}`)

console.log(`\n${cas} contrôles, ${echecs} échec(s).`)
if (echecs > 0) process.exit(1)

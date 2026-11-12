/**
 * Le choix FOR/DEX par ligne d'arme (drizzle/0016) — contrôles.
 *
 * Chaque cas porte son TÉMOIN CONTRAIRE : un contrôle qui ne vérifie que ce
 * qu'il espère annonce toujours 0 écart. On vérifie donc aussi, à chaque fois,
 * que le choix est bien IGNORÉ là où le livre n'autorise aucun choix — arme
 * non éligible, arme à distance, personnage sans le don.
 */
import { calculeArme } from '../src/lib/dnd35/attaque'

const BASE = {
  degats: '1d4',
  bonusArme: 0,
  bonusMunitions: null,
  coteDeForce: null,
  bbaBrutCorps: 4,
  bbaBrutDistance: 4,
  forMod: 1,
  dexMod: 5,
  nomCatalogue: null as string | null,
  familleCatalogue: null as string | null,
}
const LEGERE = 'Arme courante — corps à corps légère'
const LOURDE = 'Arme de guerre — corps à corps à une main'
const DISTANCE = 'Arme courante — à distance'
const FINESSE = ['Attaque en finesse']

let ok = 0, ko = 0
function verifie(titre: string, reel: unknown, attendu: unknown) {
  if (JSON.stringify(reel) === JSON.stringify(attendu)) { ok++; return }
  ko++
  console.log(`  ✗ ${titre}\n      attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(reel)}`)
}

type Opts = Partial<Parameters<typeof calculeArme>[0]>
const arme = (o: Opts) => calculeArme({
  nom: 'Dague', famille: LEGERE, portee: null, dons: FINESSE, ...BASE, ...o,
} as Parameters<typeof calculeArme>[0])

console.log('── 1. Le défaut (NULL) ne change RIEN par rapport à avant 0016 ──')
verifie('DEX meilleure, aucun choix → DEX', arme({ caracAttaque: null }).attaque, 4 + 5)
verifie('FOR meilleure, aucun choix → FOR', arme({ caracAttaque: null, forMod: 5, dexMod: 1 }).attaque, 4 + 5)
verifie('égalité, aucun choix → FOR (pas de bascule)', arme({ caracAttaque: null, forMod: 3, dexMod: 3 }).finesseAppliquee, false)
verifie('champ absent (fiche d’avant 0016) → DEX', arme({}).attaque, 4 + 5)

console.log('── 2. Le choix du joueur l’emporte, même quand il est moins bon ──')
verifie('choix DEX alors que la FOR est meilleure', arme({ caracAttaque: 'dex', forMod: 5, dexMod: 1 }).attaque, 4 + 1)
verifie('choix FOR alors que la DEX est meilleure', arme({ caracAttaque: 'for' }).attaque, 4 + 1)
verifie('choix DEX quand la DEX est déjà meilleure', arme({ caracAttaque: 'dex' }).attaque, 4 + 5)
verifie('choix FOR quand la FOR est déjà meilleure', arme({ caracAttaque: 'for', forMod: 5, dexMod: 1 }).attaque, 4 + 5)

console.log('── 3. TÉMOINS NÉGATIFS : là où le livre n’autorise aucun choix ──')
verifie('arme NON éligible (à une main), choix DEX → ignoré',
  arme({ famille: LOURDE, nom: 'Épée bâtarde', caracAttaque: 'dex' }).attaque, 4 + 1)
verifie('arme NON éligible : pas de sélecteur',
  arme({ famille: LOURDE, nom: 'Épée bâtarde', caracAttaque: 'dex' }).choixFinessePossible, false)
verifie('arme à DISTANCE, choix FOR → ignoré, la DEX reste',
  arme({ famille: DISTANCE, nom: 'Fronde', portee: 15, caracAttaque: 'for' }).attaque, 4 + 5)
verifie('arme à distance : pas de sélecteur',
  arme({ famille: DISTANCE, nom: 'Fronde', portee: 15, caracAttaque: 'for' }).choixFinessePossible, false)
verifie('SANS le don ni Bretteur, choix DEX → ignoré',
  arme({ dons: ['Esquive'], caracAttaque: 'dex' }).attaque, 4 + 1)
verifie('sans le don : pas de sélecteur',
  arme({ dons: ['Esquive'], caracAttaque: 'dex' }).choixFinessePossible, false)

console.log('── 4. Le Bretteur reçoit le don de sa classe, sans l’avoir saisi ──')
verifie('Bretteur 1 sans le don, choix DEX → DEX',
  arme({ dons: [], niveauBretteur: 1, caracAttaque: 'dex', forMod: 5, dexMod: 1 }).attaque, 4 + 1)
verifie('Bretteur 1 sans le don : le sélecteur existe',
  arme({ dons: [], niveauBretteur: 1 }).choixFinessePossible, true)
verifie('PAS Bretteur, pas de don : aucun sélecteur',
  arme({ dons: [], niveauBretteur: 0 }).choixFinessePossible, false)

console.log('── 5. ⭐ Les DÉGÂTS ne suivent JAMAIS le choix (question d’André) ──')
verifie('dégâts avec la DEX choisie → toujours la FOR', arme({ caracAttaque: 'dex' }).degatsTexte, '1d4+1')
verifie('dégâts avec la FOR choisie → la FOR, inchangés', arme({ caracAttaque: 'for' }).degatsTexte, '1d4+1')
verifie('dégâts en automatique → la FOR, inchangés', arme({ caracAttaque: null }).degatsTexte, '1d4+1')
verifie('DEX 5 / FOR 1 : les dégâts valent +1, pas +5', arme({ caracAttaque: 'dex' }).degatsMod, 1)
verifie('Frappe perspicace (Bretteur 3) s’ajoute quand même',
  arme({ caracAttaque: 'for', niveauBretteur: 3, intMod: 4 }).degatsTexte, '1d4+5')

console.log('── 6. Ce que l’écran affiche de ce choix ──')
verifie('auto : le joueur n’a rien choisi', arme({}).caracAttaqueChoisieParLeJoueur, false)
verifie('choix saisi : marqué comme tel', arme({ caracAttaque: 'for' }).caracAttaqueChoisieParLeJoueur, true)
verifie('carac retenue, auto', arme({}).caracAttaqueRetenue, 'dex')
verifie('carac retenue, FOR forcée', arme({ caracAttaque: 'for' }).caracAttaqueRetenue, 'for')
verifie('à distance : la DEX par la règle générale, pas par un choix',
  arme({ famille: DISTANCE, nom: 'Fronde', portee: 15 }).caracAttaqueRetenue, 'dex')

console.log('── 7. Les trois exceptions nommées par le SRD ──')
for (const [nom, fam] of [['Rapière', LOURDE], ['Fouet', LOURDE], ['Chaîne cloutée', LOURDE]] as const) {
  verifie(`${nom} : éligible malgré sa famille`, arme({ nom, famille: fam, caracAttaque: 'dex' }).attaque, 4 + 5)
}
verifie('Épée longue : témoin négatif de la même famille',
  arme({ nom: 'Épée longue', famille: LOURDE, caracAttaque: 'dex' }).attaque, 4 + 1)

console.log(`\n${ok + ko} contrôles · ${ok} passés · ${ko} échoués`)
if (ko > 0) process.exit(1)

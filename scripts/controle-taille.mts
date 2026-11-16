/**
 * CONTRÔLES — le modificateur de taille (demandé par André le 2026-11-16).
 *
 *   npx tsx scripts/controle-taille.mts
 *
 * Six sections :
 *   1. la reconnaissance de la catégorie écrite en base
 *   2. les trois tables du livre, valeur par valeur, SIGNES COMPRIS
 *   3. la classe d'armure
 *   4. les jets d'attaque
 *   5. la charge transportable
 *   6. la base réelle et le code
 *
 * ⭐ Les attendus sont écrits À LA MAIN d'après le SRD 3.5 VF, jamais produits
 * en rappelant la fonction qu'ils contrôlent.
 * ⭐ Le témoin le plus important de tout ce lot : le modificateur de la CA (+1
 * pour une petite taille) n'est PAS celui de la Discrétion (+4). Les confondre
 * est l'erreur naturelle, et elle serait invisible sur la fiche.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  TAILLES,
  categorieTaille,
  libelleTaille,
  modificateurDiscretion,
  modificateurTaille,
  multiplicateurCharge,
  signe,
} from '../src/lib/dnd35/taille'
import { calculeClasseArmure, sourceCATaille, type SourceCA } from '../src/lib/dnd35/classe-armure'
import { calculeArme } from '../src/lib/dnd35/attaque'
import { getChargeCategorie, getChargeCategorieKg, getChargeLimites, getChargeLimitesKg } from '../src/lib/dnd35/encumbrance'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let ok = 0
const echecs: string[] = []
function verifier(titre: string, condition: boolean, detail = '') {
  if (condition) ok++
  else echecs.push(`${titre}${detail ? ` — ${detail}` : ''}`)
}
function egal(titre: string, obtenu: unknown, attendu: unknown) {
  verifier(titre, JSON.stringify(obtenu) === JSON.stringify(attendu),
    `obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`)
}

// ─── 1. Reconnaître la catégorie écrite en base ────────────────────────────────
egal('« Petite » (la valeur du catalogue) est reconnue', categorieTaille('Petite'), 'Petite')
egal('« Moyenne » aussi', categorieTaille('Moyenne'), 'Moyenne')
egal('le masculin passe', categorieTaille('Petit'), 'Petite')
egal('l’abréviation du livre passe', categorieTaille('P'), 'Petite')
egal('les espaces et la casse ne gênent pas', categorieTaille('  PETITE  '), 'Petite')
egal('l’accent n’est pas requis', categorieTaille('tres petite'), 'Très petite')
egal('et l’accent est accepté', categorieTaille('Très petite'), 'Très petite')

// ⭐⭐ LE TÉMOIN DE RECONNAISSANCE. « très petite » CONTIENT « petite » : une
// comparaison par inclusion classerait TP en P et lui donnerait +1 au lieu de
// +2. On vérifie donc que les deux ne se confondent pas, dans les deux sens.
verifier('⭐⭐ témoin : « très petite » n’est pas classée « petite »',
  categorieTaille('très petite') === 'Très petite' && categorieTaille('petite') === 'Petite')
verifier('⭐ témoin : « très grande » n’est pas classée « grande »',
  categorieTaille('très grande') === 'Très grande' && categorieTaille('grande') === 'Grande')

egal('⛔ une valeur inconnue rend null (on ne devine pas « Moyenne »)',
  categorieTaille('énorme'), null)
egal('⛔ vide → null', categorieTaille(''), null)
egal('⛔ absent → null', categorieTaille(null), null)
egal('⛔ et une taille inconnue ne donne AUCUN modificateur', modificateurTaille(null), 0)
egal('⛔ ni aucun multiplicateur de charge', multiplicateurCharge(null), 1)
egal('⛔ et aucun libellé à afficher', libelleTaille('énorme'), null)

egal('le libellé porte l’abréviation du livre', libelleTaille('Petite'), 'Petite (P)')

// ─── 2. Les trois tables du livre ─────────────────────────────────────────────
// SRD 3.5 VF, chap. Combat, « Table : modificateurs de taille ».
// ⚠ Les signes ont failli être faux : dans ces RTF le signe moins est le mot de
// contrôle `\endash`, qu'un déshabillage naïf efface SANS TRACE. La table
// ressortait « Colossal (C) | 8 » au lieu de « −8 ». Chaque signe est donc
// contrôlé ici, à la main, d'après le relevé corrigé.
const MOD_LIVRE: [string, number][] = [
  ['Colossale', -8], ['Gigantesque', -4], ['Très grande', -2], ['Grande', -1],
  ['Moyenne', 0], ['Petite', +1], ['Très petite', +2], ['Minuscule', +4], ['Infime', +8],
]
for (const [cat, attendu] of MOD_LIVRE) {
  egal(`CA/attaque · ${cat} = ${signe(attendu)}`, modificateurTaille(cat), attendu)
}

// SRD 3.5 VF, chap. Compétences : « taille I : +16, taille Min : +12,
// taille TP : +8, taille P : +4, taille G : −4, taille TG : −8,
// taille Gig : −12, taille C : −16. »
const DISCRETION_LIVRE: [string, number][] = [
  ['Infime', +16], ['Minuscule', +12], ['Très petite', +8], ['Petite', +4],
  ['Moyenne', 0], ['Grande', -4], ['Très grande', -8], ['Gigantesque', -12], ['Colossale', -16],
]
for (const [cat, attendu] of DISCRETION_LIVRE) {
  egal(`Discrétion · ${cat} = ${signe(attendu)}`, modificateurDiscretion(cat), attendu)
}

// SRD 3.5 VF, chap. Poids transportable : « petite (P) : 3/4, très petite (TP) :
// 1/2, minuscule (Min) : 1/4, infime (I) : 1/8 » ; « grande (G) : 2, très grande
// (TG) : 4, gigantesque (Gig) : 8 et colossale (C) : 16 ».
const CHARGE_LIVRE: [string, number][] = [
  ['Infime', 1 / 8], ['Minuscule', 1 / 4], ['Très petite', 1 / 2], ['Petite', 3 / 4],
  ['Moyenne', 1], ['Grande', 2], ['Très grande', 4], ['Gigantesque', 8], ['Colossale', 16],
]
for (const [cat, attendu] of CHARGE_LIVRE) {
  egal(`Charge · ${cat} = ×${attendu}`, multiplicateurCharge(cat), attendu)
}

// ⭐⭐ LE TÉMOIN QUI COMPTE LE PLUS. Trois tables différentes pour la même
// catégorie : confondre celle de la CA avec celle de la Discrétion donnerait à
// Azadrielle +1 en Discrétion au lieu de +4, ou +4 à sa CA au lieu de +1 — et
// rien sur la fiche ne le dirait.
verifier('⭐⭐ témoin : les trois tables DIFFÈRENT pour une petite taille',
  modificateurTaille('Petite') === 1 &&
  modificateurDiscretion('Petite') === 4 &&
  multiplicateurCharge('Petite') === 0.75,
  `CA ${modificateurTaille('Petite')}, Discrétion ${modificateurDiscretion('Petite')}, charge ${multiplicateurCharge('Petite')}`)

verifier('⭐ témoin : une taille moyenne ne change RIEN, aux trois tables',
  modificateurTaille('Moyenne') === 0 &&
  modificateurDiscretion('Moyenne') === 0 &&
  multiplicateurCharge('Moyenne') === 1)

verifier('les 9 catégories du livre sont toutes connues', Object.keys(TAILLES).length === 9,
  `${Object.keys(TAILLES).length} catégories`)

// ─── 3. La classe d'armure ────────────────────────────────────────────────────
const nue = { bonusArmurePortee: 0, bonusBouclierPorte: 0 }

egal('CA : aucune source quand le modificateur est 0',
  sourceCATaille('Moyenne (M)', 0).length, 0)

const srcTaille = sourceCATaille('Petite (P)', 1)
egal('CA : une source de type « taille »', srcTaille.map(s => s.typeBonus), ['taille'])
egal('CA : son libellé nomme la catégorie', srcTaille[0].label, 'taille (Petite (P))')
egal('CA : elle apporte bien +1', calculeClasseArmure(srcTaille, nue).total, 1)

// ⭐ Le modificateur de taille et le champ « divers » du MJ se CUMULENT tous les
// deux dans le total — et c'est exactement pourquoi la source est NOMMÉE :
// Azadrielle [98] et Sabin [77] portent `ca_divers = +1`, peut-être ce même
// modificateur saisi à la main. La fiche montre les deux lignes; André tranche.
const avecDivers: SourceCA[] = [
  ...srcTaille,
  { cle: 'saisie:divers', origine: 'saisie', label: 'divers (fiche)', typeBonus: 'divers', valeur: 1 },
]
const resDivers = calculeClasseArmure(avecDivers, nue)
egal('⚠ CA : taille +1 ET divers +1 font +2 (le doublon est VISIBLE, pas corrigé)',
  resDivers.total, 2)
egal('⚠ et les deux lignes sont rendues, aucune n’est écartée',
  resDivers.contributions.filter(c => c.effective !== 0).length, 2)

// Deux bonus de taille ne se cumulent pas : seul le meilleur compte (règle du
// livre sur les bonus de même type).
const deuxTailles: SourceCA[] = [
  ...sourceCATaille('Petite (P)', 1),
  { cle: 'objet:1', origine: 'objet', label: 'objet de taille +2', typeBonus: 'taille', valeur: 2 },
]
const resDeux = calculeClasseArmure(deuxTailles, nue)
egal('CA : deux bonus de taille ne se cumulent pas, le meilleur gagne', resDeux.total, 2)
verifier('CA : et le plus faible est rendu écarté, avec le nom de celui qui le supplante',
  resDeux.contributions.some(c => c.effective === 0 && c.remplacePar === 'objet de taille +2'))

// ─── 4. Les jets d'attaque ────────────────────────────────────────────────────
const dague = {
  nom: 'Dague', famille: 'Arme courante — corps à corps légère', portee: null,
  degats: '1d4', bonusArme: 0, bonusMunitions: null, coteDeForce: null,
  dons: [] as string[], bbaBrutCorps: 2, bbaBrutDistance: 2, forMod: -1, dexMod: 5,
}
const sansTaille = calculeArme({ ...dague })
const avecTaille = calculeArme({ ...dague, modTaille: 1 })

egal('attaque : sans modificateur, le total ne bouge pas (non-régression)',
  sansTaille.attaque, 2 + -1)
egal('attaque : +1 de taille monte le total d’exactement 1',
  avecTaille.attaque, sansTaille.attaque + 1)
verifier('attaque : une ligne de détail NOMME le modificateur',
  avecTaille.attaqueLignes.some(l => l.label === 'modificateur de taille' && l.valeur === 1),
  'un total qui bouge sans ligne qui l’explique ne se vérifie pas à la table')
verifier('attaque : la ligne dit qu’il vaut contre n’importe quel adversaire',
  avecTaille.attaqueLignes.some(l => l.label === 'modificateur de taille' && /n’importe quel adversaire/.test(l.note ?? '')))

// ⭐⭐ LE TÉMOIN DES DÉGÂTS. Le modificateur de taille touche le JET D'ATTAQUE,
// jamais les dégâts. Le livre ne lui donne aucun effet là, et l'y ajouter
// gonflerait toutes les armes de toutes les petites races.
egal('⭐⭐ témoin : les DÉGÂTS ne bougent pas d’un point',
  avecTaille.degatsMod, sansTaille.degatsMod)
egal('⭐ et le texte des dégâts est identique',
  avecTaille.degatsTexte, sansTaille.degatsTexte)

// Il s'applique aussi à distance : la table du livre ne distingue pas.
const fronde = { ...dague, nom: 'Fronde', famille: 'Arme courante — à distance', portee: 15, degats: '1d4' }
egal('attaque : le modificateur vaut aussi à distance',
  calculeArme({ ...fronde, modTaille: 1 }).attaque, calculeArme({ ...fronde }).attaque + 1)

// Et un modificateur négatif retire bien.
egal('attaque : une grande taille retire 1',
  calculeArme({ ...dague, modTaille: -1 }).attaque, sansTaille.attaque - 1)

// ─── 5. La charge transportable ───────────────────────────────────────────────
// ⭐ Non-régression d'abord : un appel SANS multiplicateur doit rendre
// exactement ce qu'il rendait avant le 2026-11-16, sinon les 68 fiches de taille
// moyenne verraient leurs seuils bouger.
egal('charge : sans multiplicateur, les seuils de FOR 10 sont ceux d’avant',
  getChargeLimitesKg(10), { legere: 16.5, moyenne: 33, lourde: 49.5 })
// ⭐ La version en LIVRES, elle aussi, doit rester neutre par défaut. Trou
// trouvé par l'épreuve par mutation : aucun contrôle ne la couvrait, et changer
// son défaut ne faisait rougir personne.
egal('charge : la table en LIVRES reste neutre par défaut (table du SRD, FOR 10)',
  getChargeLimites(10), { legere: 33, moyenne: 66, lourde: 99 })
egal('charge : et elle accepte le multiplicateur',
  getChargeLimites(10, 0.75), { legere: 24.75, moyenne: 49.5, lourde: 74.25 })
egal('charge : la catégorie en livres aussi',
  getChargeCategorie(10, 30, 0.75), 'moyenne')
egal('charge : ×3/4 abaisse les trois seuils',
  getChargeLimitesKg(10, 0.75), { legere: 12.375, moyenne: 24.75, lourde: 37.125 })
egal('charge : ×2 les double (créature de grande taille)',
  getChargeLimitesKg(10, 2), { legere: 33, moyenne: 66, lourde: 99 })

egal('charge : 13 kg à FOR 10 reste « légère » pour une taille moyenne',
  getChargeCategorieKg(10, 13), 'légère')
egal('⭐ mais passe en « moyenne » pour une petite taille',
  getChargeCategorieKg(10, 13, 0.75), 'moyenne')
egal('charge : 12 kg à FOR 10 reste « légère » même en petite taille',
  getChargeCategorieKg(10, 12, 0.75), 'légère')

// ─── 6. La base réelle et le code ─────────────────────────────────────────────
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

const races = await sql`select nom, taille from races order by nom`
verifier('base : le catalogue des races porte une taille', races.length > 0, `${races.length} races`)

// ⛔ Toute valeur de `races.taille` doit être reconnue par `categorieTaille`.
// Une valeur inconnue ne casse rien (modificateur 0) mais elle est SILENCIEUSE :
// une race de petite taille mal orthographiée perdrait son +1 sans un mot.
const inconnues = races.filter(r => r.taille && categorieTaille(r.taille as string) === null)
verifier('⭐ base : aucune taille de race n’est inconnue du module', inconnues.length === 0,
  inconnues.map(r => `${r.nom} = « ${r.taille} »`).join(', '))

const nulles = races.filter(r => !r.taille)
verifier('base : aucune race sans taille', nulles.length === 0,
  nulles.map(r => String(r.nom)).join(', '))

const fiches = await sql`
  select count(*)::int n, count(case when lower(coalesce(r.taille,'')) = 'petite' then 1 end)::int petites,
         count(case when c.race_id is null then 1 end)::int sans_race
  from characters c left join races r on r.id = c.race_id`
console.log(`\n   ${fiches[0].n} fiches · ${fiches[0].petites} de petite taille · ${fiches[0].sans_race} sans race`)
verifier('base : des fiches de petite taille existent, donc le lot sert à quelque chose',
  fiches[0].petites > 0, `${fiches[0].petites}`)

// Le code : les deux pages DOIVENT brancher la taille, sinon l'une dirait une
// chose et l'autre une autre — c'est ainsi que l'arc de Cormac affichait +16 à
// l'écran et +12 sur le papier, le 2026-10-10.
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n')
}
const lire = (p: string) => sansCommentaires(fs.readFileSync(path.join(RACINE, p), 'utf8'))

for (const page of ['src/app/personnage/[id]/page.tsx', 'src/app/personnage/[id]/imprimer/page.tsx']) {
  const src = lire(page)
  const nom = path.basename(path.dirname(page)) === 'imprimer' ? 'papier' : 'écran'
  verifier(`⭐ code (${nom}) : la CA reçoit la source de taille`,
    src.includes('sourceCATaille(nomTaille, modTailleAtk)') || src.includes('sourceCATaille(nomTaille, modTaille)'))
  verifier(`⭐ code (${nom}) : les lignes d’armes reçoivent le modificateur`,
    src.includes('modTaille: modTailleAtk'))
  verifier(`⭐ code (${nom}) : les BBA d’en-tête aussi`,
    /\+ modTailleAtk/.test(src),
    'sinon l’en-tête contredit la ligne d’arme juste en dessous — défaut payé le 2026-11-12')
  verifier(`⭐ code (${nom}) : la Discrétion reçoit SA table, pas celle de la CA`,
    src.includes('modificateurDiscretion(race?.taille)'))
}

// ─── Verdict ──────────────────────────────────────────────────────────────────
console.log(`\n${ok} contrôle(s) réussi(s), ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

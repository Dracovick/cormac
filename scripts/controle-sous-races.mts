/**
 * CONTRÔLES DES SOUS-RACES
 *
 *   npx tsx scripts/controle-sous-races.mts
 *
 * ⭐ Les ajustements attendus ci-dessous sont RECOPIÉS DU LIVRE, pas calculés
 * par `fusionner()`. Un contrôle qui redemande au code ce que le code a produit
 * rend toujours vert — la leçon a été payée sur une regex de nettoyage qui
 * annonçait 0 valeur fautive alors qu'il en restait 14.
 *
 * Sources des chiffres : SRD 3.5 français (chapitres Monstres) et Cadre de
 * campagne des Royaumes Oubliés VF, p. 11-20.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RACES_DND35, getRaceInfo, OPTIONS_RACE } from '../src/lib/dnd35/races'
import {
  SOUS_RACES_DND35, sousRacesDe, getSousRaceInfo, getRaceOuSousRace,
  decomposerRace, fusionner, picto, appellationsDe, nomSousRaceSelon, changerRace,
} from '../src/lib/dnd35/sous-races'
import { expandQuery } from '../src/lib/recherche-fiches'
import { generateCharacter } from '../src/lib/dnd35/generator'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable')
const sql = neon(url)

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

// ─── 1. Les ajustements, recopiés du livre ────────────────────────────────────
// [FOR, DEX, CON, INT, SAG, CHA] — le TOTAL effectif, race parente comprise.
const ATTENDUS: Record<string, [number, number, number, number, number, number]> = {
  // Halfelins : aucune sous-race ne touche aux caractéristiques.
  'Halfelin pied-léger':        [-2, 2, 0, 0, 0, 0],
  'Halfelin vaillant':          [-2, 2, 0, 0, 0, 0],
  'Halfelin sagespectre':       [-2, 2, 0, 0, 0, 0],
  'Halfelin grand':             [-2, 2, 0, 0, 0, 0],
  'Halfelin des profondeurs':   [-2, 2, 0, 0, 0, 0],
  // Nains : le duergar descend à −4 en Charisme, le nain d'or troque le Charisme
  // contre la Dextérité (ses ajustements REMPLACENT ceux du Manuel).
  'Nain des collines':          [0, 0, 2, 0, 0, -2],
  'Nain des montagnes':         [0, 0, 2, 0, 0, -2],
  'Nain des profondeurs':       [0, 0, 2, 0, 0, -2],
  'Duergar':                    [0, 0, 2, 0, 0, -4],
  "Nain d'écu":                 [0, 0, 2, 0, 0, -2],
  "Nain d'or":                  [0, -2, 2, 0, 0, 0],
  // Elfes : gris et drow S'AJOUTENT au haut-elfe; sauvage, aquatique et elfe du
  // soleil le REMPLACENT — d'où l'absence de −2 en Constitution chez les deux
  // premiers, et l'absence de +2 en Dextérité chez le troisième.
  'Haut-elfe':                  [0, 2, -2, 0, 0, 0],
  'Elfe gris':                  [-2, 2, -2, 2, 0, 0],
  'Elfe des bois':              [2, 2, -2, -2, 0, 0],
  'Elfe sauvage':               [0, 2, 0, -2, 0, 0],
  'Elfe aquatique':             [0, 2, 0, -2, 0, 0],
  'Drow':                       [0, 2, -2, 2, 0, 2],
  'Elfe de la lune':            [0, 2, -2, 0, 0, 0],
  'Elfe du soleil':             [0, 0, -2, 2, 0, 0],
  // Gnomes : le svirfnebelin remplace tout.
  'Gnome des roches':           [-2, 0, 2, 0, 0, 0],
  'Gnome des forêts':           [-2, 0, 2, 0, 0, 0],
  'Svirfnebelin':               [-2, 2, 0, 0, 2, -4],
}

egal('Le module couvre exactement les sous-races attendues',
  SOUS_RACES_DND35.map(s => s.nom).sort(), Object.keys(ATTENDUS).sort())

for (const sr of SOUS_RACES_DND35) {
  const f = fusionner(sr)
  const attendu = ATTENDUS[sr.nom]
  verifier(`${sr.nom} : race parente connue`, !!f, 'fusionner() a rendu undefined')
  if (!f || !attendu) continue
  egal(`${sr.nom} : ajustements`,
    [f.bonusFor, f.bonusDex, f.bonusCon, f.bonusInt, f.bonusSag, f.bonusCha], attendu)
}

// ─── 2. Les témoins qui prouvent que `remplaceAjustements` sert ───────────────
// Sans le drapeau, l'elfe sauvage hériterait du −2 en Constitution du haut-elfe
// et l'elfe du soleil garderait son +2 en Dextérité. Ce sont les deux cas où
// une erreur serait invisible : les chiffres resteraient « plausibles ».
verifier("Témoin : l'elfe sauvage n'a PAS de −2 en Constitution",
  fusionner(getSousRaceInfo('Elfe sauvage')!)!.bonusCon === 0)
verifier("Témoin : l'elfe du soleil n'a PAS de +2 en Dextérité",
  fusionner(getSousRaceInfo('Elfe du soleil')!)!.bonusDex === 0)
verifier("Témoin inverse : l'elfe GRIS garde bien le −2 en Constitution",
  fusionner(getSousRaceInfo('Elfe gris')!)!.bonusCon === -2)
verifier("Témoin inverse : le drow garde bien le +2 en Dextérité",
  fusionner(getSousRaceInfo('Drow')!)!.bonusDex === 2)

// ─── 3. Classes de prédilection et ajustements de niveau ──────────────────────
egal('Sagespectre : classe de prédilection barbare', fusionner(getSousRaceInfo('Halfelin sagespectre')!)!.classePreferee, 'Barbare')
egal('Elfe des bois : rôdeur', fusionner(getSousRaceInfo('Elfe des bois')!)!.classePreferee, 'Rôdeur')
egal('Elfe sauvage : ensorceleur', fusionner(getSousRaceInfo('Elfe sauvage')!)!.classePreferee, 'Ensorceleur')
egal('Elfe aquatique : guerrier', fusionner(getSousRaceInfo('Elfe aquatique')!)!.classePreferee, 'Guerrier')
egal('Svirfnebelin : roublard', fusionner(getSousRaceInfo('Svirfnebelin')!)!.classePreferee, 'Roublard')
egal('Vaillant : garde le roublard du halfelin', fusionner(getSousRaceInfo('Halfelin vaillant')!)!.classePreferee, 'Roublard')
egal('Duergar : ajustement de niveau +1 (Manuel des Monstres)', getSousRaceInfo('Duergar')!.ajustementNiveau, 1)
egal('Drow : ajustement de niveau +2', getSousRaceInfo('Drow')!.ajustementNiveau, 2)
egal('Svirfnebelin : ajustement de niveau +3', getSousRaceInfo('Svirfnebelin')!.ajustementNiveau, 3)
verifier('Aucun halfelin ne porte d’ajustement de niveau',
  sousRacesDe('Halfelin').every(s => !s.ajustementNiveau))

// ─── 4. Vision et déplacement ─────────────────────────────────────────────────
verifier('Halfelin des profondeurs : vision dans le noir acquise',
  fusionner(getSousRaceInfo('Halfelin des profondeurs')!)!.visionNocturne === true)
verifier('Témoin : le halfelin vaillant N’A PAS de vision dans le noir',
  fusionner(getSousRaceInfo('Halfelin vaillant')!)!.visionNocturne === false)
verifier('Toutes les sous-races gardent le déplacement de leur race',
  SOUS_RACES_DND35.every(s => fusionner(s)!.deplacement === getRaceInfo(s.race)!.deplacement))

// ─── 5. Résolution des noms et des alias ──────────────────────────────────────
egal('Cœurvaillant → Halfelin vaillant', getSousRaceInfo('Cœurvaillant')?.nom, 'Halfelin vaillant')
egal('Strongheart → Halfelin vaillant', getSousRaceInfo('strongheart')?.nom, 'Halfelin vaillant')
egal('Nain gris → Duergar', getSousRaceInfo('Nain gris')?.nom, 'Duergar')
egal('Elfe noir → Drow', getSousRaceInfo('Elfe noir')?.nom, 'Drow')
egal('Gnome des profondeurs → Svirfnebelin', getSousRaceInfo('Gnome des profondeurs')?.nom, 'Svirfnebelin')
egal('Elfe des mers → Elfe aquatique', getSousRaceInfo('Elfe des mers')?.nom, 'Elfe aquatique')
egal('Ghostwise → Halfelin sagespectre', getSousRaceInfo('Ghostwise')?.nom, 'Halfelin sagespectre')

// Témoins négatifs : ce qui ne DOIT PAS se résoudre.
for (const faux of ['Humain', 'Nain', 'Elfe', 'Bariaure', 'Illithid', 'Halfelin', 'Petite-gens', '', 'Vaillante']) {
  verifier(`Témoin négatif : « ${faux} » n'est pas une sous-race`, getSousRaceInfo(faux) === undefined)
}

// ─── 6. decomposerRace : l'aller-retour ───────────────────────────────────────
for (const sr of SOUS_RACES_DND35) {
  const d = decomposerRace(sr.nom)
  verifier(`${sr.nom} se décompose en ${sr.race}`, d.race === sr.race && d.sousRace === sr.nom,
    JSON.stringify(d))
}
egal('Une race du Manuel se décompose en elle-même, sans sous-race',
  decomposerRace('Humain'), { race: 'Humain', sousRace: null })
egal('Une race hors liste traverse intacte',
  decomposerRace('Bariaure'), { race: 'Bariaure', sousRace: null })
egal('Une race nulle ne casse rien', decomposerRace(null), { race: '', sousRace: null })

// ─── 7. Le menu : les alias de race doivent ouvrir les bonnes sous-races ──────
egal('« Petite-gens » propose les 5 halfelins', sousRacesDe('Petite-gens').length, 5)
egal('« Halfelin » propose les 5 halfelins', sousRacesDe('Halfelin').length, 5)
egal('« Humain » ne propose rien', sousRacesDe('Humain').length, 0)
egal('« Demi-Orque » ne propose rien', sousRacesDe('Demi-Orque').length, 0)
egal('« Bariaure » ne propose rien', sousRacesDe('Bariaure').length, 0)
egal('Elfe : 8 sous-races (haut-elfe, gris, bois, sauvage, aquatique, drow, lune, soleil)', sousRacesDe('Elfe').length, 8)
egal('Les 4 races à sous-races en couvrent 22 en tout', sousRacesDe('Halfelin').length + sousRacesDe('Nain').length + sousRacesDe('Elfe').length + sousRacesDe('Gnome').length, 22)
egal('Nain : 6 sous-races', sousRacesDe('Nain').length, 6)
egal('Gnome : 3 sous-races', sousRacesDe('Gnome').length, 3)

// ─── 8. getRaceOuSousRace : le point d'entrée des 4 appelants ─────────────────
egal('getRaceOuSousRace rend encore les races du Manuel', getRaceOuSousRace('Nain')?.bonusCon, 2)
egal('getRaceOuSousRace comprend une sous-race', getRaceOuSousRace('Duergar')?.bonusCha, -4)
egal('getRaceOuSousRace sur un nom inconnu', getRaceOuSousRace('Tarrasque'), undefined)
egal('getRaceOuSousRace sur null', getRaceOuSousRace(null), undefined)

// ─── 9. Les pictogrammes du vocabulaire des dons ──────────────────────────────
egal('⚙ pour un calcul', picto('calcul'), '⚙')
egal('✋ pour la main', picto('main'), '✋')
egal('ℹ pour l’information', picto('info'), 'ℹ')
verifier('Tout trait porte un effet valide',
  SOUS_RACES_DND35.every(s => s.traits.every(t => ['calcul', 'main', 'info'].includes(t.effet))))
verifier('Tout trait a un nom ET une description non vides',
  SOUS_RACES_DND35.every(s => s.traits.every(t => t.nom.trim() && t.description.trim())))
verifier('Toute sous-race a une description',
  SOUS_RACES_DND35.every(s => s.description.trim().length > 20))

// ─── 10. La base doit dire EXACTEMENT ce que le code dit ──────────────────────
// C'est le contrôle qui empêche l'écran (qui lit `races.bonus_*`) et la feuille
// imprimée (qui lit `getRaceOuSousRace`) de rendre deux chiffres différents.
const enBase = await sql`select nom, bonus_for, bonus_dex, bonus_con, bonus_int, bonus_sag, bonus_cha,
                                deplacement_base, vision_nocturne from races`
const parNom = new Map(enBase.map(r => [r.nom as string, r]))
for (const sr of SOUS_RACES_DND35) {
  const ligne = parNom.get(sr.nom)
  verifier(`${sr.nom} : présente en base`, !!ligne)
  if (!ligne) continue
  const f = fusionner(sr)!
  egal(`${sr.nom} : la base concorde avec le code`,
    [ligne.bonus_for, ligne.bonus_dex, ligne.bonus_con, ligne.bonus_int, ligne.bonus_sag, ligne.bonus_cha,
     ligne.deplacement_base, ligne.vision_nocturne],
    [f.bonusFor, f.bonusDex, f.bonusCon, f.bonusInt, f.bonusSag, f.bonusCha, f.deplacement, f.visionNocturne])
}

// ─── 11. Les traits à retirer existent VRAIMENT ───────────────────────────────
// Un nom mal orthographié dans `remplace` ne lève aucune erreur : il ne retire
// simplement rien, et la fiche affiche « Chance halfeline » à côté de « Pas de
// chance halfeline ». Ce contrôle est là pour ça.
const cle = (t: string) => t.trim().toLowerCase().replace(/[‘’ʼ]/g, "'")
for (const sr of SOUS_RACES_DND35) {
  if (!sr.remplace?.length) continue
  const parente = parNom.get(sr.race)
  if (!parente) { echecs.push(`${sr.nom} : race parente « ${sr.race} » absente de la base`); continue }
  const traitsParente = await sql`
    select f.nom from racial_features f join races r on r.id = f.race_id where r.nom = ${sr.race}`
  const noms = new Set(traitsParente.map(t => cle(t.nom as string)))
  for (const r of sr.remplace) {
    verifier(`${sr.nom} : le trait remplacé « ${r} » existe chez ${sr.race}`, noms.has(cle(r)),
      `traits disponibles : ${traitsParente.map(t => t.nom).join(' | ')}`)
  }
}

// ─── 12. Les fiches qui portent une sous-race sont toutes reconnues ───────────
// ⚠ L'invariant d'origine disait « aucune fiche ne porte de sous-race » — vrai
// au moment de la livraison, périmé dès qu'André en a saisi une (Bram
// Verrelune [99], passé en halfelin vaillant le 2026-11-12). Un contrôle sans
// condition de fin finit par mesurer autre chose que ce qu'il croit. Ce qui
// doit rester vrai, c'est que toute sous-race PORTÉE soit lisible : reconnue
// par `getSousRaceInfo`, et fusionnable en un profil complet.
const toutesVariantes = SOUS_RACES_DND35.flatMap(s =>
  appellationsDe(s.race).map(a => nomSousRaceSelon(a, s)))
const fichesSousRace = await sql`
  select c.id, c.nom, r.nom as race from characters c join races r on r.id = c.race_id
  where r.nom = any(${toutesVariantes})`
for (const f of fichesSousRace) {
  const sr = getSousRaceInfo(f.race)
  verifier(`[${f.id}] ${f.nom} : « ${f.race} » est une sous-race reconnue`, !!sr)
  verifier(`[${f.id}] ${f.nom} : « ${f.race} » rend un profil fusionné`, !!getRaceOuSousRace(f.race))
}

const totalFiches = await sql`select count(*)::int as n from characters`
egal('74 fiches, inchangé', totalFiches[0].n, 74)

// ─── 13. Les races du Manuel n'ont pas bougé ──────────────────────────────────
for (const r of RACES_DND35) {
  const ligne = parNom.get(r.nom)
  if (!ligne) { echecs.push(`Race du Manuel « ${r.nom} » absente de la base`); continue }
  egal(`${r.nom} : ajustements inchangés en base`,
    [ligne.bonus_for, ligne.bonus_dex, ligne.bonus_con, ligne.bonus_int, ligne.bonus_sag, ligne.bonus_cha],
    [r.bonusFor, r.bonusDex, r.bonusCon, r.bonusInt, r.bonusSag, r.bonusCha])
}


// ─── 14. LES DEUX APPELLATIONS D'UNE MÊME RACE ────────────────────────────────
//
// André, 2026-11-12 : « On garde Petite-gens et Halfelin... Plusieurs joueurs
// préfèrent le nom anglais! Tant que tout fonctionne avec les deux! »
//
// « Fonctionne » se mesure, il ne se promet pas. Chaque maillon de la chaîne est
// contrôlé sous les DEUX noms, et chaque contrôle positif a son témoin négatif :
// une équivalence qui accepte tout n'équivaut rien.

const VAILLANT = getSousRaceInfo('Halfelin vaillant')!
const DROW = getSousRaceInfo('Drow')!
verifier('Témoin de présence : le vaillant et le drow sont au module', !!VAILLANT && !!DROW)

// 14.1 Les appellations, lues de RACES_DND35 et jamais écrites en dur
egal('appellationsDe(Halfelin)', appellationsDe('Halfelin'), ['Halfelin', 'Petite-gens'])
egal("appellationsDe(Petite-gens) — l'alias rend la même liste", appellationsDe('Petite-gens'), ['Halfelin', 'Petite-gens'])
egal("⭐ témoin : Elfe n'a qu'une appellation", appellationsDe('Elfe'), ['Elfe'])
egal('⭐ témoin : une race inconnue ne reçoit aucun synonyme', appellationsDe('Bariaure'), ['Bariaure'])
egal('⭐ témoin : rien ne rend rien', appellationsDe(null), [])

// 14.2 Le nom composé — c'est lui qui est ENREGISTRÉ sur la fiche
egal('Petite-gens + vaillant = « Petite-gens vaillant »', nomSousRaceSelon('Petite-gens', VAILLANT), 'Petite-gens vaillant')
egal('Halfelin + vaillant inchangé', nomSousRaceSelon('Halfelin', VAILLANT), 'Halfelin vaillant')
egal('⭐ témoin : le drow ne reprend pas le nom de sa race, donc jamais réécrit', nomSousRaceSelon('Elfe', DROW), 'Drow')
egal('⭐ témoin : une appellation étrangère à la race ne compose rien', nomSousRaceSelon('Bariaure', VAILLANT), 'Halfelin vaillant')
egal('⭐ témoin : sans appellation, le nom canonique', nomSousRaceSelon(null, VAILLANT), 'Halfelin vaillant')

// 14.3 La reconnaissance du nom composé
verifier('« Petite-gens vaillant » est reconnu', getSousRaceInfo('Petite-gens vaillant')?.nom === 'Halfelin vaillant')
verifier('… à la casse et aux espaces près', getSousRaceInfo('  petite-gens VAILLANT ')?.nom === 'Halfelin vaillant')
verifier('« cœurvaillant » reste reconnu (alias du livre)', getSousRaceInfo('cœurvaillant')?.nom === 'Halfelin vaillant')
verifier("⭐ témoin : « Petite-gens drow » n'existe pas", getSousRaceInfo('Petite-gens drow') === undefined)
verifier("⭐ témoin : « Petite-gens » seul n'est pas une sous-race", getSousRaceInfo('Petite-gens') === undefined)

// 14.4 ⭐ LE CONTRÔLE QUI COMPTE : les CALCULS sont identiques sous les deux noms
for (const sr of sousRacesDe('Halfelin')) {
  const compose = nomSousRaceSelon('Petite-gens', sr)
  const a = getRaceOuSousRace(sr.nom)
  const b = getRaceOuSousRace(compose)
  egal(`${compose} : ajustements identiques à ${sr.nom}`,
    [b?.bonusFor, b?.bonusDex, b?.bonusCon, b?.bonusInt, b?.bonusSag, b?.bonusCha, b?.deplacement, b?.visionNocturne, b?.classePreferee],
    [a?.bonusFor, a?.bonusDex, a?.bonusCon, a?.bonusInt, a?.bonusSag, a?.bonusCha, a?.deplacement, a?.visionNocturne, a?.classePreferee])
}
egal('Les 5 sous-races de halfelins sont proposées sous les deux noms',
  sousRacesDe('Petite-gens').map(s => s.nom), sousRacesDe('Halfelin').map(s => s.nom))
verifier('⭐ témoin : il y en a bien 5, pas 0 (une liste vide rendrait tout vrai)', sousRacesDe('Petite-gens').length === 5)

// 14.5 La décomposition rend l'appellation PORTÉE — c'est elle que les menus et
// la feuille imprimée affichent.
egal('« Petite-gens vaillant » se décompose en Petite-gens', decomposerRace('Petite-gens vaillant'), { race: 'Petite-gens', sousRace: 'Petite-gens vaillant' })
egal('« Halfelin vaillant » inchangé (non-régression)', decomposerRace('Halfelin vaillant'), { race: 'Halfelin', sousRace: 'Halfelin vaillant' })
egal('un alias du livre canonise sur le nom du Manuel', decomposerRace('cœurvaillant'), { race: 'Halfelin', sousRace: 'Halfelin vaillant' })
egal('⭐ témoin : une race sans sous-race ressort telle quelle', decomposerRace('Petite-gens'), { race: 'Petite-gens', sousRace: null })
egal('⭐ témoin : Bariaure ressort tel quel', decomposerRace('Bariaure'), { race: 'Bariaure', sousRace: null })

// 14.6 Le générateur — noms et langues sont indexés par race du Manuel.
// ⚠ C'est ici que « Petite-gens » donnait des noms HUMAINS et le Commun seul.
const PRENOMS_HALFELINS = ['Andry', 'Cade', 'Eldon', 'Garret', 'Hob', 'Milo', 'Perrin']
for (const race of ['Halfelin', 'Petite-gens', 'Petite-gens vaillant', 'Halfelin vaillant']) {
  // ⚠ try/catch : le générateur JETTE sur une race qu'il ne reconnaît pas, et
  // une exception ici emporterait le verdict de tout le script avec elle.
  let g: ReturnType<typeof generateCharacter> | null = null
  try { g = generateCharacter({ race, classe: 'Roublard', niveau: 3, alignement: 'Neutre', sexe: 'Masculin' }) }
  catch (e) { echecs.push(`généré en « ${race} » : le générateur a jeté — ${(e as Error).message}`) }
  if (g) {
    const prenom = g.nom.split(' ')[0]
    verifier(`généré en « ${race} » : prénom halfelin`, PRENOMS_HALFELINS.includes(prenom), `obtenu « ${prenom} »`)
    egal(`généré en « ${race} » : langues du halfelin`, g.langues, ['Commun', 'Halfelin'])
  }
}
const temoinHumain = generateCharacter({ race: 'Humain', classe: 'Roublard', niveau: 3, alignement: 'Neutre', sexe: 'Masculin' })
verifier('⭐ témoin : un humain NE reçoit PAS un prénom halfelin',
  !PRENOMS_HALFELINS.includes(temoinHumain.nom.split(' ')[0]), `obtenu « ${temoinHumain.nom} »`)
egal('⭐ témoin : un humain ne reçoit pas les langues du halfelin', temoinHumain.langues, ['Commun'])

// 14.7 La recherche de la liste des personnages
egal('chercher « halfelin » cherche aussi petite-gens', [...expandQuery('halfelin')].sort(), ['halfelin', 'petite-gens'])
egal('chercher « petite-gens » cherche aussi halfelin', [...expandQuery('petite-gens')].sort(), ['halfelin', 'petite-gens'])
egal('⭐ témoin : les synonymes de classe ne sont pas écrasés', expandQuery('mage'), ['magicien', 'mage'])
egal('⭐ témoin : un terme sans synonyme reste seul', expandQuery('elfe'), ['elfe'])

// 14.9 Le menu Race : changer d'appellation garde la sous-race, changer de race l'abandonne
egal('Petite-gens → Halfelin garde le sagespectre', changerRace('Halfelin', 'Petite-gens sagespectre'), 'Halfelin sagespectre')
egal('Halfelin → Petite-gens garde le vaillant', changerRace('Petite-gens', 'Halfelin vaillant'), 'Petite-gens vaillant')
egal('⭐ témoin : Halfelin → Elfe ABANDONNE la sous-race', changerRace('Elfe', 'Petite-gens vaillant'), 'Elfe')
egal('⭐ témoin : Halfelin → Nain abandonne aussi', changerRace('Nain', 'Halfelin vaillant'), 'Nain')
egal('⭐ témoin : — Autre — abandonne la sous-race', changerRace('', 'Halfelin vaillant'), '')
egal('⭐ témoin : sans sous-race courante, la race passe telle quelle', changerRace('Halfelin', null), 'Halfelin')
egal('⭐ témoin : Elfe → Halfelin avec un drow abandonne (le drow n\'est pas halfelin)', changerRace('Halfelin', 'Drow'), 'Halfelin')
egal('Elfe → Elfe avec un drow le garde', changerRace('Elfe', 'Drow'), 'Drow')

// 14.10 Le menu Race offre les DEUX appellations — c'est la condition pour
// qu'un joueur puisse CHOISIR son nom, et non seulement le garder.
egal('Le menu Race compte 8 options pour 7 races', OPTIONS_RACE.length, 8)
verifier('« Halfelin » est au menu', OPTIONS_RACE.some(o => o.valeur === 'Halfelin' && o.libelle === 'Halfelin'))
verifier('« Petite-gens » est au menu, avec son équivalence',
  OPTIONS_RACE.some(o => o.valeur === 'Petite-gens' && o.libelle === 'Petite-gens (= Halfelin)'))
verifier('⭐ témoin : l\'option porte le nom NU en valeur, pas le libellé',
  OPTIONS_RACE.every(o => getRaceInfo(o.valeur) !== undefined))
egal('⭐ témoin : les 7 races du Manuel y sont toutes',
  RACES_DND35.filter(r => OPTIONS_RACE.some(o => o.valeur === r.nom)).length, 7)
verifier('⭐ témoin : aucune sous-race ne pollue le menu Race',
  !OPTIONS_RACE.some(o => getSousRaceInfo(o.valeur) !== undefined))
egal('⭐ témoin : chaque valeur est unique', new Set(OPTIONS_RACE.map(o => o.valeur)).size, OPTIONS_RACE.length)

// 14.8 En base : les deux lignes de race portent les MÊMES ajustements et les
// MÊMES traits. ⚠ C'est la condition pour qu'une fiche ne change pas de chiffre
// selon le nom sous lequel elle est saisie — et André garde les deux lignes.
const lignesHalfelines = await sql`
  select r.nom, r.bonus_for, r.bonus_dex, r.bonus_con, r.bonus_int, r.bonus_sag, r.bonus_cha,
         r.deplacement_base, r.vision_nocturne,
         (select count(*)::int from characters c where c.race_id = r.id) as fiches
  from races r where r.nom in ('Halfelin', 'Petite-gens') order by r.nom`
egal('Les deux lignes de race existent en base', lignesHalfelines.map(r => r.nom), ['Halfelin', 'Petite-gens'])
if (lignesHalfelines.length === 2) {
  const [h, pg] = lignesHalfelines
  egal("Petite-gens porte les mêmes ajustements qu'Halfelin en base",
    [pg.bonus_for, pg.bonus_dex, pg.bonus_con, pg.bonus_int, pg.bonus_sag, pg.bonus_cha, pg.deplacement_base, pg.vision_nocturne],
    [h.bonus_for, h.bonus_dex, h.bonus_con, h.bonus_int, h.bonus_sag, h.bonus_cha, h.deplacement_base, h.vision_nocturne])
  verifier('⭐ témoin de présence : les deux lignes portent des fiches',
    h.fiches > 0 && pg.fiches > 0, `Halfelin ${h.fiches}, Petite-gens ${pg.fiches}`)
}
const traitsDeux = await sql`
  select r.nom as race, f.nom
  from racial_features f join races r on r.id = f.race_id
  where r.nom in ('Halfelin', 'Petite-gens') order by f.nom`
const clefTrait = (t: string) => t.trim().toLowerCase().replace(/[‘’ʼ]/g, "'")
egal('Les traits raciaux des deux lignes sont les mêmes',
  traitsDeux.filter(t => t.race === 'Petite-gens').map(t => clefTrait(t.nom)),
  traitsDeux.filter(t => t.race === 'Halfelin').map(t => clefTrait(t.nom)))
verifier('⭐ témoin de présence : il y a bien des traits à comparer',
  traitsDeux.filter(t => t.race === 'Halfelin').length === 6)

// ─── Verdict ──────────────────────────────────────────────────────────────────
console.log(`\n${ok} contrôle(s) réussi(s), ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

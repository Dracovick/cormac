/**
 * Les 3 dernières potions sans fiche — même message, même chantier.
 *
 * Trouvées en balayant TOUS les rayons après les 41 objets magiques : le
 * message « La description de cette entrée n'a pas encore été relevée dans les
 * livres » ne s'affichait pas que chez les objets. Les 3 sont des lignes de la
 * saisie FileMaker d'André que le semis de la table 7-28 du Guide du Maître
 * (2026-10-05) n'a pas remplies :
 *
 *   [7]  Neutralisation du poison   → la potion EXISTE au livre (750 po) et le
 *                                     catalogue n'en a pas d'autre entrée :
 *                                     cette ligne est adoptée, on écrit sa fiche.
 *   [17] Potion de soins            → nom générique de 1re édition ; la saisie
 *                                     d'André dit « soins légers (1d8+1) »,
 *                                     ce qui désigne le modèle à 50 po. 0 porteur.
 *   [23] Potion de soins importants → l'entrée choisie par André comme cible de
 *                                     la fusion du 2026-10-05 (3 porteurs,
 *                                     13 références).
 *
 * ⚠ Son champ « effet » dit « 3d8+3 » là où le livre dit 3d8+5 (3d8 + 1 point
 * par niveau de lanceur, au niveau minimal de 5). Je ne touche pas à sa saisie :
 * la fiche le signale, l'arbitrage est au MJ.
 *
 * GARDE-FOUS : ne remplit que le vide, refuse si un nom a changé depuis ce
 * relevé, idempotent.
 *
 * Usage : npx tsx menage-references/p14-potions-appliquer.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

const FICHES = [
  {
    id: 7,
    nom: 'Neutralisation du poison',
    niveau: 3,
    description:
      "Ce sort chasse toutes les formes de poison de l'organisme de la créature touchée. Les effets temporaires du " +
      "poison cessent aussitôt, mais le sort n'annule pas ses effets instantanés : les points de vie et les points de " +
      "caractéristique déjà perdus ne sont pas restaurés. Si un poison a fait perdre 3 points de Constitution et " +
      "menace d'en ôter davantage, la potion prévient la perte future mais ne rend pas les points perdus.\n\n" +
      "La créature est en outre immunisée contre tout poison auquel elle est exposée pendant la durée du sort — " +
      "10 minutes par niveau de lanceur, soit 50 minutes pour une potion (NLS 5).\n\n" +
      "750 po. [Guide du Maître]\n\n" +
      "*Le livre la nomme « potion de neutralisation du poison ». La boire est une action simple qui provoque une " +
      "attaque d'opportunité.*",
  },
  {
    id: 17,
    nom: 'Potion de soins',
    niveau: 1,
    description:
      "Rend **1d8+1** points de vie au buveur (sort du 1er niveau, NLS 1). 50 po. [Guide du Maître]\n\n" +
      "⚠ « Potion de soins » tout court est un nom de 1re édition : la 3.5 a trois modèles, qui ne rendent pas la " +
      "même chose — **soins légers** (1d8+1, 50 po), **soins modérés** (2d8+3, 300 po) et **soins importants** " +
      "(3d8+5, 750 po). La saisie de cette ligne dit « soins légers », d'où le modèle retenu ici.\n\n" +
      "*Il n'existe pas de potion de soins intensifs : une potion ne peut contenir qu'un sort du 3e niveau ou moins, " +
      "et soins intensifs est du 4e.*",
  },
  {
    id: 23,
    nom: 'Potion de soins importants',
    niveau: 3,
    description:
      "Rend **3d8+5** points de vie au buveur (sort du 3e niveau, NLS 5 — 3d8 plus 1 point par niveau de lanceur). " +
      "750 po. [Guide du Maître]\n\n" +
      "C'est l'entrée officielle vers laquelle les anciennes orthographes de « Grand Soin » ont été fusionnées le " +
      "2026-10-05 : taper « grand soin » ou « posion de grand soin » dans la recherche mène ici.\n\n" +
      "⚠ Le champ *effet* de cette fiche porte « 3d8+3 », saisi à la main. Le livre donne 3d8+5 au niveau de lanceur " +
      "minimal. Je n'ai pas touché à la saisie : l'arbitrage est au MJ.",
  },
]

const lignes = await sql`SELECT id, nom, niveau, description FROM potions WHERE id = ANY(${FICHES.map(f => f.id)})` as any[]
const parId = new Map(lignes.map(l => [l.id, l]))

const fautes: string[] = []
for (const f of FICHES) {
  const l = parId.get(f.id)
  if (!l) fautes.push(`[${f.id}] ${f.nom} : absente de la base`)
  else if (l.nom !== f.nom) fautes.push(`[${f.id}] renommée : base « ${l.nom} » ≠ relevé « ${f.nom} »`)
}
const restantes = await sql`SELECT id, nom FROM potions WHERE description IS NULL OR btrim(description) = ''` as any[]
const horsReleve = restantes.filter(r => !FICHES.some(f => f.id === r.id))
if (horsReleve.length) fautes.push(`potions sans description hors de ce relevé : ${horsReleve.map(r => `[${r.id}] ${r.nom}`).join(', ')}`)

if (fautes.length) { console.log('⛔ REFUS :\n' + fautes.map(f => '  - ' + f).join('\n')); process.exit(1) }

let ecrites = 0, niveaux = 0, sautees = 0
for (const f of FICHES) {
  const l = parId.get(f.id)!
  if (!l.description || !String(l.description).trim()) {
    if (ECRIRE) await sql`UPDATE potions SET description = ${f.description} WHERE id = ${f.id}`
    ecrites++
  } else { sautees++; console.log(`  ⏭ [${f.id}] ${f.nom} : déjà remplie`) }
  if (l.niveau == null) {
    if (ECRIRE) await sql`UPDATE potions SET niveau = ${f.niveau} WHERE id = ${f.id}`
    niveaux++
  }
}
console.log(`fiches écrites ${ecrites} · niveaux complétés ${niveaux} · déjà remplies ${sautees}`)
if (!ECRIRE) { console.log('(essai à blanc)'); process.exit(0) }
const apres = await sql`SELECT count(*)::int total, count(*) FILTER (WHERE description IS NULL OR btrim(description)='')::int vides FROM potions` as any[]
console.log('après écriture :', apres[0])

/**
 * TYPE DE BONUS des objets magiques — migration 0011 + remplissage des 9 lignes
 * qui portent un `bonus` non nul.
 *
 * Décision d'André (DM, 2026-10-09) : « 1. Corriges le calcul de la CA, c'est
 * important! » — en réponse au défaut que je lui avais signalé la veille :
 * la fiche faisait `sum(item.bonus)` sur TOUS les objets magiques portés, sans
 * regarder ce que l'objet est.
 *
 * Le verdict, objet par objet, est écrit ci-dessous avec son motif. Il n'y a
 * AUCUNE déduction sur le nom : chaque ligne a été lue, et la description de
 * l'objet (saisie du MJ ou règle du Guide du Maître) tranche.
 *
 * ⚠ Ce script ne touche QUE la colonne `bonus_type`, et seulement si elle est
 * encore NULL. Il ne modifie aucun `bonus`, aucune description, aucun champ de
 * fiche de personnage. Les saisies d'André (`ca_naturelle`, `ca_deflexion`,
 * `ca_divers`) restent intactes : elles sont désormais arbitrées à l'affichage
 * par les règles de cumul, pas réécrites.
 *
 * Usage : npx tsx menage-references/p16-type-de-bonus.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

// `null` = ce bonus NE VA PAS à la classe d'armure.
type Verdict = { id: number; nom: string; bonus: number; type: string | null; motif: string }

const VERDICTS: Verdict[] = [
  {
    id: 1, nom: 'Cape de protection +1', bonus: 1, type: 'parade',
    motif: "La saisie du MJ dit « Confère un bonus de déviation de +1 à la CA et aux jets de sauvegarde ». « Déviation » est le mot du Grimoire pour le bonus de parade. Aucune « cape de protection » ne figure au Guide du Maître (il y a la cape de résistance, qui agit sur les sauvegardes, et la cape de déplacement, qui donne un bonus d'esquive) : c'est donc la décision du MJ qui fait loi, et elle dit « à la CA ».",
  },
  {
    id: 2, nom: 'Anneau de protection +2', bonus: 2, type: 'parade',
    motif: "Anneau de protection du Guide du Maître : « bonus de parade », qui s'applique même contre les attaques de contact et lorsque le porteur est pris au dépourvu.",
  },
  {
    id: 4, nom: 'Carquois de flèches +1', bonus: 1, type: null,
    motif: "« Flèches magiques +1 » — c'est un bonus d'ARME sur les munitions (attaque et dégâts), pas sur la classe d'armure. Aucun porteur aujourd'hui, mais la ligne aurait ajouté +1 de CA au premier qui l'aurait prise.",
  },
  {
    id: 5, nom: 'Gantelets de dextérité +2', bonus: 2, type: null,
    motif: "Gants de Dextérité du Guide du Maître : bonus d'ALTÉRATION de +2 à la Dextérité. +2 de Dex vaut +1 à la CA, +1 à l'initiative et +1 aux jets de Réflexes — pas +2 de CA. Le passage par la Dextérité est la seule voie juste, et le Grimoire la connaît déjà : c'est le champ `dex_magique` de la fiche.",
  },
  {
    id: 8, nom: "Bracers d'armure +2", bonus: 2, type: 'armure',
    motif: "La saisie du MJ dit « Confèrent un bonus d'armure de +2 à la CA ». Ce sont les bracelets d'armure du Guide du Maître. ⚠ Un bonus d'armure ne se cumule PAS avec une armure portée : le moteur compare les deux et garde le meilleur. Son unique porteuse, Elbereth, ne porte aucune armure — le +2 s'applique en entier.",
  },
  {
    id: 9, nom: "Bandeau d'intelligence +2", bonus: 2, type: null,
    motif: "« Augmente l'Intelligence de 2 points ». Un bonus d'Intelligence ne touche en rien la classe d'armure. Le Grimoire lui donnait +2 de CA. Sa porteuse Elbereth a d'ailleurs déjà `int_magique = 2` saisi : l'effet véritable était compté, le faux l'était en plus.",
  },
  {
    id: 10, nom: 'Cape de résistance +1', bonus: 1, type: null,
    motif: "« +1 à tous les jets de sauvegarde ». Cape de résistance du Guide du Maître : bonus de RÉSISTANCE aux trois sauvegardes, rien à la classe d'armure. Le Grimoire lui donnait +1 de CA.",
  },
  {
    id: 12, nom: 'Anneau de protection +1', bonus: 1, type: 'parade',
    motif: "La saisie du MJ le nomme elle-même : « Bonus de parade de +1 à la CA ».",
  },
  {
    id: 18, nom: 'Anneau de jade', bonus: 2, type: 'parade',
    motif: "Anneau de la campagne, absent du Guide du Maître. La saisie du MJ dit « Protection +2 et protection contre le feu » : c'est le vocabulaire de l'anneau de protection, donc un bonus de parade. La protection contre le feu est une résistance à l'énergie, elle ne touche pas la CA.",
  },
]

// ── Contrôle d'intégrité AVANT toute écriture ──
// Le script doit porter sur l'état mesuré, pas sur ma mémoire de cet état : si
// un objet a changé de nom ou de bonus depuis le relevé, on s'arrête.
const lignes = await sql`
  SELECT id, nom, bonus, bonus_type FROM magic_items WHERE id = ANY(${VERDICTS.map(v => v.id)}) ORDER BY id
` as { id: number; nom: string; bonus: number | null; bonus_type: string | null }[]

const parId = new Map(lignes.map(l => [l.id, l]))
const erreurs: string[] = []
for (const v of VERDICTS) {
  const l = parId.get(v.id)
  if (!l) { erreurs.push(`[${v.id}] ${v.nom} : la ligne n'existe plus en base.`); continue }
  if (l.nom !== v.nom) erreurs.push(`[${v.id}] le nom en base est « ${l.nom} », mon relevé disait « ${v.nom} ».`)
  if (l.bonus !== v.bonus) erreurs.push(`[${v.id}] ${l.nom} : le bonus en base est ${l.bonus}, mon relevé disait ${v.bonus}.`)
}

// Aucun autre objet ne doit porter un bonus non nul : s'il en apparaît un, il
// faut le trancher à la main, pas le laisser filer avec bonus_type NULL.
const autres = await sql`
  SELECT id, nom, bonus FROM magic_items
  WHERE COALESCE(bonus,0) <> 0 AND NOT (id = ANY(${VERDICTS.map(v => v.id)}))
` as { id: number; nom: string; bonus: number }[]
for (const a of autres) erreurs.push(`[${a.id}] « ${a.nom} » porte un bonus de ${a.bonus} et n'est pas dans mes verdicts — à trancher.`)

if (erreurs.length) {
  console.error('\n⛔ ARRÊT — l\'état en base ne correspond pas au relevé :\n')
  for (const e of erreurs) console.error('   ' + e)
  process.exit(1)
}

// ── Déjà passé ? ──
const dejaFait = VERDICTS.every(v => {
  const l = parId.get(v.id)!
  return v.type === null ? l.bonus_type === null : l.bonus_type === v.type
})
const aEcrire = VERDICTS.filter(v => v.type !== null && parId.get(v.id)!.bonus_type !== v.type)

console.log(`\n=== ${VERDICTS.length} objets à bonus non nul · ${aEcrire.length} type(s) à écrire ===\n`)
for (const v of VERDICTS) {
  const l = parId.get(v.id)!
  const etat = l.bonus_type === (v.type ?? null) ? '✓ déjà' : v.type === null ? '— ne compte pas dans la CA' : `→ « ${v.type} »`
  console.log(`[${v.id}] ${v.nom} (+${v.bonus})  ${etat}`)
  console.log(`      ${v.motif}\n`)
}

if (dejaFait && !aEcrire.length) {
  console.log('✓ Les 9 types sont déjà en base — rien à écrire, le script est rejouable.\n')
  process.exit(0)
}

if (!ECRIRE) {
  console.log('(simulation — relancer avec --ecrire)\n')
  process.exit(0)
}

// ── Archive de l'état d'avant, en clair ──
const avant = await sql`SELECT id, nom, bonus, bonus_type FROM magic_items WHERE COALESCE(bonus,0) <> 0 ORDER BY id`
fs.writeFileSync(
  'X:/Claude-Tools/cormac/menage-references/p16-type-de-bonus-etat-avant.json',
  JSON.stringify(avant, null, 2), 'utf8',
)

for (const v of aEcrire) {
  await sql`UPDATE magic_items SET bonus_type = ${v.type} WHERE id = ${v.id} AND bonus_type IS NULL`
  console.log(`  écrit  [${v.id}] ${v.nom} → ${v.type}`)
}

// ── Contrôle après écriture ──
const apres = await sql`
  SELECT id, nom, bonus, bonus_type FROM magic_items WHERE COALESCE(bonus,0) <> 0 ORDER BY id
` as { id: number; nom: string; bonus: number; bonus_type: string | null }[]
console.log('\n=== état final ===')
let ok = true
for (const a of apres) {
  const v = VERDICTS.find(x => x.id === a.id)!
  const bon = a.bonus_type === (v.type ?? null)
  if (!bon) ok = false
  console.log(`  ${bon ? '✓' : '✗'} [${a.id}] ${a.nom} (+${a.bonus}) → ${a.bonus_type ?? 'NULL (hors CA)'}`)
}
console.log(ok ? '\n✓ Les 9 verdicts sont en base.\n' : '\n✗ ÉCART — vérifier à la main.\n')
process.exit(ok ? 0 : 1)

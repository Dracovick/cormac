// Phase 2 — blocs techniques des sorts décrits par renvoi au Manuel des Joueurs de Faerûn.
//
// Le chapitre 3 écrit certains sorts en entier et en traite d'autres par renvoi :
// « À l'exception de ce qui suit, ce sort fonctionne sur le même principe que X ».
// Leur fiche n'imprime alors que l'école, le niveau, et parfois un ou deux champs —
// pas de portée, pas de durée, pas de composantes. Même situation qu'aux familles
// d'alignement du Manuel (voir p5-blocs-derives.mts), même remède.
//
// Chaque couple ci-dessous a été lu à l'image, page par page. Le champ `zone` n'est
// rempli à la main QUE lorsque la phrase de renvoi change justement l'effet — le piège
// de la famille Rejet : recopier mot à mot y aurait donné une cible fausse.
//
// Ne remplit QUE les champs vides. Ne touche jamais une valeur existante.
//
// Usage : npx tsx menage-references/p6-blocs-derives-mjf.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')

type Couple = {
  derive: string        // nom tel qu'il est stocké en base
  reference: string     // nom tel qu'il est stocké en base
  page: number          // page imprimée de la fiche du dérivé
  zone?: string         // zone d'effet écrite à la main, quand le renvoi la change
}

const COUPLES: Couple[] = [
  // Le renvoi ne change que des valeurs chiffrées de protection — bloc identique.
  { derive: 'Bouclier suprême de Lathandre', reference: 'Bouclier de Lathandre', page: 101 },
  // « Les plantes prennent la forme de buissons épineux » : l'étendue reste celle d'enchevêtrement.
  { derive: 'Enchevêtrement épineux', reference: 'Enchevêtrement', page: 106 },
  // ⚠ Le renvoi DOUBLE l'arme : arme spirituelle en crée une, épée et marteau en crée deux.
  {
    derive: 'Épée et marteau', reference: 'Arme spirituelle', page: 106,
    zone: 'deux armes magiques de force (une épée longue et un marteau de guerre)',
  },
  // ⚠ Dérivé d'un dérivé. Le renvoi change la taille des armes, pas le reste du bloc.
  {
    derive: 'Épée et marteau suprêmes', reference: 'Épée et marteau', page: 106,
    zone: 'deux armes magiques de force de taille G (une épée longue et un marteau de guerre)',
  },
  // Le livre imprime déjà « Effet : capteur magique » ; le renvoi ne touche ni portée ni durée.
  { derive: 'Œil de pouvoir', reference: 'Œil du mage', page: 113 },
  // Le livre imprime déjà la durée ; le renvoi ne change que l'état infligé.
  { derive: 'Remontrance de Nybor', reference: 'Doux rappel de Nybor', page: 117 },
  // Le livre imprime déjà « Effet : matrice retenant 2 sorts » (contre 1 à la matrice).
  { derive: 'Séquenceur de la Simbule', reference: 'Matrice de la Simbule', page: 117 },
]

const COLONNES = ['composantes', 'portee', 'zone_effet', 'duree', 'jet_de_sauvegarde', 'resistance_magique'] as const
const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''

let champs = 0, notes = 0
for (const c of COUPLES) {
  const ref = (await sql`SELECT * FROM spells WHERE nom = ${c.reference}` as any[])[0]
  if (!ref) { console.error(`✖ référence introuvable : ${c.reference}`); process.exit(1) }
  const s = (await sql`SELECT * FROM spells WHERE nom = ${c.derive}` as any[])[0]
  if (!s) { console.error(`✖ dérivé introuvable : ${c.derive}`); process.exit(1) }

  const aPoser = COLONNES.filter(col => vide(s[col]) && (col === 'zone_effet' && c.zone ? true : !vide(ref[col])))
  console.log(`[${s.id}] ${c.derive} ← [${ref.id}] ${ref.nom} (p. ${c.page}) : ${aPoser.length ? aPoser.join(', ') : 'rien à poser'}`)
  if (!appliquer || !aPoser.length) continue

  for (const col of aPoser) {
    const v = col === 'zone_effet' && c.zone ? c.zone : ref[col]
    const r = col === 'composantes' ? await sql`UPDATE spells SET composantes = ${v} WHERE id = ${s.id} AND (composantes IS NULL OR trim(composantes)='') RETURNING id`
      : col === 'portee' ? await sql`UPDATE spells SET portee = ${v} WHERE id = ${s.id} AND (portee IS NULL OR trim(portee)='') RETURNING id`
      : col === 'zone_effet' ? await sql`UPDATE spells SET zone_effet = ${v} WHERE id = ${s.id} AND (zone_effet IS NULL OR trim(zone_effet)='') RETURNING id`
      : col === 'duree' ? await sql`UPDATE spells SET duree = ${v} WHERE id = ${s.id} AND (duree IS NULL OR trim(duree)='') RETURNING id`
      : col === 'jet_de_sauvegarde' ? await sql`UPDATE spells SET jet_de_sauvegarde = ${v} WHERE id = ${s.id} AND (jet_de_sauvegarde IS NULL OR trim(jet_de_sauvegarde)='') RETURNING id`
      : await sql`UPDATE spells SET resistance_magique = ${v} WHERE id = ${s.id} AND (resistance_magique IS NULL OR trim(resistance_magique)='') RETURNING id`
    if (r.length === 1) champs++
  }
  const adaptee = c.zone ? ", l'effet étant celui qu'annonce la phrase de renvoi" : ''
  const note = `*Blocs techniques repris de ${ref.nom.toLowerCase()}${adaptee} : le Manuel des Joueurs de Faerûn (p. ${c.page}) ne les réimprime pas pour ce sort, il le traite par renvoi.*`
  const r = await sql`UPDATE spells SET description = description || E'\n\n' || ${note}
    WHERE id = ${s.id} AND description IS NOT NULL AND position(${note} in description) = 0 RETURNING id` as any[]
  if (r.length === 1) notes++
}

const reste = await sql`SELECT count(*)::int n FROM spells WHERE (portee IS NULL OR trim(portee)='') OR (duree IS NULL OR trim(duree)='')` as any[]
console.log(`\n${appliquer ? '' : '[APERÇU] '}champs posés : ${champs} | lignes de provenance ajoutées : ${notes}`)
console.log(`fiches encore incomplètes : ${reste[0].n}`)

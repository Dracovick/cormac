/**
 * DIAGNOSTIC — les 68 lignes de campagne du rayon Objets magiques.
 *
 * Question d'André (DM, 2026-10-09) : « Les 68 lignes de campagne : les garder
 * au rayon de la Bibliothèque, ou les en sortir ? TU m'explique svp! »
 *
 * De quoi la réponse dépend, en chiffres :
 *   - combien sont portées par un personnage, et par combien de personnages ;
 *   - combien sont rattachées à une entrée de livre par leur 📖 (`catalogue_id`) ;
 *   - combien portent une note de MJ qu'aucun livre ne contient ;
 *   - combien sont des quantités d'inventaire plutôt que des objets.
 *
 * Usage : npx tsx menage-references/p17-diag-lignes-campagne.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const lignes = await sql`
  SELECT mi.id, mi.nom, mi.type, mi.bonus, mi.bonus_type, mi.catalogue_id, mi.prix,
         LENGTH(COALESCE(mi.description,'')) AS taille_desc,
         COUNT(cmi.id)::int AS n_lignes_fiche,
         COUNT(DISTINCT cmi.personnage_id)::int AS n_porteurs,
         STRING_AGG(DISTINCT c.nom, ', ' ORDER BY c.nom) AS porteurs
  FROM magic_items mi
  LEFT JOIN character_magic_items cmi ON cmi.objet_id = mi.id
  LEFT JOIN characters c ON c.id = cmi.personnage_id
  WHERE NOT mi.est_catalogue
  GROUP BY mi.id, mi.nom, mi.type, mi.bonus, mi.bonus_type, mi.catalogue_id, mi.prix, mi.description
  ORDER BY COUNT(DISTINCT cmi.personnage_id) DESC, mi.nom
` as any[]

const portees = lignes.filter(l => l.n_porteurs > 0)
const orphelines = lignes.filter(l => l.n_porteurs === 0)
const rattachees = lignes.filter(l => l.catalogue_id)
const anglaises = lignes.filter(l => /^(ring|wand|arrow|rabit|cat|last|scroll|boots|cloak|amulet)/i.test(l.nom))
const quantites = lignes.filter(l => /^\d+\s/.test(l.nom))

console.log(`
=== LES ${lignes.length} LIGNES DE CAMPAGNE ===

  portées par au moins un personnage : ${portees.length}
  orphelines (plus aucun porteur)    : ${orphelines.length}
  rattachées à une entrée de livre 📖 : ${rattachees.length}
  nom anglais                        : ${anglaises.length}
  quantité d'inventaire (« 75 flèches ») : ${quantites.length}
  avec un prix                       : ${lignes.filter(l => l.prix).length}
  avec un bonus qui compte dans la CA: ${lignes.filter(l => l.bonus_type).length}
  description vide                   : ${lignes.filter(l => l.taille_desc === 0).length}
`)

console.log('─── Les lignes PORTÉES (ce que la Bibliothèque perdrait pour un joueur) ───\n')
for (const l of portees) {
  console.log(
    `  [${String(l.id).padStart(3)}] ${String(l.nom).slice(0, 36).padEnd(37)}` +
    `${l.n_porteurs} porteur(s)  ${l.catalogue_id ? `📖→[${l.catalogue_id}]` : '—       '}  ` +
    `${String(l.taille_desc).padStart(4)} c  ${l.porteurs?.slice(0, 40) ?? ''}`
  )
}

console.log('\n─── Les lignes ORPHELINES (aucune fiche ne les porte) ───\n')
for (const l of orphelines) {
  console.log(`  [${String(l.id).padStart(3)}] ${String(l.nom).slice(0, 44).padEnd(45)}${l.catalogue_id ? `📖→[${l.catalogue_id}]` : '—'}  ${String(l.taille_desc).padStart(4)} c`)
}

// Combien d'entrées le rayon affiche-t-il aujourd'hui, et que resterait-il ?
const [t] = await sql`
  SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE est_catalogue)::int AS cat FROM magic_items
` as any[]
console.log(`\n=== Le rayon : ${t.total} entrées aujourd'hui → ${t.cat} si les lignes de campagne en sortaient ===\n`)

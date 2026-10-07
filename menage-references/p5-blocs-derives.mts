// Phase 2 — blocs techniques des versions dérivées des sorts d'alignement.
//
// Le Manuel écrit la fiche complète d'UNE version par famille — celle « contre le Mal » —
// et traite les trois autres par un renvoi : « Ce sort est semblable à protection contre
// le Mal, si ce n'est que… ». Leur fiche n'imprime donc que l'école et la phrase de renvoi,
// pas de portée, pas de durée, pas de composantes. Vérifié à l'image p. 276 (Protection),
// et les douze dérivées renvoient toutes à la version du Mal de leur famille.
//
// Pour un MJ à la table, une fiche sans portée ni durée ne sert à rien. Ce script recopie
// le bloc technique de la version de référence sur les trois dérivées — c'est exactement
// ce que dit la formule « semblable à » du livre — et l'écrit en toutes lettres dans la
// fiche pour qu'on sache d'où vient la valeur.
//
// Ne remplit QUE les champs vides. Ne touche jamais la description elle-même, sauf pour
// y ajouter la ligne de provenance en queue.
//
// Usage : npx tsx menage-references/p5-blocs-derives.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')

const FAMILLES: Array<{ reference: string; derivees: string[] }> = [
  { reference: 'Cercle magique contre le Mal', derivees: ['Cercle magique contre la Loi', 'Cercle magique contre le Bien', 'Cercle magique contre le Chaos'] },
  { reference: 'Détection du Mal', derivees: ['Détection de la Loi', 'Détection du Bien', 'Détection du Chaos'] },
  { reference: 'Protection contre le Mal', derivees: ['Protection contre la Loi', 'Protection contre le Bien', 'Protection contre le Chaos'] },
  { reference: 'Rejet du Mal', derivees: ['Rejet de la Loi', 'Rejet du Bien', 'Rejet du Chaos'] },
]

// ⚠ Trois des quatre familles ont une zone d'effet neutre (« créature touchée »,
// « émanation en forme de cône »…) qui se recopie telle quelle. La famille Rejet, elle,
// NOMME l'alignement dans sa cible — la recopier mot à mot donnerait à « Rejet de la Loi »
// une cible maléfique. On écrit donc sa cible version par version, à la main, d'après le
// texte de rejet du Mal (p. 282) et la phrase de renvoi de chaque version.
const ZONE_PAR_VERSION: Record<string, string> = {
  'Rejet de la Loi': "le jeteur de sorts et 1 créature extraplanaire loyale, ou le jeteur et le sort de la Loi ou l'enchantement affectant la créature ou l'objet touché",
  'Rejet du Bien': "le jeteur de sorts et 1 créature extraplanaire bonne, ou le jeteur et le sort du Bien ou l'enchantement affectant la créature ou l'objet touché",
  'Rejet du Chaos': "le jeteur de sorts et 1 créature extraplanaire chaotique, ou le jeteur et le sort du Chaos ou l'enchantement affectant la créature ou l'objet touché",
}

const COLONNES = ['composantes', 'portee', 'zone_effet', 'duree', 'jet_de_sauvegarde', 'resistance_magique'] as const
const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''

let champs = 0, notes = 0
for (const f of FAMILLES) {
  const ref = (await sql`SELECT * FROM spells WHERE nom = ${f.reference}` as any[])[0]
  if (!ref) { console.error(`✖ version de référence introuvable : ${f.reference}`); process.exit(1) }
  console.log(`\n━━ référence : [${ref.id}] ${ref.nom}`)
  for (const c of COLONNES) console.log(`   ${c.padEnd(20)} ${vide(ref[c]) ? '— (vide au livre, rien à propager)' : ref[c]}`)

  for (const d of f.derivees) {
    const s = (await sql`SELECT * FROM spells WHERE nom = ${d}` as any[])[0]
    if (!s) { console.error(`✖ version dérivée introuvable : ${d}`); process.exit(1) }
    const aPoser = COLONNES.filter(c => vide(s[c]) && !vide(ref[c]))
    if (!aPoser.length) { console.log(`   [${s.id}] ${d} — rien à poser`); continue }
    console.log(`   [${s.id}] ${d} → ${aPoser.join(', ')}`)
    if (appliquer) {
      for (const c of aPoser) {
        const v = c === 'zone_effet' && ZONE_PAR_VERSION[d] ? ZONE_PAR_VERSION[d] : ref[c]
        const r = c === 'composantes' ? await sql`UPDATE spells SET composantes = ${v} WHERE id = ${s.id} AND (composantes IS NULL OR trim(composantes)='') RETURNING id`
          : c === 'portee' ? await sql`UPDATE spells SET portee = ${v} WHERE id = ${s.id} AND (portee IS NULL OR trim(portee)='') RETURNING id`
          : c === 'zone_effet' ? await sql`UPDATE spells SET zone_effet = ${v} WHERE id = ${s.id} AND (zone_effet IS NULL OR trim(zone_effet)='') RETURNING id`
          : c === 'duree' ? await sql`UPDATE spells SET duree = ${v} WHERE id = ${s.id} AND (duree IS NULL OR trim(duree)='') RETURNING id`
          : c === 'jet_de_sauvegarde' ? await sql`UPDATE spells SET jet_de_sauvegarde = ${v} WHERE id = ${s.id} AND (jet_de_sauvegarde IS NULL OR trim(jet_de_sauvegarde)='') RETURNING id`
          : await sql`UPDATE spells SET resistance_magique = ${v} WHERE id = ${s.id} AND (resistance_magique IS NULL OR trim(resistance_magique)='') RETURNING id`
        if (r.length === 1) champs++
      }
      const adaptee = ZONE_PAR_VERSION[d] ? ", la cible étant transposée à l'alignement de cette version" : ''
      const note = `*Blocs techniques (composantes, portée, zone d'effet, durée, jet de sauvegarde, résistance à la magie) repris de ${ref.nom.toLowerCase()}${adaptee} : le Manuel ne les réimprime pas pour cette version, il la traite par renvoi.*`
      const r = await sql`UPDATE spells SET description = description || E'\n\n' || ${note}
        WHERE id = ${s.id} AND description IS NOT NULL AND position(${note} in description) = 0 RETURNING id` as any[]
      if (r.length === 1) notes++
    }
  }
}
console.log(`\n${appliquer ? '' : '[APERÇU] '}champs posés : ${champs} | lignes de provenance ajoutées : ${notes}`)

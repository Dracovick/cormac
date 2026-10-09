/**
 * DIAGNOSTIC 2 — pour chacun des 8 objets qui alimentent la CA :
 *   - sa description (ce que le MJ et le livre en disent)
 *   - son entrée de catalogue rattachée, s'il y en a une
 * Et pour chacun des 7 porteurs :
 *   - les caractéristiques magiques saisies (pour détecter un DOUBLE comptage)
 *   - les armures portées (bracelets d'armure NE SE CUMULENT PAS avec une armure)
 *   - les jets de sauvegarde (la cape de résistance agit là, pas sur la CA)
 *
 * Usage : npx tsx menage-references/p16-diag-ca2.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const IDS = [1, 2, 5, 8, 9, 10, 12, 18]
const objets = await sql`
  SELECT mi.id, mi.nom, mi.type, mi.bonus, mi.prix, mi.est_catalogue, mi.catalogue_id,
         mi.description, cat.nom AS cat_nom, cat.type AS cat_type, cat.bonus AS cat_bonus
  FROM magic_items mi
  LEFT JOIN magic_items cat ON cat.id = mi.catalogue_id
  WHERE mi.id = ANY(${IDS}) ORDER BY mi.id
` as any[]

for (const o of objets) {
  console.log(`\n${'='.repeat(78)}\n[${o.id}] ${o.nom}  (type=${o.type}, bonus=${o.bonus}, prix=${o.prix ?? '—'}, catalogue=${o.est_catalogue})`)
  if (o.catalogue_id) console.log(`  📖 rattaché à [${o.catalogue_id}] ${o.cat_nom} (type=${o.cat_type}, bonus=${o.cat_bonus})`)
  else console.log(`  📖 aucun rattachement au catalogue`)
  console.log(`  --- description ---\n${(o.description ?? '(vide)').split('\n').map((l: string) => '  | ' + l).join('\n')}`)
}

const CIDS = [1, 3, 4, 43, 47, 56, 82, 86]
console.log(`\n\n${'#'.repeat(78)}\n# PORTEURS — caractéristiques magiques, armures, sauvegardes\n${'#'.repeat(78)}`)
const persos = await sql`
  SELECT c.id, c.nom, a.for_magique, a.dex_magique, a.con_magique, a.int_magique,
         a.sag_magique, a.cha_magique, a.dex_base, a.int_base,
         cs.ca_naturelle, cs.ca_deflexion, cs.ca_divers, cs.ca_base,
         st.vigueur_magique, st.reflexes_magique, st.volonte_magique
  FROM characters c
  LEFT JOIN character_ability_scores a ON a.personnage_id = c.id
  LEFT JOIN character_combat_stats cs ON cs.personnage_id = c.id
  LEFT JOIN character_saving_throws st ON st.personnage_id = c.id
  WHERE c.id = ANY(${CIDS}) ORDER BY c.nom
` as any[]
for (const p of persos) {
  console.log(`\n#${p.id} ${p.nom}`)
  console.log(`   carac. magiques : FOR+${p.for_magique ?? 0} DEX+${p.dex_magique ?? 0} CON+${p.con_magique ?? 0} INT+${p.int_magique ?? 0} SAG+${p.sag_magique ?? 0} CHA+${p.cha_magique ?? 0}   (DEX base ${p.dex_base}, INT base ${p.int_base})`)
  console.log(`   CA saisie       : base=${p.ca_base ?? '—'} naturelle=${p.ca_naturelle ?? 0} parade=${p.ca_deflexion ?? 0} divers=${p.ca_divers ?? 0}`)
  console.log(`   sauv. « divers »: Vig ${p.vigueur_magique ?? 0} / Réf ${p.reflexes_magique ?? 0} / Vol ${p.volonte_magique ?? 0}`)
  const arm = await sql`
    SELECT a.nom, a.type, a.bonus_armure, ca.bonus_magique, ca.est_portee
    FROM character_armor ca JOIN armor a ON a.id = ca.armure_id
    WHERE ca.personnage_id = ${p.id}
  ` as any[]
  if (!arm.length) console.log(`   armures         : aucune`)
  for (const a of arm) console.log(`   armure          : ${a.nom} (${a.type}) +${a.bonus_armure ?? 0}${a.bonus_magique ? ` +${a.bonus_magique} mag` : ''} portée=${a.est_portee}`)
}

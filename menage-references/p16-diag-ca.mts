/**
 * DIAGNOSTIC — qui contribue à la CA aujourd'hui, et à quel titre.
 *
 * Le Grimoire fait `sum(item.bonus)` sur TOUS les objets magiques portés
 * (src/app/personnage/[id]/page.tsx:122 et .../imprimer/page.tsx:125), sans
 * regarder le type de l'objet ni le type de bonus. On mesure l'étendue réelle
 * du défaut avant de décider quoi écrire.
 *
 * Usage : npx tsx menage-references/p16-diag-ca.mts
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// 1. Toutes les lignes d'inventaire d'objets magiques dont le bonus compte dans la CA
const portes = await sql`
  SELECT c.id AS cid, c.nom AS perso, cmi.id AS lid, mi.id AS iid, mi.nom, mi.type,
         mi.emplacement, mi.bonus, mi.est_catalogue, mi.catalogue_id
  FROM character_magic_items cmi
  JOIN characters c ON c.id = cmi.personnage_id
  JOIN magic_items mi ON mi.id = cmi.objet_id
  WHERE COALESCE(mi.bonus, 0) <> 0
  ORDER BY c.nom, mi.nom
` as any[]

console.log(`\n=== ${portes.length} lignes d'inventaire ajoutent un bonus à la CA ===\n`)
for (const p of portes) {
  console.log(
    `  #${p.cid} ${String(p.perso).padEnd(22)} [${p.iid}] ${String(p.nom).padEnd(40)} ` +
    `bonus=${p.bonus}  type=${p.type ?? '—'}  empl=${p.emplacement ?? '—'}  cat=${p.est_catalogue}`
  )
}

// 2. Répartition des `type` sur tout le rayon, pour savoir sur quoi on peut trancher
const types = await sql`
  SELECT COALESCE(type,'(null)') AS type, COUNT(*)::int AS n,
         COUNT(*) FILTER (WHERE COALESCE(bonus,0) <> 0)::int AS n_bonus
  FROM magic_items GROUP BY 1 ORDER BY 2 DESC
` as any[]
console.log(`\n=== types présents dans magic_items (${types.length}) ===\n`)
for (const t of types) console.log(`  ${String(t.type).padEnd(32)} ${String(t.n).padStart(4)} lignes, ${t.n_bonus} avec bonus`)

// 3. Les champs de CA saisis sur les personnages concernés
const cids = [...new Set(portes.map(p => p.cid))]
if (cids.length) {
  const stats = await sql`
    SELECT c.id, c.nom, cs.ca_naturelle, cs.ca_deflexion, cs.ca_divers,
           a.dex_base, a.dex_magique
    FROM characters c
    LEFT JOIN character_combat_stats cs ON cs.personnage_id = c.id
    LEFT JOIN character_ability_scores a ON a.personnage_id = c.id
    WHERE c.id = ANY(${cids})
    ORDER BY c.nom
  ` as any[]
  console.log(`\n=== champs de CA des porteurs ===\n`)
  for (const s of stats) {
    console.log(
      `  #${s.id} ${String(s.nom).padEnd(22)} nat=${s.ca_naturelle ?? '—'} ` +
      `defl=${s.ca_deflexion ?? '—'} divers=${s.ca_divers ?? '—'} ` +
      `dex=${s.dex_base ?? '—'}+${s.dex_magique ?? 0}(mag)`
    )
  }
}

// 4. Le rayon : combien d'entrées portent un bonus, catalogue vs campagne
const [agg] = await sql`
  SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE est_catalogue)::int AS catalogue,
         COUNT(*) FILTER (WHERE NOT est_catalogue)::int AS campagne,
         COUNT(*) FILTER (WHERE COALESCE(bonus,0) <> 0)::int AS avec_bonus
  FROM magic_items
` as any[]
console.log(`\n=== rayon ===\n  ${agg.total} lignes · ${agg.catalogue} catalogue · ${agg.campagne} campagne · ${agg.avec_bonus} avec bonus\n`)

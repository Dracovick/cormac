import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// Fusion des doublons vers [23] « Potion de soins importants » (choix d'André, DM 2026-10-04)
// Avant (relevé potions-etat-2026-10-04.mts) :
//   [5] Potion de Grand Soin      → Cormac cp[336]
//   [19] Potion de grands soins   → Cormac cp[337], Krugg cp[316]
//   [20] Potion de grand soins    → aucun porteur
//   [21] Posion Grand Soin        → Grimdar cp[317]
//   [23] Potion de soins importants → Cormac cp[338] (référence survivante)
// Cormac : 3 lignes nées des essais de correction du 2026-10-04 → une seule gardée (cp[338], 3 gorgées).
await sql.transaction([
  sql`update character_potions set potion_id = 23 where id = 316`, // Krugg, charges 1
  sql`update character_potions set potion_id = 23 where id = 317`, // Grimdar, charges 3
  sql`delete from character_potions where id in (336, 337)`,       // doublons d'essais chez Cormac
  sql`delete from potions where id in (5, 19, 20, 21)`,
])

console.log('=== Après fusion ===')
const pots = await sql`select id, nom, sort_effet, charges_max from potions order by id` as any[]
for (const p of pots) console.log(`[${p.id}] ${p.nom} | ${p.sort_effet ?? '—'} | max ${p.charges_max}`)
const cp = await sql`select cp.id, cp.potion_id, cp.charges_restantes, c.nom as char_nom
  from character_potions cp join characters c on c.id = cp.personnage_id
  where cp.potion_id = 23 order by c.nom` as any[]
console.log('--- Porteurs de [23] ---')
for (const r of cp) console.log(`cp[${r.id}] → ${r.char_nom}, charges ${r.charges_restantes}`)
const orphelins = await sql`select cp.id, cp.potion_id from character_potions cp left join potions p on p.id = cp.potion_id where p.id is null` as any[]
console.log(`Orphelins : ${orphelins.length}`)

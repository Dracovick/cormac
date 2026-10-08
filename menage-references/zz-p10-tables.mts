import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const [a] = await sql`SELECT count(*)::int total, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM character_armor l WHERE l.armure_id = t.id))::int portees FROM armor t` as any[]
const [m] = await sql`SELECT count(*)::int total, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM character_magic_items l WHERE l.objet_id = t.id))::int portees FROM magic_items t` as any[]
const [p] = await sql`SELECT count(*)::int total, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM character_potions l WHERE l.potion_id = t.id))::int portees FROM potions t` as any[]
const [f] = await sql`SELECT count(*)::int total, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM character_feats l WHERE l.feat_id = t.id))::int portees FROM feats t` as any[]
console.log(`armor       total=${a.total}  portées=${a.portees}`)
console.log(`magic_items total=${m.total}  portées=${m.portees}`)
console.log(`potions     total=${p.total}  portées=${p.portees}`)
console.log(`feats       total=${f.total}  portées=${f.portees}`)
console.log('\n── les armures ──')
for (const x of await sql`SELECT id, nom, type, bonus_armure, prix,
  (SELECT count(*)::int FROM character_armor ca WHERE ca.armure_id = armor.id) p FROM armor ORDER BY nom` as any[])
  console.log(`  [${x.id}] ${String(x.nom).padEnd(36)} type=${x.type ?? '∅'} CA=${x.bonus_armure ?? '∅'} prix=${x.prix ?? '∅'} porteurs=${x.p}`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const perso = await sql`select c.id, c.nom, a.dex_base, a.dex_magique, cs.initiative_bonus
  from characters c
  left join character_ability_scores a on a.personnage_id = c.id
  left join character_combat_stats cs on cs.personnage_id = c.id
  where c.nom ilike '%cormac%'` as any[]
console.log(JSON.stringify(perso, null, 2))
for (const p of perso) {
  const dons = await sql`select f.nom from character_feats cf join feats f on f.id = cf.feat_id
    where cf.personnage_id = ${p.id}` as any[]
  console.log(`DONS de ${p.nom}:`, dons.map(d => d.nom).join(' | '))
  const objets = await sql`select nom from character_magic_items where personnage_id = ${p.id}` as any[]
  console.log(`OBJETS de ${p.nom}:`, objets.map(o => o.nom).join(' | '))
}

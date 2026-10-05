import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const porteurs = await sql`select count(*)::int as n from character_potions where potion_id = 24` as any[]
console.log(`Porteurs restants de [24] : ${porteurs[0].n}`)
if (porteurs[0].n === 0) {
  await sql`delete from potions where id = 24`
  console.log('[24] Potion de feu follet ZZ supprimée.')
}
const reste = await sql`select id, nom from potions order by id` as any[]
console.log(`Références finales (${reste.length}) : ${reste.map(p => `[${p.id}] ${p.nom}`).join(' · ')}`)
const perso = await sql`select count(*)::int as n from characters where id = 94` as any[]
console.log(`Perso 94 encore en base : ${perso[0].n}`)
const orphelins = await sql`select count(*)::int as n from character_potions cp left join potions p on p.id = cp.potion_id where p.id is null` as any[]
console.log(`Lignes potions orphelines : ${orphelins[0].n}`)

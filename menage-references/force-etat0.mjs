import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'
const raw = readFileSync('.env.local', 'utf-8')
for (const l of raw.split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}
const sql = neon(process.env.DATABASE_URL)
const cs = await sql`select personnage_id, domaine1, domaine2, pv_max, pv_actuels from character_combat_stats where personnage_id=82`
console.log('COMBAT_STATS 82:', JSON.stringify(cs))
const st = await sql`select * from character_saving_throws where personnage_id=82`
console.log('SAVES 82:', JSON.stringify(st))
const tous = await sql`select domaine1, count(*) n from character_combat_stats where domaine1 is not null and domaine1<>'' group by domaine1 order by domaine1`
console.log('\nTOUS domaine1:', JSON.stringify(tous))
const tous2 = await sql`select domaine2, count(*) n from character_combat_stats where domaine2 is not null and domaine2<>'' group by domaine2 order by domaine2`
console.log('TOUS domaine2:', JSON.stringify(tous2))
const nb = await sql`select count(*) n from spells`
console.log('\nNB SORTS:', JSON.stringify(nb))

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

console.log('=== JOURNAL — 25 dernières entrées (UTC) ===')
const journal = await sql.query(`
  select j.id, j.personnage_id, c.nom as perso, j.type, left(j.description, 90) as descr, j.created_at
  from character_journal j left join characters c on c.id = j.personnage_id
  order by j.id desc limit 25`)
for (const r of journal as any[]) console.log(`[${r.id}] ${r.created_at.toISOString()} #${r.personnage_id} ${r.perso} · ${r.type} · ${r.descr}`)

console.log('\n=== POTIONS — table de référence (20 dernières par id) ===')
const pots = await sql.query(`select id, nom, sort_effet, niveau, charges_max from potions order by id desc limit 20`)
for (const r of pots as any[]) console.log(`[${r.id}] «${r.nom}» effet=«${r.sort_effet}» niv=${r.niveau} charges_max=${r.charges_max}`)
const nb = await sql.query(`select count(*)::int as n from potions`)
console.log(`Total potions: ${(nb as any[])[0].n}`)

console.log('\n=== CHARACTER_POTIONS — 20 derniers liens ===')
const cp = await sql.query(`
  select cp.id, cp.personnage_id, c.nom as perso, p.nom as potion, cp.charges_restantes
  from character_potions cp
  join characters c on c.id = cp.personnage_id
  join potions p on p.id = cp.potion_id
  order by cp.id desc limit 20`)
for (const r of cp as any[]) console.log(`[${r.id}] #${r.personnage_id} ${r.perso} → «${r.potion}» (${r.charges_restantes} restantes)`)

console.log('\n=== Doublons de noms dans potions (normalisé grossier) ===')
const dup = await sql.query(`
  select lower(trim(nom)) as n, count(*)::int as c, array_agg(id) as ids
  from potions group by 1 having count(*) > 1`)
for (const r of dup as any[]) console.log(`«${r.n}» ×${r.c} ids=${r.ids}`)
if ((dup as any[]).length === 0) console.log('(aucun)')

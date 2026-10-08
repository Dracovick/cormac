import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
console.log('--- potions nommant poison ou soins')
console.log((await sql`SELECT id, nom, sort_effet, niveau, charges_max, left(coalesce(description,''),80) d,
  (SELECT count(*)::int FROM character_potions cp WHERE cp.potion_id = p.id) porteurs
  FROM potions p WHERE lower(nom) LIKE '%poison%' OR lower(nom) LIKE '%soin%' ORDER BY id`)
  .map(x=>`[${x.id}] ${x.nom} | effet: ${x.sort_effet ?? '—'} | niv ${x.niveau ?? '—'} | ch ${x.charges_max ?? '—'} | porteurs ${x.porteurs} | ${x.d || '(VIDE)'}`).join('\n'))

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
// Tout ce qui ressemble à un libellé imprimé en tête de valeur : mots avant un « : » proche du début
const r = await sql`SELECT substring(zone_effet from '^[^:]{0,60}:') libelle, count(*)::int n
  FROM spells WHERE zone_effet ~ '^[^:]{0,60}:' GROUP BY 1 ORDER BY n DESC`
console.table(r)
const t = await sql`SELECT count(*)::int n FROM spells WHERE zone_effet ~ '^[^:]{0,60}:'`
console.log('total de valeurs encore préfixées :', (t as any[])[0].n)

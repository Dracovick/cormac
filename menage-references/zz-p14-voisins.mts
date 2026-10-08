import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const m of ['protection','dexterit','dextérit','jade','chauve','fleche','flèche','potion','parchemin','carquois','amulette','arc long','dague','epee longue','épée']) {
  const r = await sql`SELECT id, nom, type, prix, left(coalesce(description,''),60) d FROM magic_items WHERE lower(nom) LIKE ${'%'+m+'%'} ORDER BY id`
  if (r.length) console.log(`--- ${m}\n` + r.map(x => `  [${x.id}] ${x.nom} · ${x.type ?? '—'} · ${x.prix ?? '—'} · ${x.d}`).join('\n'))
}

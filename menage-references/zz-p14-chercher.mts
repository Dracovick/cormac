import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const motifs = ['protection','stockage','contresort','chauve','metamorphose','métamorphose','jade','chance','lapin','patte','fleche','flèche','carquois','parchemin','ardoise','plume','potion','inertie','detection des','identification','resurrection','teleportation','vie','chat','dague','epee','arc ']
for (const m of motifs) {
  const r = await sql`SELECT id, nom, type FROM magic_items WHERE id > 278 AND lower(nom) LIKE ${'%' + m.toLowerCase() + '%'} ORDER BY nom`
  if (r.length) console.log(`--- ${m} (${r.length})\n` + r.map(x => `  [${x.id}] ${x.nom} · ${x.type}`).join('\n'))
}
console.log('=== types du catalogue ===')
console.log(await sql`SELECT type, count(*)::int n FROM magic_items WHERE id > 278 GROUP BY 1 ORDER BY 2 DESC`)

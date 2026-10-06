import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const motifs = ['%ination%', '%mprisonnement%', '%igby%', '%boue%', '%ineure%']
for (const m of motifs) {
  const r = await sql`select id, nom, ecole, portee, duree, coalesce(left(description, 80), '—') descr from spells where nom ilike ${m}` as any[]
  for (const s of r) {
    const niv = await sql`select c.nom classe, scl.niveau from spell_class_levels scl join classes c on c.id = scl.classe_id where scl.sort_id = ${s.id} order by c.nom` as any[]
    const usage = await sql`select count(*)::int n from character_spells where sort_id = ${s.id}` as any[]
    console.log(`[${s.id}] « ${s.nom} » (${JSON.stringify(s.nom)}) — ${s.ecole ?? '∅'} | ${s.portee ?? '∅'} | ${s.duree ?? '∅'} | ${niv.map((x: any) => `${x.classe} ${x.niveau}`).join(', ') || '∅'} | ${usage[0].n} perso(s)`)
    console.log(`     ${String(s.descr).replace(/\s+/g, ' ')}`)
  }
}

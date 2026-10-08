import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const id of [74, 80, 59, 49, 68, 72, 46]) {
  const [c] = await sql`SELECT c.id, c.nom, r.nom race FROM characters c LEFT JOIN races r ON r.id = c.race_id WHERE c.id = ${id}` as any[]
  const cl = await sql`SELECT cl.nom, cc.niveau FROM character_classes cc JOIN classes cl ON cl.id = cc.classe_id WHERE cc.personnage_id = ${id}` as any[]
  const dons = await sql`SELECT f.nom FROM character_feats cf JOIN feats f ON f.id = cf.feat_id WHERE cf.personnage_id = ${id} ORDER BY f.nom` as any[]
  console.log(`#${c.id} ${c.nom} — ${c.race ?? 'race ?'} — ${cl.map((x: any) => `${x.nom} ${x.niveau}`).join(' / ') || 'sans classe'}`)
  console.log(`   dons : ${dons.map((d: any) => d.nom).join(' · ') || 'aucun'}`)
  console.log('')
}

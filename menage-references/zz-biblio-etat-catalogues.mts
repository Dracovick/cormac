import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const tables = ['spells','potions','weapons','armor','equipment','magic_items','feats','gems','art_objects','skills','races','classes','gods']
for (const t of tables) {
  const [{ n }] = await sql.query(`select count(*)::int as n from ${t}`) as any[]
  let desc = ''
  try {
    const [{ d }] = await sql.query(`select count(*)::int as d from ${t} where description is not null and length(trim(description)) > 0`) as any[]
    desc = ` | avec description: ${d}`
  } catch { desc = ' | (pas de colonne description)' }
  console.log(`${t}: ${n}${desc}`)
}
const [{ n: scl }] = await sql`select count(*)::int as n from spell_class_levels` as any[]
console.log(`spell_class_levels: ${scl}`)
const compl = await sql`select count(*)::int as n from spells where portee is not null and duree is not null` as any[]
console.log(`sorts avec portee ET duree: ${compl[0].n}`)

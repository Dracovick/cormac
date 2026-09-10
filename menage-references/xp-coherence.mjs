import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const xpPourNiveau = n => 500 * Math.max(1,Math.floor(n)) * (Math.max(1,Math.floor(n)) - 1)
const rows = await sql.query(`select c.id, c.nom, c.xp, coalesce(sum(cc.niveau),0)::int as niv
  from characters c left join character_classes cc on cc.personnage_id=c.id group by c.id, c.nom, c.xp order by c.id`)
let sous=0
for (const r of rows) {
  const seuil = xpPourNiveau(Math.max(1,r.niv)), suiv = xpPourNiveau(Math.max(1,r.niv)+1)
  const xp = r.xp ?? 0
  const pct = ((xp - seuil) / (suiv - seuil) * 100)
  const flag = xp < seuil ? '  ⛔ SOUS LE SEUIL' : ''
  if (xp < seuil) sous++
  console.log(`${String(r.id).padStart(3)} ${r.nom.padEnd(28).slice(0,28)} niv ${String(r.niv).padStart(2)}  xp ${String(xp).padStart(7)}  seuil ${String(seuil).padStart(7)}  barre relative ${pct.toFixed(0).padStart(5)}%${flag}`)
}
console.log(`\n${sous} personnage(s) sur ${rows.length} ont MOINS d XP que le seuil de leur niveau.`)

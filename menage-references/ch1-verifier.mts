import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { modSauvegarde } from '../src/lib/dnd35/rules'
import { getRaceInfo } from '../src/lib/dnd35/races'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
type R = { id:number; nom:string; rnom:string; conb:number; conm:number; sagb:number; sagm:number
  dexb:number; dexm:number; vb:number; rb:number; ob:number; vm:number; rm:number; om:number }
const rows = await sql`
  select c.id, c.nom, r.nom rnom, a.con_base conb, a.con_magique conm, a.sag_base sagb, a.sag_magique sagm,
    a.dex_base dexb, a.dex_magique dexm, st.vigueur_base vb, st.reflexes_base rb, st.volonte_base ob,
    st.vigueur_magique vm, st.reflexes_magique rm, st.volonte_magique om
  from characters c join races r on r.id=c.race_id
  join character_ability_scores a on a.personnage_id=c.id
  join character_saving_throws st on st.personnage_id=c.id order by c.id` as R[]

console.log('=== ECRAN ET FICHE IMPRIMEE DONNENT-ILS LE MEME TOTAL ? ===')
let diff = 0, changes: string[] = []
for (const r of rows) {
  const ri = getRaceInfo(r.rnom)
  const bc = ri?.bonusCon ?? 0, bs = ri?.bonusSag ?? 0, bd = ri?.bonusDex ?? 0
  // nouvelle logique, identique des deux cotes
  const vig = r.vb + modSauvegarde(r.conb, r.conm, bc) + (r.vm ?? 0)
  const ref = r.rb + modSauvegarde(r.dexb, r.dexm, bd) + (r.rm ?? 0)
  const vol = r.ob + modSauvegarde(r.sagb, r.sagm, bs) + (r.om ?? 0)
  // ancienne logique de l ECRAN (sans racial pour Vig/Vol)
  const vigAv = r.vb + modSauvegarde(r.conb, r.conm, 0) + (r.vm ?? 0)
  const volAv = r.ob + modSauvegarde(r.sagb, r.sagm, 0) + (r.om ?? 0)
  if (vig !== vigAv || vol !== volAv) {
    diff++
    changes.push(`  ${r.nom.padEnd(28)} (${r.rnom.padEnd(11)}) Vigueur ${vigAv >= 0 ? '+' : ''}${vigAv} -> ${vig >= 0 ? '+' : ''}${vig}${vol !== volAv ? `  Volonte ${volAv} -> ${vol}` : ''}`)
  }
}
console.log(changes.join('\n'))
console.log(`\n  ${diff} personnages voient leur Vigueur corrigee a l ecran (Reflexes deja justes : ils passaient deja par dexMod)`)

console.log('\n=== GRIMDAR (personnage 86) ===')
const g = rows.find(r => r.id === 86)!
const ri = getRaceInfo(g.rnom)!
console.log(`  Vigueur ${g.vb + modSauvegarde(g.conb, g.conm, ri.bonusCon) + (g.vm ?? 0)}  (attendu +8)`)
console.log(`  Reflexes ${g.rb + modSauvegarde(g.dexb, g.dexm, ri.bonusDex) + (g.rm ?? 0)}  (attendu +3 : base 2 + DEX +1)`)
console.log(`  Volonte ${g.ob + modSauvegarde(g.sagb, g.sagm, ri.bonusSag) + (g.om ?? 0)}  (attendu +3)`)

console.log('\n=== ⚠️ ANOMALIES DE DONNEES PREEXISTANTES (non corrigees) ===')
for (const r of rows) {
  const ri2 = getRaceInfo(r.rnom)
  const con = r.conb + (r.conm ?? 0) + (ri2?.bonusCon ?? 0)
  if (con < 3) console.log(`  ⛔ ${r.nom} (${r.rnom}) : CON effective ${con} — score aberrant en base (con_base=${r.conb})`)
}

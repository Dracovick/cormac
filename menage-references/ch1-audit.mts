import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { getMultiClassSave } from '../src/lib/dnd35/rules'
import { getClasseInfo } from '../src/lib/dnd35/classes'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

type R = { id:number; nom:string; rnom:string; bcon:number; bsag:number; bdex:number
  conb:number; conm:number; sagb:number; sagm:number; dexb:number; dexm:number
  vb:number; rb:number; ob:number; vm:number; rm:number; om:number; pvmax:number }
const rows = await sql`
  select c.id, c.nom, r.nom rnom, r.bonus_con bcon, r.bonus_sag bsag, r.bonus_dex bdex,
    a.con_base conb, a.con_magique conm, a.sag_base sagb, a.sag_magique sagm, a.dex_base dexb, a.dex_magique dexm,
    st.vigueur_base vb, st.reflexes_base rb, st.volonte_base ob,
    st.vigueur_magique vm, st.reflexes_magique rm, st.volonte_magique om, cs.pv_max pvmax
  from characters c join races r on r.id=c.race_id
  join character_ability_scores a on a.personnage_id=c.id
  join character_saving_throws st on st.personnage_id=c.id
  left join character_combat_stats cs on cs.personnage_id=c.id
  where r.bonus_con <> 0 or r.bonus_sag <> 0 or r.bonus_dex <> 0
  order by r.nom, c.id` as R[]

const classesDe = await sql`select cc.personnage_id p, cl.nom, cc.niveau from character_classes cc join classes cl on cl.id=cc.classe_id` as {p:number;nom:string;niveau:number}[]
const mod = (v:number) => Math.floor((v-10)/2)

console.log('=== LES PERSONNAGES A BONUS RACIAL — les scores sont-ils saisis SANS le racial ? ===')
console.log('(indice : vigueur_base doit valoir la progression PURE de classe ; si elle contient deja')
console.log(' le modificateur de CON, la correction doublerait le bonus)\n')
let suspects = 0, verifies = 0
for (const r of rows) {
  const cls = classesDe.filter(c => c.p === r.id).map(c => ({ nom: c.nom, niveau: c.niveau }))
  let theo = { vigueur: 0, reflexes: 0, volonte: 0 }
  let connues2 = cls.length > 0
  const arg = cls.map(c => { const i = getClasseInfo(c.nom); if (!i) connues2 = false; return { bonsSauvegardes: i?.bonsSauvegardes ?? [], niveau: c.niveau } })
  theo = { vigueur: getMultiClassSave('vigueur', arg), reflexes: getMultiClassSave('reflexes', arg), volonte: getMultiClassSave('volonte', arg) }
  const connues = connues2
  const conEff = r.conb + (r.conm ?? 0) + r.bcon
  const ecart = r.vb - theo.vigueur
  const drapeau = !connues ? 'classe inconnue' : ecart === 0 ? 'base pure' : `ECART ${ecart > 0 ? '+' : ''}${ecart}`
  if (connues && ecart !== 0) suspects++; else if (connues) verifies++
  console.log(`  ${r.rnom.padEnd(9)} ${String(r.id).padStart(2)} ${r.nom.padEnd(26)} CON ${String(r.conb).padStart(2)}${r.bcon>0?'+':''}${r.bcon}=${String(conEff).padStart(2)} (mod ${mod(conEff)>=0?'+':''}${mod(conEff)})  vig_base ${String(r.vb).padStart(2)} vs theorique ${String(theo.vigueur).padStart(2)}  ${drapeau}   ${cls.map(c=>c.nom+' '+c.niveau).join('/')}`)
}
console.log(`\n  base pure : ${verifies} | ecarts : ${suspects} | total : ${rows.length}`)

console.log('\n=== SCORES DE CON SUSPECTS (trop bas si le racial etait deja inclus) ===')
for (const r of rows) {
  const conEff = r.conb + (r.conm ?? 0) + r.bcon
  if (conEff <= 7 || r.conb <= 7) console.log(`  ⚠️ ${r.nom} (${r.rnom}) conBase=${r.conb} -> effectif ${conEff}`)
}
console.log('  (aucune ligne = aucun score ne devient absurde avec le racial)')

console.log('\n=== IMPACT DE LA CORRECTION, personnage par personnage ===')
for (const r of rows) {
  const sansRacial = mod(r.conb + (r.conm ?? 0))
  const avecRacial = mod(r.conb + (r.conm ?? 0) + r.bcon)
  if (sansRacial !== avecRacial)
    console.log(`  ${r.nom.padEnd(26)} (${r.rnom}) Vigueur ${r.vb + sansRacial + (r.vm??0)} -> ${r.vb + avecRacial + (r.vm??0)}`)
}
const sagTouches = rows.filter(r => r.bsag !== 0).length
console.log(`\n  Volonte : ${sagTouches} personnage(s) avec un bonus racial de SAG`)
const dexTouches = rows.filter(r => r.bdex !== 0)
console.log(`  Reflexes : ${dexTouches.length} personnage(s) avec un bonus racial de DEX`)
for (const r of dexTouches) {
  const s = mod(r.dexb + (r.dexm??0)), a = mod(r.dexb + (r.dexm??0) + r.bdex)
  if (s !== a) console.log(`     ${r.nom.padEnd(26)} (${r.rnom}) Reflexes ${r.rb + s + (r.rm??0)} -> ${r.rb + a + (r.rm??0)}`)
}

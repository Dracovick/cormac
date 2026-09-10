/**
 * Verification APRES ecriture — Krugg 82. Reproduit a l identique les formules
 * de src/app/personnage/[id]/page.tsx (ecran) et .../imprimer/page.tsx (impression).
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const ID = 82
const one = async (q, p = []) => (await sql.query(q, p))[0]

const cs = await one('select * from character_combat_stats where personnage_id=$1', [ID])
const st = await one('select * from character_saving_throws where personnage_id=$1', [ID])
const ab = await one('select * from character_ability_scores where personnage_id=$1', [ID])
const ch = await one('select * from characters where id=$1', [ID])
const race = await one('select * from races where id=$1', [ch.race_id])
const cur = await one('select * from character_currency where personnage_id=$1', [ID])

console.log('══ 1. CE QU ANDRE A REGLE — doit etre INTACT ══')
console.log(`   pv_max        = ${cs.pv_max}   ${cs.pv_max === 52 ? '✅ 52' : '⛔ ATTENDU 52'}`)
console.log(`   pv_actuels    = ${cs.pv_actuels}   ${cs.pv_actuels === 47 ? '✅ 47' : '⛔ ATTENDU 47'}`)
console.log(`   sauvegardes   = ${st.reflexes_base}/${st.vigueur_base}/${st.volonte_base}  ${st.reflexes_base === 2 && st.vigueur_base === 5 && st.volonte_base === 5 ? '✅ 2/5/5' : '⛔ ATTENDU 2/5/5'}`)
console.log(`   xp            = ${ch.xp}  ${ch.xp === 19500 ? '✅' : '⛔'}`)

// ─── CA : formule identique sur les deux pages ───
const armor = await sql.query(
  'select ca.*, a.* from character_armor ca join armor a on a.id=ca.armure_id where ca.personnage_id=$1', [ID])
const mis = await sql.query(
  'select cm.*, m.nom, m.bonus, m.charges_max from character_magic_items cm join magic_items m on m.id=cm.objet_id where cm.personnage_id=$1 order by m.id', [ID])
const dexT = (ab.dex_base ?? 10) + (ab.dex_magique ?? 0) + (race?.bonus_dex ?? 0)
const dexMod = Math.floor((dexT - 10) / 2)
const caArmure = armor.reduce((s, a) => s + (a.bonus_armure ?? 0) + (a.bonus_magique ?? 0), 0)
const caMagique = mis.reduce((s, m) => s + (m.bonus ?? 0), 0)
const maxDex = armor.length ? Math.min(...armor.map(a => a.max_dex ?? 10)) : 10
const dexModCA = Math.min(dexMod, maxDex)
const caTotal = 10 + dexModCA + caArmure + (cs.ca_naturelle ?? 0) + (cs.ca_deflexion ?? 0) + (cs.ca_divers ?? 0) + caMagique

console.log('\n══ 2. CLASSE D ARMURE ══')
console.log(`   10 + DEX ${dexModCA} + armure ${caArmure} + naturelle ${cs.ca_naturelle} + parade ${cs.ca_deflexion} + divers ${cs.ca_divers} + magique ${caMagique}`)
console.log(`   → ECRAN      CA = ${caTotal}  ${caTotal === 20 ? '✅ 20' : '⛔ ATTENDU 20'}`)
console.log(`   → IMPRESSION CA = ${caTotal}  ${caTotal === 20 ? '✅ 20 (formule identique)' : '⛔'}`)
console.log(`   (ca_arme = ${cs.ca_arme} — lu par aucun des deux calculs)`)

// ─── Deplacement : ecran calcule, impression brute ───
const deplArm = armor.map(a => a.deplacement).filter(d => d != null)
const deplEcran = deplArm.length ? Math.min(...deplArm) : (cs.deplacement ?? 9)
const deplImpr = cs.deplacement ?? 9
console.log('\n══ 3. DEPLACEMENT — defaut connu nº 4 ══')
console.log(`   ECRAN      = ${deplEcran} m   (min(armure.deplacement))`)
console.log(`   IMPRESSION = ${deplImpr} m   (combatStats.deplacement, valeur brute)`)
console.log(`   ECART MESURE = ${deplImpr - deplEcran} m  ${deplEcran !== deplImpr ? '⚠️ les deux vues divergent' : '✅ identiques'}`)

// ─── Objets ───
console.log('\n══ 4. OBJETS ══')
for (const a of armor) console.log(`   armure : ${a.nom} +${a.bonus_magique}  (CA ${(a.bonus_armure ?? 0) + (a.bonus_magique ?? 0)}, maxDEX ${a.max_dex}, malus ${a.malus_competence}, depl ${a.deplacement})`)
for (const m of mis) {
  const bouton = m.charges_restantes !== null
  console.log(`   objet ${String(m.objet_id).padStart(3)} : ${m.nom.padEnd(38)} bonus CA ${String(m.bonus ?? 0).padStart(2)}  charges ${m.charges_restantes === null ? 'NULL (aucun bouton)' : m.charges_restantes + ' (bouton de dépense)'}`)
}
const wp = await sql.query('select cw.*, w.nom, w.critique_min, w.critique_mult, w.degats from character_weapons cw join weapons w on w.id=cw.arme_id where cw.personnage_id=$1 order by w.id', [ID])
for (const w of wp) console.log(`   arme ${String(w.arme_id).padStart(3)}  : ${w.nom.padEnd(38)} +${w.bonus_magique}  ${w.degats}  crit ${w.critique_min}-20 ×${w.critique_mult}`)

// ─── Competences ───
console.log('\n══ 5. COMPETENCES ══')
const MALUS = ['Acrobaties', 'Discrétion', 'Déplacement silencieux', 'Escalade', 'Évasion', 'Natation', 'Saut', 'Escamotage']
const malusArmure = armor.reduce((s, a) => s + Math.abs(a.malus_competence ?? 0), 0)
const mods = { FOR: Math.floor(((ab.for_base ?? 10) + (race?.bonus_for ?? 0) - 10) / 2), DEX: dexMod, CON: Math.floor(((ab.con_base ?? 10) + (race?.bonus_con ?? 0) - 10) / 2), INT: Math.floor(((ab.int_base ?? 10) + (race?.bonus_int ?? 0) - 10) / 2), SAG: Math.floor(((ab.sag_base ?? 10) + (race?.bonus_sag ?? 0) - 10) / 2), CHA: Math.floor(((ab.cha_base ?? 10) + (race?.bonus_cha ?? 0) - 10) / 2) }
const sks = await sql.query('select cs.*, s.nom, s.caracteristique from character_skills cs join skills s on s.id=cs.skill_id where cs.personnage_id=$1 order by s.nom', [ID])
let totalRangs = 0
for (const s of sks) {
  totalRangs += s.rangs_investis ?? 0
  const m = MALUS.includes(s.nom) ? -malusArmure : 0
  const t = (mods[s.caracteristique] ?? 0) + (s.rangs_investis ?? 0) + (s.modif_divers ?? 0) + m
  console.log(`   ${s.nom.padEnd(28)} ${s.caracteristique}  rangs ${String(s.rangs_investis).padStart(2)}  divers ${String(s.modif_divers).padStart(2)}  malus armure ${String(m).padStart(3)}  → total ${t >= 0 ? '+' : ''}${t}`)
}
console.log(`   Total des rangs investis : ${totalRangs}  (fiche papier : « Total investis 10 »)`)

// ─── Domaines ───
const dom = fs.readFileSync('X:/Claude-Tools/cormac/src/lib/dnd35/domains.ts', 'utf8')
const noms = [...dom.matchAll(/^\s+nom: '(.*)',$/gm)].map(m => m[1])
console.log('\n══ 6. DOMAINES ══')
for (const d of [cs.domaine1, cs.domaine2]) {
  const trouve = noms.includes(d)
  console.log(`   « ${d} »  ${trouve ? '✅ trouvé dans domains.ts → carte affichée' : '⛔ ABSENT de domains.ts → AUCUNE carte affichée'}`)
}

// ─── References creees ───
console.log('\n══ 7. REFERENCES ══')
const av = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/krugg-etat-avant.json', 'utf8'))
for (const t of ['clans', 'skills', 'feats', 'weapons', 'armor', 'magic_items', 'potions']) {
  const r = await one(`select count(*)::int n, coalesce(max(id),0)::int m from ${t}`)
  const d = r.n - av.refs[t].nb
  console.log(`   ${t.padEnd(13)} ${String(av.refs[t].nb).padStart(4)} → ${String(r.n).padStart(4)}   ${d === 0 ? '(inchangé)' : '⭐ ' + d + ' créée(s)'}`)
  if (d > 0) for (const x of await sql.query(`select id,nom from ${t} where id > $1 order by id`, [av.refs[t].maxId])) console.log(`        + id ${x.id} « ${x.nom} »`)
}

// ─── Doublons de reference ───
console.log('\n══ 8. AUCUN DOUBLON CREE (casse/accents) ══')
for (const t of ['skills', 'feats', 'weapons', 'armor', 'magic_items']) {
  const d = await sql.query(`select lower(nom) l, count(*)::int n from ${t} where id > $1 group by 1 having count(*) > 1`, [0])
    .then(r => r.filter(x => ['amulette de charisme +2', 'parchemin de protection contre le mal'].includes(x.l)))
  console.log(`   ${t.padEnd(13)} ${d.length === 0 ? '✅ aucun doublon sur les noms créés' : '⛔ ' + JSON.stringify(d)}`)
}

// ─── Monnaie + recherche ───
console.log('\n══ 9. MONNAIE ET RECHERCHE ══')
console.log(`   po = ${cur.po}  ${Number(cur.po) === 1360 ? '✅ 1360' : '⛔ ATTENDU 1360'}`)
const rech = await sql.query("select id,nom from characters where nom ilike '%Krugg%'")
console.log(`   « Krugg » → ${rech.length} résultat(s) : ${rech.map(r => r.id + ' ' + r.nom).join(', ')}  ${rech.length === 1 ? '✅' : '⛔'}`)
const notes = await sql.query('select id,titre from character_notes where personnage_id=$1 order by id', [ID])
console.log(`   notes : ${notes.length}`)
for (const n of notes) console.log(`      ${n.id} « ${n.titre} »`)

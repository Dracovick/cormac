import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// 1. Initiative : toutes les variantes + divers stocké
const init = await sql`select c.id, c.nom, f.nom as don, cs.initiative_bonus
  from characters c
  join character_feats cf on cf.personnage_id = c.id
  join feats f on f.id = cf.feat_id
  left join character_combat_stats cs on cs.personnage_id = c.id
  where f.nom ~* 'science de l.initiative|improved initiative|initiative am|sens de l.initiative'
  order by c.nom` as any[]
console.log('=== INITIATIVE ===')
for (const r of init) console.log(`  [${r.id}] ${r.nom} — « ${r.don} » — divers stocké: ${r.initiative_bonus}`)

// 2. Jets de sauvegarde : dons +2 et valeurs stockées
const saves = await sql`select c.id, c.nom, f.nom as don, st.vigueur_base, st.vigueur_magique, st.reflexes_base, st.reflexes_magique, st.volonte_base, st.volonte_magique
  from characters c
  join character_feats cf on cf.personnage_id = c.id
  join feats f on f.id = cf.feat_id
  left join character_saving_throws st on st.personnage_id = c.id
  where f.nom ~* 'volont[ée] de fer|iron will|vigueur surhumaine|great fortitude|grande r[ée]sistance|r[ée]flexes surhumains|lightning reflexes|ligthning reflexes|r[ée]flexes surnaturels'
  order by c.nom` as any[]
console.log('\n=== SAUVEGARDES ===')
for (const r of saves) console.log(`  [${r.id}] ${r.nom} — « ${r.don} » — Vig ${r.vigueur_base}/${r.vigueur_magique} Réf ${r.reflexes_base}/${r.reflexes_magique} Vol ${r.volonte_base}/${r.volonte_magique}`)

// 3. Robustesse / Toughness (+3 pv)
const pv = await sql`select c.id, c.nom, f.nom as don, cs.pv_max
  from characters c
  join character_feats cf on cf.personnage_id = c.id
  join feats f on f.id = cf.feat_id
  left join character_combat_stats cs on cs.personnage_id = c.id
  where f.nom ~* 'robustesse|toughness|dur [àa] cuire'
  order by c.nom` as any[]
console.log('\n=== ROBUSTESSE (+3 pv) ===')
for (const r of pv) console.log(`  [${r.id}] ${r.nom} — « ${r.don} » — pv_max: ${r.pv_max}`)

// 4. Esquive / Dodge, Mobilité (CA conditionnelle)
const ca = await sql`select c.id, c.nom, f.nom as don, cs.ca_divers
  from characters c
  join character_feats cf on cf.personnage_id = c.id
  join feats f on f.id = cf.feat_id
  left join character_combat_stats cs on cs.personnage_id = c.id
  where (f.nom ~* '^esquive' or f.nom ~* '^dodge|mobilit|mobility') and f.nom !~* 'instinctive|totale?|surnaturelle'
  order by c.nom` as any[]
console.log('\n=== CA CONDITIONNELLE (Esquive/Mobilité) ===')
for (const r of ca) console.log(`  [${r.id}] ${r.nom} — « ${r.don} » — ca_divers: ${r.ca_divers}`)

// 5. Vigilance / Alertness / Talent-Skill Focus + divers des compétences visées
const comp = await sql`select c.id, c.nom, f.nom as don
  from characters c
  join character_feats cf on cf.personnage_id = c.id
  join feats f on f.id = cf.feat_id
  where f.nom ~* '^vigil[ae]nce|^alertness|^talent|skill focus'
  order by c.nom` as any[]
console.log('\n=== COMPÉTENCES (Vigilance/Alertness/Talent) ===')
for (const r of comp) console.log(`  [${r.id}] ${r.nom} — « ${r.don} »`)

// Divers stocké sur Détection/Psychologie pour ces personnages
const ids = [...new Set(comp.map((r:any)=>r.id))]
if (ids.length) {
  const sk = await sql`select cs.personnage_id, s.nom, cs.rangs, cs.divers
    from character_skills cs join skills s on s.id = cs.skill_id
    where cs.personnage_id = any(${ids}) and s.nom ~* 'd[ée]tection|psychologie|perception auditive'
    order by cs.personnage_id, s.nom` as any[]
  console.log('  — divers stockés (Détection/Psychologie/Perception auditive) :')
  for (const r of sk) console.log(`    [${r.personnage_id}] ${r.nom}: rangs ${r.rangs}, divers ${r.divers}`)
}

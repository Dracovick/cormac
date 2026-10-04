// Audit des BBA stockés (2026-10-04) — après l'unification de la sémantique :
// la colonne bba_corps_a_corps doit porter le BAB de BASE (sans mod de carac).
// La base est calculée avec le CATALOGUE STATIQUE (getClasseInfo + getBab), comme
// le fait l'app — la colonne classes.bba_progression en DB diverge et ne fait pas foi.
// Repère : stocké == base  → sain (char-convert le traitera comme auto)
//          stocké == 0     → auto, sain
//          stocké == base + mod FOR/DEX → candidat DOUBLE COMPTAGE (ancien saveCharacter)
//          autre            → override MJ possible, à examiner à la main
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { getClasseInfo } from '../src/lib/dnd35/classes'
import { getBab } from '../src/lib/dnd35/rules'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const mod = (s: number) => Math.floor((s - 10) / 2)

const rows = await sql.query(`
  select c.id, c.nom,
    cs.bba_corps_a_corps as bba_cc, cs.bba_projectiles as bba_pr,
    a.for_base, a.for_magique, a.dex_base, a.dex_magique,
    r.bonus_for, r.bonus_dex,
    coalesce(json_agg(json_build_object('nom', cl.nom, 'niv', cc.niveau))
      filter (where cc.id is not null), '[]') as classes
  from characters c
  left join character_combat_stats cs on cs.personnage_id = c.id
  left join character_ability_scores a on a.personnage_id = c.id
  left join races r on r.id = c.race_id
  left join character_classes cc on cc.personnage_id = c.id
  left join classes cl on cl.id = cc.classe_id
  group by c.id, c.nom, cs.bba_corps_a_corps, cs.bba_projectiles,
    a.for_base, a.for_magique, a.dex_base, a.dex_magique, r.bonus_for, r.bonus_dex
  order by c.id`)

let sains = 0, autos = 0, doubles = 0, overrides = 0, inconnues = 0
for (const r of rows as any[]) {
  const classes = typeof r.classes === 'string' ? JSON.parse(r.classes) : r.classes
  let classeInconnue = false
  const base = classes.reduce((s: number, c: any) => {
    const info = getClasseInfo(c.nom ?? '')
    if (!info) classeInconnue = true
    return s + (info ? getBab(info.bab, c.niv ?? 0) : 0)
  }, 0)
  const forMod = mod((r.for_base ?? 10) + (r.for_magique ?? 0) + (r.bonus_for ?? 0))
  const dexMod = mod((r.dex_base ?? 10) + (r.dex_magique ?? 0) + (r.bonus_dex ?? 0))
  const cc = r.bba_cc ?? 0
  const pr = r.bba_pr ?? 0
  const detail = `cc=${cc} pr=${pr} base=${base}${classeInconnue ? ' (classe hors catalogue!)' : ''} FOR${forMod >= 0 ? '+' : ''}${forMod} DEX${dexMod >= 0 ? '+' : ''}${dexMod} [${classes.map((c: any) => `${c.nom} ${c.niv}`).join(' / ')}]`
  if (classeInconnue) { console.log(`[${r.id}] ${r.nom} → ❓ ${detail}`); inconnues++; continue }
  if (cc === 0 && pr === 0) { autos++ }
  else if (cc === base && pr === base) { sains++ }
  else if ((forMod !== 0 && cc === base + forMod) || (dexMod !== 0 && pr === base + dexMod)) {
    console.log(`[${r.id}] ${r.nom} → ⚠️ DOUBLE? ${detail}`); doubles++
  } else { console.log(`[${r.id}] ${r.nom} → OVERRIDE? ${detail}`); overrides++ }
}
console.log(`\nTotal ${(rows as any[]).length} — auto(0): ${autos}, sains(=base): ${sains}, doubles possibles: ${doubles}, overrides à examiner: ${overrides}, classes hors catalogue: ${inconnues}`)

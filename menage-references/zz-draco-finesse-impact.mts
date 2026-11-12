/**
 * Impact prévu d'Attaque en finesse, ligne d'arme par ligne d'arme.
 *
 * On ne mesure PAS seulement les 7 fiches connues pour porter le don : on
 * balaie les 71, sinon le relevé ne vaut que pour ce qu'il cherchait déjà
 * (un contrôle calqué sur sa propre hypothèse annonce toujours 0).
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { aAttaqueEnFinesse, armeEligibleFinesse } from '../src/lib/dnd35/attaque'
import { estArmeADistance } from '../src/lib/dnd35/weapons'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const fiches: any[] = await sql`
  select c.id, c.nom, c.joueur_prenom,
         coalesce(a.for_base, 10) + coalesce(a.for_magique, 0) + coalesce(r.bonus_for, 0) frc,
         coalesce(a.dex_base, 10) + coalesce(a.dex_magique, 0) + coalesce(r.bonus_dex, 0) dex
  from characters c
  left join character_ability_scores a on a.personnage_id = c.id
  left join races r on r.id = c.race_id
  order by c.id`

const mod = (v: number) => Math.floor((v - 10) / 2)
let touchees = 0
let lignes = 0

for (const f of fiches) {
  const dons: any[] = await sql`
    select ft.nom from character_feats cf join feats ft on ft.id = cf.feat_id
    where cf.personnage_id = ${f.id}`
  const noms = dons.map(d => d.nom as string)
  if (!aAttaqueEnFinesse(noms)) continue

  const armes: any[] = await sql`
    select w.nom, w.famille, w.portee, wc.nom nom_cat, wc.famille famille_cat
    from character_weapons cw
    join weapons w on w.id = cw.arme_id
    left join weapons wc on wc.id = w.catalogue_id
    where cw.personnage_id = ${f.id}
    order by w.nom`

  const forMod = mod(Number(f.frc))
  const dexMod = mod(Number(f.dex))
  console.log(`\n[${f.id}] ${f.nom} (${f.joueur_prenom}) — FOR ${f.frc} (${forMod >= 0 ? '+' : ''}${forMod}) · DEX ${f.dex} (${dexMod >= 0 ? '+' : ''}${dexMod})`)
  console.log(`      don lu : ${noms.filter(n => aAttaqueEnFinesse([n])).join(' / ')}`)
  let uneTouchee = false
  for (const a of armes) {
    const distance = estArmeADistance(a.famille, a.portee)
    const eligible = armeEligibleFinesse(a.nom, a.nom_cat, a.famille ?? a.famille_cat)
    const change = !distance && eligible && dexMod > forMod
    if (change) { lignes++; uneTouchee = true }
    const fam = a.famille ?? (a.famille_cat ? `${a.famille_cat} (via catalogue « ${a.nom_cat} »)` : 'inconnue')
    console.log(`      ${change ? '➤ CHANGE' : '  inchangée'} « ${a.nom} » | ${distance ? 'à distance' : 'corps à corps'} | ${eligible ? 'éligible' : 'non éligible'} | ${fam}`
      + (change ? ` | attaque ${dexMod - forMod > 0 ? '+' : ''}${dexMod - forMod}` : ''))
  }
  if (uneTouchee) touchees++
}

console.log(`\n=== fiches balayées : ${fiches.length} · fiches touchées : ${touchees} · lignes d'armes touchées : ${lignes}`)

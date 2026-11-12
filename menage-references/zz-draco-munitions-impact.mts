/**
 * Ce que le retrait du faux bonus change, ligne par ligne.
 *
 * On balaie les 198 lignes d'armes, pas les 2 connues : un relevé calqué sur
 * son hypothèse annonce toujours ce qu'il cherchait. L'« avant » rejoue l'état
 * d'hier (le bonus et la quantité confondus dans `bonus_munitions`).
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { calculeArme } from '../src/lib/dnd35/attaque'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const sql = neon(env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, ''))

const lignes: any[] = await sql`
  select c.id pid, c.nom perso,
         coalesce(a.for_base,10)+coalesce(a.for_magique,0)+coalesce(r.bonus_for,0) frc,
         coalesce(a.dex_base,10)+coalesce(a.dex_magique,0)+coalesce(r.bonus_dex,0) dex,
         coalesce(cs.bba_corps_a_corps,0) bba_corps, coalesce(cs.bba_projectiles,0) bba_proj,
         w.nom arme, w.famille, w.portee, w.degats,
         cw.bonus_magique, cw.bonus_munitions, cw.quantite_munitions, cw.cote_de_force,
         cat.nom nom_cat, cat.famille famille_cat
  from character_weapons cw
  join characters c on c.id = cw.personnage_id
  join weapons w on w.id = cw.arme_id
  left join weapons cat on cat.id = w.catalogue_id
  left join character_ability_scores a on a.personnage_id = c.id
  left join races r on r.id = c.race_id
  left join character_combat_stats cs on cs.personnage_id = c.id
  order by c.id`

const mod = (v: number) => Math.floor((v - 10) / 2)
const dons: string[] = []   // les dons ne changent pas : on isole l'effet du bonus

function calc(l: any, bonusMunitions: number | null) {
  return calculeArme({
    nom: l.arme, famille: l.famille, nomCatalogue: l.nom_cat, familleCatalogue: l.famille_cat,
    portee: l.portee, degats: l.degats,
    bonusArme: l.bonus_magique ?? 0, bonusMunitions,
    coteDeForce: l.cote_de_force, dons,
    bbaBrutCorps: l.bba_corps, bbaBrutDistance: l.bba_proj || l.bba_corps,
    forMod: mod(l.frc), dexMod: mod(l.dex),
  })
}

let bouge = 0
for (const l of lignes) {
  // AVANT : la quantité était dans la case du bonus. APRÈS : elle en est sortie.
  const avant = calc(l, l.quantite_munitions ?? l.bonus_munitions)
  const apres = calc(l, l.bonus_munitions)
  if (avant.sequence !== apres.sequence || avant.degatsTexte !== apres.degatsTexte) {
    bouge++
    console.log(`[${l.pid}] ${l.perso} — ${l.arme}`)
    console.log(`     avant : ${avant.sequence}   ${avant.degatsTexte}`)
    console.log(`     après : ${apres.sequence}   ${apres.degatsTexte}`)
  }
}
console.log(`\n${lignes.length} lignes d'armes balayées, ${bouge} ligne(s) changent de chiffre.`)

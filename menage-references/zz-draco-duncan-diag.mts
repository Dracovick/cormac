/**
 * Diagnostic : la fiche 97 (Duncan Darkvale, Bretteur 3) et ses lignes d'armes.
 * Que dit le moteur, arme par arme, et pourquoi ?
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { aAttaqueEnFinesse, armeEligibleFinesse, calculeArme } from '../src/lib/dnd35/attaque'
import { estArmeADistance } from '../src/lib/dnd35/weapons'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const f: any[] = await sql`
  select c.id, c.nom, c.joueur_prenom,
         coalesce(a.for_base,10)+coalesce(a.for_magique,0)+coalesce(r.bonus_for,0) frc,
         coalesce(a.dex_base,10)+coalesce(a.dex_magique,0)+coalesce(r.bonus_dex,0) dex,
         coalesce(a.int_base,10)+coalesce(a.int_magique,0)+coalesce(r.bonus_int,0) intl
  from characters c
  left join character_ability_scores a on a.personnage_id = c.id
  left join races r on r.id = c.race_id
  where c.id = 97`
console.log('FICHE', JSON.stringify(f[0], null, 1))

const cls: any[] = await sql`
  select cc.*, cl.nom nom_classe from character_classes cc
  left join classes cl on cl.id = cc.classe_id where cc.personnage_id = 97`
console.log('CLASSES', JSON.stringify(cls, null, 1))

const dons: any[] = await sql`
  select ft.id, ft.nom from character_feats cf join feats ft on ft.id = cf.feat_id
  where cf.personnage_id = 97`
console.log('DONS', dons.map(d => `[${d.id}] ${d.nom}`))
console.log('aAttaqueEnFinesse =', aAttaqueEnFinesse(dons.map(d => d.nom)))

const armes: any[] = await sql`
  select cw.*, w.nom, w.famille, w.portee, w.degats, w.catalogue_id,
         wc.nom nom_cat, wc.famille famille_cat
  from character_weapons cw
  join weapons w on w.id = cw.arme_id
  left join weapons wc on wc.id = w.catalogue_id
  where cw.personnage_id = 97`
for (const a of armes) {
  console.log('---', a.nom, '| famille:', JSON.stringify(a.famille), '| cat:', JSON.stringify(a.nom_cat), JSON.stringify(a.famille_cat))
  console.log('    eligible finesse =', armeEligibleFinesse(a.nom, a.nom_cat, a.famille ?? a.famille_cat),
              '| a distance =', estArmeADistance(a.famille, a.portee))
}

// Ce que le moteur rend pour chaque ligne d'arme de Duncan
const mod = (v: number) => Math.floor((v - 10) / 2)
const F = f[0]
for (const a of armes) {
  const c = calculeArme({
    nom: a.nom, famille: a.famille, nomCatalogue: a.nom_cat, familleCatalogue: a.famille_cat,
    portee: a.portee, degats: a.degats,
    bonusArme: a.bonus_magique ?? 0, bonusMunitions: a.bonus_munitions ?? 0,
    coteDeForce: a.cote_de_force ?? null,
    dons: dons.map(d => d.nom),
    bbaBrutCorps: 4, bbaBrutDistance: 4,
    forMod: mod(F.frc), dexMod: mod(F.dex),
    niveauBretteur: 2, intMod: mod(F.intl), armureBloquanteBretteur: null,
  })
  console.log('>>>', a.nom, '→', c.sequence, '·', c.degatsTexte,
    '| finesse appliquée:', c.finesseAppliquee, '| éligible:', c.armeEligibleAFinesse)
}

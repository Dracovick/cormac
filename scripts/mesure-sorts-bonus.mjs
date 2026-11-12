/**
 * MESURE — les emplacements de sorts bonus de caractéristique élevée.
 *
 *   node scripts/mesure-sorts-bonus.mjs
 *
 * Questions :
 *   1. Bram Verrelune : classe, niveau, SAG base + magique ?
 *   2. Combien de fiches ont une caractéristique de lanceur >= 12 (donc un
 *      emplacement bonus dû) et combien au-dela de 18 ?
 *   3. Combien de fiches ont un bonus MAGIQUE sur leur caracteristique de lanceur ?
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()
  .replace(/\r/g, '')
  .replace(/^["']|["']$/g, '')

const sql = neon(url)

const bram = await sql`
  SELECT c.id, c.nom, r.nom AS race, c.joueur_prenom,
         a.sag_base, a.sag_magique, a.int_base, a.int_magique, a.cha_base, a.cha_magique
  FROM characters c
  LEFT JOIN races r ON r.id = c.race_id
  LEFT JOIN character_ability_scores a ON a.personnage_id = c.id
  WHERE c.nom ILIKE '%Bram%'
`
console.log('=== Bram ===')
console.log(JSON.stringify(bram, null, 1))

const cl = await sql`
  SELECT cc.personnage_id, c.nom, cl.nom AS classe, cc.niveau
  FROM character_classes cc
  JOIN characters c ON c.id = cc.personnage_id
  JOIN classes cl ON cl.id = cc.classe_id
  WHERE c.nom ILIKE '%Bram%'
`
console.log('=== classes de Bram ===')
console.log(JSON.stringify(cl, null, 1))

// Toutes les fiches de lanceurs, avec leur caracteristique de lanceur
const lanceurs = await sql`
  SELECT c.id, c.nom, c.joueur_prenom, cl.nom AS classe, cc.niveau,
         a.int_base, a.int_magique, a.sag_base, a.sag_magique, a.cha_base, a.cha_magique
  FROM characters c
  JOIN character_classes cc ON cc.personnage_id = c.id
  JOIN classes cl ON cl.id = cc.classe_id
  LEFT JOIN character_ability_scores a ON a.personnage_id = c.id
  WHERE cl.nom IN ('Magicien','Prêtre','Druide','Ensorceleur','Barde','Paladin','Rôdeur')
  ORDER BY c.id
`

const CARAC = {
  Magicien: 'int', Prêtre: 'sag', Druide: 'sag', Ensorceleur: 'cha',
  Barde: 'cha', Paladin: 'sag', 'Rôdeur': 'sag',
}

console.log('\n=== Lanceurs : score total de la carac de sorts ===')
let avecBonusDu = 0, avecMagique = 0, auDela18 = 0
for (const l of lanceurs) {
  const k = CARAC[l.classe]
  const base = l[`${k}_base`] ?? 10
  const mag = l[`${k}_magique`] ?? 0
  const total = base + mag
  const mod = Math.floor((total - 10) / 2)
  if (mod >= 1) avecBonusDu++
  if (mag > 0) avecMagique++
  if (total > 18) auDela18++
  console.log(
    `[${String(l.id).padStart(3)}] ${String(l.nom).padEnd(22)} ${String(l.classe).padEnd(12)} ` +
    `niv ${String(l.niveau).padStart(2)}  ${k.toUpperCase()} ${String(base).padStart(2)}` +
    `${mag ? `+${mag}` : '  '} = ${String(total).padStart(2)}  mod ${mod >= 0 ? '+' : ''}${mod}` +
    `${total > 18 ? '   <<< au-dela de 18' : ''}` +
    `${l.joueur_prenom ? `   (${l.joueur_prenom})` : ''}`
  )
}
console.log(`\nLignes de classe lanceuse : ${lanceurs.length}`)
console.log(`  dont mod >= +1 (un emplacement bonus du) : ${avecBonusDu}`)
console.log(`  dont un bonus MAGIQUE sur la carac       : ${avecMagique}`)
console.log(`  dont score total > 18                   : ${auDela18}`)

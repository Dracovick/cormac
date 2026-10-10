/**
 * DIAGNOSTIC du bonus d'altération des armes à distance et de la divergence
 * écran / papier sur le bloc Armes.
 *
 * Deux questions, deux mesures :
 *
 * 1. NON-CUMUL (SRD VF, « Armes à distance et projectiles ») : « Le bonus
 *    d'altération d'une arme à projectiles ne se cumule pas avec le bonus
 *    d'altération de ses munitions. On ne tient compte que de la plus haute
 *    des deux valeurs. » Le Grimoire les ADDITIONNE. Qui est touché ?
 *
 * 2. ÉCRAN ≠ PAPIER : la fiche imprimée ne compte ni les munitions, ni les
 *    bonus de dons, et sa colonne Dégâts ne porte aucun modificateur. Sur
 *    combien de fiches le papier diverge-t-il de l'écran, et de combien ?
 *
 * Aucune écriture. Usage :
 *   ./node_modules/.bin/tsx menage-references/p18-diag-munitions.mts
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { estArmeADistance } from '../src/lib/dnd35/weapons'
import { getFeatWeaponBonuses } from '../src/lib/dnd35/feat-bonuses'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (k?.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim()
}
const sql = neon(process.env.DATABASE_URL!)

type Ligne = {
  pid: number; perso: string; joueur: string | null
  arme: string; famille: string | null; portee: number | null
  bonus_magique: number; bonus_munitions: number | null; cote_de_force: number | null
}

const lignes = (await sql`
  SELECT ch.id AS pid, ch.nom AS perso, ch.joueur_prenom AS joueur,
         w.nom AS arme, w.famille, w.portee,
         COALESCE(cw.bonus_magique, 0) AS bonus_magique,
         cw.bonus_munitions, cw.cote_de_force
  FROM character_weapons cw
  JOIN characters ch ON ch.id = cw.personnage_id
  JOIN weapons w ON w.id = cw.arme_id
  ORDER BY ch.id, cw.id
`) as Ligne[]

// Dons de chaque personnage, pour les bonus d'arme du papier
const donsRows = (await sql`
  SELECT cf.personnage_id AS pid, f.nom
  FROM character_feats cf JOIN feats f ON f.id = cf.feat_id
`) as { pid: number; nom: string }[]
const donsPar = new Map<number, string[]>()
for (const d of donsRows) {
  if (!donsPar.has(d.pid)) donsPar.set(d.pid, [])
  donsPar.get(d.pid)!.push(d.nom)
}

console.log(`${lignes.length} lignes d'arme sur ${new Set(lignes.map(l => l.pid)).size} personnages\n`)

console.log('══ 1. NON-CUMUL : arme magique ET munitions magiques sur la même ligne ══')
let touchesNonCumul = 0
for (const l of lignes) {
  const mun = l.bonus_munitions ?? 0
  if (mun === 0) continue
  const isRanged = estArmeADistance(l.famille, l.portee)
  const somme = l.bonus_magique + mun
  const max = Math.max(l.bonus_magique, mun)
  const ecart = isRanged ? somme - max : 0
  if (ecart !== 0) touchesNonCumul++
  console.log(
    `  #${l.pid} ${l.perso} [${l.joueur ?? '—'}] · ${l.arme}` +
    ` · arme +${l.bonus_magique}, munitions +${mun}` +
    (!isRanged ? '  (corps à corps : munitions ignorées)' : ` → Grimoire +${somme}, règle +${max}` + (ecart ? `  ⚠ ÉCART ${ecart}` : '  = identique')),
  )
}
console.log(`  → ${touchesNonCumul} ligne(s) dont le total d'altération change.\n`)

console.log('══ 2. ÉCRAN ≠ PAPIER : ce que la feuille imprimée oublie ══')
const divergences: string[] = []
for (const l of lignes) {
  const isRanged = estArmeADistance(l.famille, l.portee)
  const mun = isRanged ? (l.bonus_munitions ?? 0) : 0
  const { attackItems, damageItems } = getFeatWeaponBonuses(donsPar.get(l.pid) ?? [], l.arme, isRanged)
  const atkDons = attackItems.reduce((s, b) => s + b.value, 0)
  const dmgDons = damageItems.reduce((s, b) => s + b.value, 0)
  // Le papier n'ajoute à l'attaque que BAB + carac + bonus de l'arme.
  const atkManquant = mun + atkDons
  // Le papier affiche le dé nu : tout modificateur de dégâts manque.
  const dmgManquant = l.bonus_magique + mun + dmgDons + (l.cote_de_force !== null ? 1 : 0) // côte = au moins 1 si saisie
  if (atkManquant !== 0 || dmgDons !== 0 || l.bonus_magique !== 0 || mun !== 0 || l.cote_de_force !== null) {
    divergences.push(
      `  #${l.pid} ${l.perso} · ${l.arme} · att. papier manque ${atkManquant}` +
      ` (munitions ${mun}, dons ${atkDons}) · dégâts papier = dé nu, manque` +
      ` arme ${l.bonus_magique}, munitions ${mun}, dons ${dmgDons}` +
      (l.cote_de_force !== null ? `, côte de Force ${l.cote_de_force}` : '') +
      (dmgManquant ? '' : ''),
    )
  }
}
console.log(divergences.join('\n'))
console.log(`  → ${divergences.length} ligne(s) d'arme sur ${lignes.length} divergent entre l'écran et le papier.`)
console.log(`  → ${new Set(divergences.map(d => d.match(/#(\d+)/)![1])).size} personnage(s) concerné(s).`)

console.log('\n══ 3. TÉMOINS possibles : lignes sans aucun bonus ni don d\'arme ══')
const temoins = lignes.filter(l => {
  const isRanged = estArmeADistance(l.famille, l.portee)
  const { attackItems, damageItems } = getFeatWeaponBonuses(donsPar.get(l.pid) ?? [], l.arme, isRanged)
  return l.bonus_magique === 0 && !l.bonus_munitions && l.cote_de_force === null
    && attackItems.length === 0 && damageItems.length === 0
}).slice(0, 12)
for (const t of temoins) console.log(`  #${t.pid} ${t.perso} · ${t.arme}`)

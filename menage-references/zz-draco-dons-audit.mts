/**
 * Audit : quels dons portés par les fiches sont effectivement LUS par le moteur ?
 *
 * On balaie les 74 fiches, pas une liste choisie d'avance. Le compteur de
 * fiches et de lignes balayées est publié avec le résultat : sans lui, un
 * total de 0 ne distingue pas « rien à signaler » de « rien lu ».
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { getFeatPassiveBonuses, getFeatWeaponBonuses } from '../src/lib/dnd35/feat-bonuses'
import { aAttaqueEnFinesse } from '../src/lib/dnd35/attaque'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const lignes: any[] = await sql`
  select c.id, c.nom, c.joueur_prenom, f.nom don
  from characters c
  join character_feats cf on cf.personnage_id = c.id
  join feats f on f.id = cf.feat_id
  order by c.id, f.nom
`

function cibleDon(nom: string): string | null {
  const m = nom.match(/\(([^)]+)\)\s*$/i)
  return m ? m[1].toLowerCase().replace(/\s*[+\-]\d+/g, '').replace(/\s+/g, ' ').trim() : null
}

/** Le moteur lit-il ce don ? Mêmes fonctions que la fiche, pas une copie des regex. */
function lu(nom: string): string[] {
  const out: string[] = []
  const p = getFeatPassiveBonuses([nom])
  for (const [cle, items] of Object.entries(p)) {
    if (cle === 'competences') {
      for (const c of p.competences) out.push(`competences(${c.skillNoms.join('/')}) +${c.item.value}`)
    } else if (Array.isArray(items) && items.length > 0) {
      for (const b of items as any[]) out.push(`${cle} +${b.value}`)
    }
  }
  const cible = cibleDon(nom)
  const w = getFeatWeaponBonuses([nom], cible ?? '\u0000aucune', true)
  for (const b of w.attackItems) out.push(`attaque ${b.label} +${b.value}`)
  for (const b of w.damageItems) out.push(`degats ${b.label} +${b.value}`)
  if (aAttaqueEnFinesse([nom])) out.push('attaque DEX (finesse)')
  return out
}

const parDon = new Map<string, { n: number; effets: string[] }>()
for (const l of lignes) {
  const e = parDon.get(l.don) ?? { n: 0, effets: lu(l.don) }
  e.n++
  parDon.set(l.don, e)
}

const comptes = [...parDon.entries()].filter(([, v]) => v.effets.length > 0)
const muets = [...parDon.entries()].filter(([, v]) => v.effets.length === 0)

const fiches = new Set(lignes.map(l => l.id))
console.log(`Balayage : ${fiches.size} fiches, ${lignes.length} lignes de dons, ${parDon.size} noms distincts`)
console.log(`\n=== ${comptes.length} noms LUS par le moteur (${comptes.reduce((s, [, v]) => s + v.n, 0)} lignes) ===`)
for (const [nom, v] of comptes.sort((a, b) => b[1].n - a[1].n)) {
  console.log(`  ${String(v.n).padStart(3)}×  ${nom}  →  ${v.effets.join(', ')}`)
}
console.log(`\n=== ${muets.length} noms MUETS (${muets.reduce((s, [, v]) => s + v.n, 0)} lignes) — les 20 plus portés ===`)
for (const [nom, v] of muets.sort((a, b) => b[1].n - a[1].n).slice(0, 20)) {
  console.log(`  ${String(v.n).padStart(3)}×  ${nom}`)
}

// ── Les munitions : un bonus magique d'arme ne dépasse pas +5 au Manuel.
const mun: any[] = await sql`
  select c.id, c.nom perso, w.nom arme, cw.bonus_munitions, cw.bonus_magique, cw.quantite
  from character_weapons cw
  join characters c on c.id = cw.personnage_id
  join weapons w on w.id = cw.arme_id
  where cw.bonus_munitions is not null and cw.bonus_munitions <> 0
  order by cw.bonus_munitions desc
`
console.log(`\n=== bonus_munitions non nul : ${mun.length} lignes sur l'ensemble des armes ===`)
for (const m of mun) console.log(`  [${m.id}] ${m.perso} — ${m.arme} : munitions +${m.bonus_munitions}, arme +${m.bonus_magique}, qté ${m.quantite}`)
const total: any[] = await sql`select count(*)::int n from character_weapons`
console.log(`  (sur ${total[0].n} lignes d'armes au total)`)

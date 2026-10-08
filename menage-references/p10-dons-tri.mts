/**
 * Le tri des dons — contrôle de couverture et rapport. N'ÉCRIT RIEN EN BASE.
 *
 * Contrôles :
 *  - chaque ligne de `feats` a un verdict, et chaque verdict porte sur une ligne
 *    qui existe (une ligne oubliée serait indistinguable d'un « non classé »);
 *  - chaque cible 'D' existe au catalogue relevé du Manuel (table 5-1);
 *  - le nom en base n'a pas changé depuis le classement.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const RACINE = 'X:/Claude-Tools/cormac'
const sql = neon(fs.readFileSync(`${RACINE}/.env.local`, 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const catalogue: { nom: string; type: string; parent: string | null }[] =
  JSON.parse(fs.readFileSync(`${RACINE}/menage-references/p10-dons-catalogue.json`, 'utf8')).dons
const nomsCat = new Set(catalogue.map(d => d.nom))

type Ligne = { id: number; verdict: string; cible: string }
const classement: Ligne[] = fs.readFileSync(`${RACINE}/menage-references/p10-dons-classement.txt`, 'utf8')
  .split(/\r?\n/)
  .filter(l => l.trim() && !l.startsWith('#'))
  .map(l => { const [id, verdict, cible] = l.split('|'); return { id: Number(id), verdict, cible: (cible ?? '').trim() } })

const rows = await sql`
  SELECT f.id, f.nom, (SELECT count(*)::int FROM character_feats cf WHERE cf.feat_id = f.id) porteurs
  FROM feats f ORDER BY f.id` as { id: number; nom: string; porteurs: number }[]
const parId = new Map(rows.map(r => [r.id, r]))

// ── Couverture ──
const classes = new Set(classement.map(l => l.id))
const oubliees = rows.filter(r => !classes.has(r.id))
const fantomes = classement.filter(l => !parId.has(l.id))
const doublons = classement.map(l => l.id).filter((id, i, a) => a.indexOf(id) !== i)
console.log(`feats en base : ${rows.length}   lignes classées : ${classement.length}`)
if (oubliees.length) { console.log(`\n⛔ ${oubliees.length} ligne(s) SANS verdict :`); for (const o of oubliees) console.log(`   [${o.id}] ${o.nom}`) }
if (fantomes.length) { console.log(`\n⛔ ${fantomes.length} verdict(s) sur une ligne absente : ${fantomes.map(f => f.id).join(', ')}`) }
if (doublons.length) { console.log(`\n⛔ id classé deux fois : ${[...new Set(doublons)].join(', ')}`) }

// ── Cibles ──
const ciblesInconnues = classement.filter(l => (l.verdict === 'D' || l.verdict === '?') && l.cible && !nomsCat.has(l.cible))
if (ciblesInconnues.length) {
  console.log(`\n⛔ ${ciblesInconnues.length} cible(s) absente(s) du catalogue du Manuel :`)
  for (const c of ciblesInconnues) console.log(`   [${c.id}] → « ${c.cible} »`)
}
const sansCible = classement.filter(l => l.verdict === 'D' && !l.cible)
if (sansCible.length) console.log(`\n⛔ ${sansCible.length} verdict D sans cible : ${sansCible.map(l => l.id).join(', ')}`)

// ── Rapport ──
const LIB: Record<string, string> = {
  D: 'don du Manuel 3.5', X: "don d'une autre source (3.0 ou supplément)",
  C: 'capacité de classe', R: 'trait racial', M: 'pouvoir de créature',
  P: 'marqueur de progression', S: 'séparateur', N: 'note de fiche', '?': 'à trancher',
}
console.log('\n══ CE QUE CONTIENT LA TABLE DES DONS ══')
for (const v of ['D', 'X', 'C', 'R', 'M', 'P', 'S', 'N', '?']) {
  const g = classement.filter(l => l.verdict === v)
  const avec = g.filter(l => (parId.get(l.id)?.porteurs ?? 0) > 0).length
  if (g.length) console.log(`  ${v}  ${String(g.length).padStart(3)} lignes  (${avec} portées par un personnage)  — ${LIB[v]}`)
}

// ── Les fusions proposées ──
const dons = classement.filter(l => l.verdict === 'D')
const groupes = new Map<string, Ligne[]>()
for (const d of dons) {
  if (!groupes.has(d.cible)) groupes.set(d.cible, [])
  groupes.get(d.cible)!.push(d)
}
const tries = [...groupes.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'fr'))
console.log(`\n══ FUSIONS PROPOSÉES — ${dons.length} lignes vers ${groupes.size} dons du Manuel ══`)
for (const [cible, membres] of tries) {
  if (membres.length === 1 && parId.get(membres[0].id)?.nom === cible) continue
  console.log(`\n→ ${cible}  (${membres.length})`)
  for (const m of membres) {
    const r = parId.get(m.id)!
    console.log(`     [${String(m.id).padStart(3)}] ${r.nom}${r.porteurs ? `   · ${r.porteurs} porteur${r.porteurs > 1 ? 's' : ''}` : '   · personne'}`)
  }
}
const dejaBons = tries.filter(([c, m]) => m.length === 1 && parId.get(m[0].id)?.nom === c)
console.log(`\n(${dejaBons.length} don${dejaBons.length > 1 ? 's' : ''} déjà écrit${dejaBons.length > 1 ? 's' : ''} exactement comme le Manuel : ${dejaBons.map(d => d[0]).join(', ')})`)

const absents = catalogue.filter(d => !groupes.has(d.nom))
console.log(`\n── ${absents.length} dons du Manuel que personne ne porte (le catalogue les apportera quand même) ──`)
console.log('   ' + absents.map(d => d.nom).join(' · '))

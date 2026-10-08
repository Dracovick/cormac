// Phase 2 — application des fiches relevées à l'image dans les SUPPLÉMENTS.
// Mêmes règles que p4-fiches-appliquer (campagne du Manuel) : ne remplit QUE les
// champs vides, ne touche jamais une valeur existante, rapporte les divergences.
// Les libellés imprimés en tête de la zone d'effet sont retirés (le livre combine
// « Cible », « Effet », « Zone d'effet » et leurs variantes).
//
// Exception explicite : une valeur stockée qui est un PRÉFIXE STRICT de la valeur
// du livre est une transcription tronquée, pas une saisie d'André — on la complète.
// C'est le cas de [245] Fureur vertueuse des fidèles, dont la zone d'effet s'arrêtait
// à « …dans un rayonnement » (relevé p. 172 du Codex Divin).
//
// Usage : npx tsx menage-references/p6-fiches-appliquer.mts [--dry]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

const DRY = process.argv.includes('--dry')
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const DIR = 'X:/Claude-Tools/cormac/menage-references/p6-fiches'

const norm = (s: string) => s.toLowerCase().replace(/[’´`]/g, "'")
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''
const borne = (v: string, max: number) => v.length <= max ? v : v.slice(0, max - 1) + '…'

const MOT = String.raw`(?:cibles?|effets?|zone\s+d['’]effet)`
const LIBELLE = new RegExp(String.raw`^${MOT}(?:\s*(?:ou|/|,)\s*${MOT})*\s*:\s*`, 'i')
const sansLibelle = (v: string | null | undefined) => {
  const t = v?.trim(); if (!t) return null
  return t.replace(LIBELLE, '').trim() || null
}

const lots = fs.readdirSync(DIR).filter(f => /\.json$/.test(f)).sort()
const entrees: any[] = []
for (const f of lots) for (const e of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))) entrees.push({ ...e, lot: f })
console.log(`lots : ${lots.join(', ')} | fiches : ${entrees.length}`)

const base = await sql`SELECT id, nom, ecole, composantes, portee, duree, zone_effet,
  jet_de_sauvegarde, resistance_magique, description FROM spells` as any[]
const parNom = new Map<string, any>()
for (const s of base) if (!parNom.has(norm(s.nom))) parNom.set(norm(s.nom), s)

let matches = 0, champs = 0, sortsTouches = 0, completions = 0
const conflits: string[] = [], absents: string[] = [], renommes: string[] = []

for (const e of entrees) {
  // Le livre et la base se donnent parfois deux noms pour le même sort (constaté au
  // Manuel : Téléportation suprême / sans erreur). Le relevé porte alors `nom` tel
  // qu'imprimé et `nom_base` tel que stocké — on apparie sur le second, sans deviner.
  let s = parNom.get(norm(e.nom))
  if (!s && e.nom_base) {
    s = parNom.get(norm(e.nom_base))
    if (s) renommes.push(`[${s.id}] livre « ${e.nom} » = base « ${s.nom} » (${e.lot}, p. ${e.page ?? '?'})`)
  }
  if (!s) { absents.push(`${e.nom} (p. ${e.page ?? '?'}, ${e.lot})`); continue }
  matches++
  const cibles: Array<[string, string | null, number]> = [
    ['ecole', e.ecole?.trim() || null, 100],
    ['composantes', e.composantes?.trim() || null, 50],
    ['portee', e.portee?.trim() || null, 100],
    ['duree', e.duree?.trim() || null, 100],
    ['zone_effet', sansLibelle(e.zone_effet), 100000],
    ['jet_de_sauvegarde', e.jds?.trim() || null, 100],
    ['resistance_magique', e.rm?.trim() || null, 50],
  ]
  let touche = false
  for (const [col, brute, max] of cibles) {
    if (!brute) continue
    const valeur = borne(brute, max)
    const actuel = s[col]
    if (!vide(actuel)) {
      const a = norm(String(actuel)), b = norm(valeur)
      if (a === b) continue
      // Transcription tronquée : la valeur stockée est un début exact de celle du livre.
      // ⚠ RESTREINT À zone_effet : sur `ecole`, « Évocation » est aussi un préfixe
      // d'« Évocation [force] », et compléter écraserait en masse les saisies d'André —
      // ce qu'il a refusé. Ces écarts partent au rapport. La requête ci-dessous ne vise
      // d'ailleurs que zone_effet : l'appliquer ailleurs y recopiait une valeur étrangère.
      if (col === 'zone_effet' && b.startsWith(a) && a.length >= 10) {
        console.log(`[${s.id}] ${s.nom} · ${col} : valeur tronquée complétée\n    « ${actuel} »\n  → « ${valeur} »`)
        if (!DRY) await sql`UPDATE spells SET zone_effet = ${valeur} WHERE id = ${s.id} AND zone_effet = ${actuel}`
        completions++; touche = true; continue
      }
      conflits.push(`[${s.id}] ${s.nom} · ${col} : base « ${String(actuel).slice(0, 55)} » ≠ livre « ${valeur.slice(0, 55)} »`)
      continue
    }
    if (DRY) { champs++; touche = true; continue }
    const r = col === 'ecole' ? await sql`UPDATE spells SET ecole = ${valeur} WHERE id = ${s.id} AND (ecole IS NULL OR trim(ecole)='') RETURNING id`
      : col === 'composantes' ? await sql`UPDATE spells SET composantes = ${valeur} WHERE id = ${s.id} AND (composantes IS NULL OR trim(composantes)='') RETURNING id`
      : col === 'portee' ? await sql`UPDATE spells SET portee = ${valeur} WHERE id = ${s.id} AND (portee IS NULL OR trim(portee)='') RETURNING id`
      : col === 'duree' ? await sql`UPDATE spells SET duree = ${valeur} WHERE id = ${s.id} AND (duree IS NULL OR trim(duree)='') RETURNING id`
      : col === 'zone_effet' ? await sql`UPDATE spells SET zone_effet = ${valeur} WHERE id = ${s.id} AND (zone_effet IS NULL OR trim(zone_effet)='') RETURNING id`
      : col === 'jet_de_sauvegarde' ? await sql`UPDATE spells SET jet_de_sauvegarde = ${valeur} WHERE id = ${s.id} AND (jet_de_sauvegarde IS NULL OR trim(jet_de_sauvegarde)='') RETURNING id`
      : await sql`UPDATE spells SET resistance_magique = ${valeur} WHERE id = ${s.id} AND (resistance_magique IS NULL OR trim(resistance_magique)='') RETURNING id`
    if (r.length === 1) { champs++; touche = true }
  }
  if (touche) sortsTouches++
}

console.log(`\n${DRY ? '[DRY] ' : ''}appariés : ${matches}/${entrees.length} | sorts touchés : ${sortsTouches} | champs : ${champs} | valeurs tronquées complétées : ${completions}`)
if (renommes.length) { console.log(`\nAppariés sur un second nom (${renommes.length}) :`); renommes.forEach(r => console.log('  - ' + r)) }
if (absents.length) { console.log(`\nSans correspondance en base (${absents.length}) :`); absents.forEach(a => console.log('  - ' + a)) }
if (conflits.length) { console.log(`\nDivergences base ≠ livre, NON touchées (${conflits.length}) :`); conflits.forEach(c => console.log('  - ' + c)) }
const reste = await sql`SELECT count(*)::int n FROM spells WHERE (portee IS NULL OR trim(portee)='') OR (duree IS NULL OR trim(duree)='')` as any[]
console.log(`\nfiches encore incomplètes : ${reste[0].n}`)

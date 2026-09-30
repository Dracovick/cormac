// Croisement (LECTURE SEULE) — chantier « fiches de sorts » 2026-09-29.
// Sorts de la base sans portee/duree/composantes (et les 8 sans description) :
// cherche la donnee dans, en ordre de confiance,
//   1. les releves du chapitre 11 verifies a l'image (mag-donnees-ch11 + lots 1-5, palrod-ch11-*)
//   2. le catalogue statique SORTS_DND35 (deja corrige au Manuel, et que la fiche
//      affiche deja en repli quand la base est vide)
// Produit sorts-fiches-plan-2026-09-29.json + rapport console. N'ecrit RIEN en base.
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { SORTS_DND35 } from '../src/lib/dnd35/spells'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const DIR = 'X:/Claude-Tools/cormac/menage-references'

const norm = (s: string) => s.toLowerCase()
  .replace(/[’´`]/g, "'")
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').trim()

type Fiche = { composantes?: string, portee?: string, duree?: string, description?: string, source: string }
const releves = new Map<string, Fiche>()
const catalogue = new Map<string, Fiche>()

// ── Relevés format mag : NOM|ÉCOLE|NIVEAUX|COMPOSANTES|PORTÉE|DURÉE ─────────
for (const f of ['mag-donnees-ch11.txt', 'mag-ch11-lot1.txt', 'mag-ch11-lot2.txt', 'mag-ch11-lot3.txt', 'mag-ch11-lot4.txt', 'mag-ch11-lot5.txt']) {
  for (const ligne of fs.readFileSync(`${DIR}/${f}`, 'utf8').split('\n')) {
    if (!ligne.trim() || ligne.startsWith('#')) continue
    const p = ligne.split('|')
    if (p.length !== 6) continue
    const [nom, , , comp, portee, duree] = p.map(x => x.trim())
    const fiche: Fiche = { source: f }
    if (comp && comp !== '?') fiche.composantes = comp
    if (portee && portee !== '?') fiche.portee = portee
    if (duree && duree !== '?') fiche.duree = duree
    if (!releves.has(norm(nom))) releves.set(norm(nom), fiche)
  }
}
// ── Relevés format palrod : nom|école|comp|portée|durée|description|page ────
for (const f of ['palrod-ch11-A-C.txt', 'palrod-ch11-D-L.txt', 'palrod-ch11-M-Z.txt']) {
  for (const ligne of fs.readFileSync(`${DIR}/${f}`, 'utf8').split('\n')) {
    if (!ligne.trim() || ligne.startsWith('#')) continue
    const p = ligne.split('|')
    if (p.length !== 7) continue
    const [nom, , comp, portee, duree, desc] = p.map(x => x.trim())
    const k = norm(nom)
    if (!releves.has(k)) {
      const fiche: Fiche = { source: f }
      if (comp && comp !== '?') fiche.composantes = comp
      if (portee && portee !== '?') fiche.portee = portee
      if (duree && duree !== '?') fiche.duree = duree
      if (desc && desc !== '?') fiche.description = desc
      releves.set(k, fiche)
    }
  }
}
// ── Catalogue statique ───────────────────────────────────────────────────────
for (const s of SORTS_DND35) {
  const k = norm(s.nom)
  if (!catalogue.has(k)) catalogue.set(k, {
    composantes: s.composantes, portee: s.portee, duree: s.duree,
    description: s.description, source: 'SORTS_DND35',
  })
}
console.log(`releves : ${releves.size} noms | catalogue : ${catalogue.size} noms`)

// ── Sorts de la base à compléter ─────────────────────────────────────────────
const vides = (v: string | null) => v === null || v.trim() === ''
const rows = await sql`
  SELECT id, nom, composantes, portee, duree, description FROM spells
  WHERE portee IS NULL OR trim(portee) = '' OR duree IS NULL OR trim(duree) = ''
     OR composantes IS NULL OR trim(composantes) = ''
     OR description IS NULL OR trim(description) = ''
  ORDER BY nom
`
type Maj = { id: number, nom: string, set: Record<string, string>, source: string }
const plan: Maj[] = []
let viaReleve = 0, viaCatalogue = 0, mixte = 0
const nonCouverts: string[] = []
const partiels: string[] = []

for (const r of rows) {
  const k = norm(r.nom)
  const rel = releves.get(k)
  const cat = catalogue.get(k)
  const set: Record<string, string> = {}
  const srcs = new Set<string>()
  for (const champ of ['composantes', 'portee', 'duree', 'description'] as const) {
    if (!vides(r[champ])) continue
    const vRel = rel?.[champ]
    const vCat = cat?.[champ]
    if (vRel) { set[champ] = vRel; srcs.add('releve') }
    else if (vCat) { set[champ] = vCat; srcs.add('catalogue') }
  }
  if (Object.keys(set).length === 0) { nonCouverts.push(`[${r.id}] ${r.nom}`); continue }
  const manque = (['composantes', 'portee', 'duree', 'description'] as const)
    .filter(c => vides(r[c]) && !set[c])
  if (manque.length) partiels.push(`[${r.id}] ${r.nom} — restera sans : ${manque.join(', ')}`)
  const source = srcs.size === 2 ? 'mixte' : srcs.has('releve') ? 'releve' : 'catalogue'
  if (source === 'mixte') mixte++; else if (source === 'releve') viaReleve++; else viaCatalogue++
  plan.push({ id: r.id, nom: r.nom, set, source })
}

console.log(`\nsorts a completer : ${rows.length}`)
console.log(`couverts : ${plan.length} (releve seul ${viaReleve}, catalogue seul ${viaCatalogue}, mixte ${mixte})`)
console.log(`non couverts (aucune source) : ${nonCouverts.length}`)
console.log(`couverts partiellement : ${partiels.length}`)
if (partiels.length) console.log(' ' + partiels.slice(0, 20).join('\n '))
if (nonCouverts.length) console.log('\nNON COUVERTS :\n ' + nonCouverts.join('\n '))

// Les 8 sans description : detail
console.log('\n--- Descriptions manquantes ---')
for (const r of rows.filter(r => vides(r.description))) {
  const m = plan.find(p => p.id === r.id)
  console.log(` [${r.id}] ${r.nom} -> ${m?.set.description ? `${m.source} : ${m.set.description.slice(0, 80)}…` : 'A REDIGER'}`)
}

fs.writeFileSync(`${DIR}/sorts-fiches-plan-2026-09-29.json`, JSON.stringify(plan, null, 1), 'utf8')
console.log(`\nplan ecrit : ${plan.length} mises a jour -> sorts-fiches-plan-2026-09-29.json`)

// Phase 2 — fiches des sorts décrits par RENVOI (« Ce sort est semblable à X, si ce n'est que… »).
//
// Les livres n'impriment jamais le bloc technique de ces sorts : ils renvoient à un sort
// de référence et n'énoncent que la différence. Leur fiche en base est donc nue, alors
// que l'information existe — elle est sur la fiche du sort cité. Même situation que les
// douze versions dérivées des sorts d'alignement traitées le 2026-10-07.
//
// ⚠ GARDE-FOU, appris de l'affaire « Rejet » : le renvoi sert justement à annoncer ce qui
// CHANGE. « Le même que froid rampant, mais sa DURÉE présente un 4e round » — recopier la
// durée de la référence serait faux. Un champ n'est donc propagé QUE si la phrase de
// renvoi ne nomme pas ce champ. Dans le doute, on laisse vide.
//
// Les chaînes sont résolues par passes successives (un dérivé d'un dérivé attend que son
// parent soit rempli), jusqu'à ce qu'une passe n'apporte plus rien.
//
// Usage : npx tsx menage-references/p6-sorts-derives.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')

const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[’´`]/g, "'").replace(/\*/g, '').replace(/\s+/g, ' ').trim()

// Formes de renvoi réellement employées dans les livres VF (relevées sur les données).
const RENVOIS = [
  /\best\s+semblable\s+à\s+(.+?)\s*(?:,|\.|$)/i,
  /\best\s+identique\s+(?:à\s+)?(.+?)\s*(?:,|\.|$)/i,
  /\best\s+similaire\s+à\s+(.+?)\s*(?:,|\.|$)/i,
  /\best\s+le\s+même\s+que\s+(.+?)\s*(?:,|\.|$)/i,
  // ⚠ « que » AVANT « qu' », et l'apostrophe obligatoire dans la seconde : sinon
  // « …principe que Matrice de la Simbule » se fait manger son M initial par le
  // « qu' » optionnel, et la cible devient introuvable.
  /\bfonctionne\s+sur\s+le\s+même\s+principe\s+que\s+(.+?)\s*(?:,|\.|$)/i,
  /\bfonctionne\s+sur\s+le\s+même\s+principe\s+qu['’]\s*(.+?)\s*(?:,|\.|$)/i,
  /\bfonctionne\s+comme\s+(.+?)\s*(?:,|\.|$)/i,
  // Forme courte des résumés d'origine : « Comme résurgence, mais affecte plusieurs
  // cibles. » Ancrée en tête pour écarter « Comme son nom l'indique… » — et de toute
  // façon la cible doit se résoudre à un sort existant pour que quoi que ce soit bouge.
  /^Comme\s+(.+?)\s*(?:,|\.|$)/i,
]

// Un champ n'est propagé que si la phrase de renvoi ne le nomme pas.
const CHAMPS: Array<{ col: string; garde: RegExp }> = [
  { col: 'composantes',        garde: /composante/i },
  { col: 'portee',             garde: /port[ée]e/i },
  { col: 'zone_effet',         garde: /zone\s+d['’]effet|\bcibles?\b|rayon|cône|émanation/i },
  { col: 'duree',              garde: /dur[ée]e|instantan|permanent|round|minute|heure|jour/i },
  { col: 'jet_de_sauvegarde',  garde: /sauvegarde|volont[ée]|vigueur|r[ée]flexes/i },
  { col: 'resistance_magique', garde: /r[ée]sistance\s+à\s+la\s+magie/i },
]

const NOTE_DEBUT = '*Blocs techniques repris de '

function cibleDe(description: string): string | null {
  const d = String(description ?? '').replace(/\s+/g, ' ')
  for (const r of RENVOIS) {
    const m = d.match(r)
    if (m && m[1] && m[1].trim().length > 2) return m[1].trim()
  }
  return null
}

let passe = 0, totalChamps = 0, totalSorts = 0
const introuvables = new Map<string, string>()
const bloques: string[] = []

while (passe < 5) {
  passe++
  const tous = await sql`SELECT id, nom, description, ecole, composantes, portee, duree, zone_effet,
    jet_de_sauvegarde, resistance_magique FROM spells` as any[]
  const parNom = new Map<string, any>()
  for (const s of tous) if (!parNom.has(norm(s.nom))) parNom.set(norm(s.nom), s)

  let champsPasse = 0, sortsPasse = 0
  introuvables.clear(); bloques.length = 0

  for (const s of tous) {
    if (!(vide(s.portee) || vide(s.duree))) continue
    const desc = String(s.description ?? '')
    if (desc.includes(NOTE_DEBUT)) continue           // déjà traité
    const cible = cibleDe(desc)
    if (!cible) continue
    const ref = parNom.get(norm(cible))
    if (!ref) { introuvables.set(s.nom, cible); continue }
    if (ref.id === s.id) continue                     // renvoi sur soi-même
    if (vide(ref.portee) && vide(ref.duree)) { bloques.push(`${s.nom} → ${ref.nom} (référence encore nue)`); continue }

    const aPoser = CHAMPS.filter(c => vide(s[c.col]) && !vide(ref[c.col]) && !c.garde.test(desc))
    const retenus = CHAMPS.filter(c => vide(s[c.col]) && !vide(ref[c.col]) && c.garde.test(desc))
    if (!aPoser.length) continue

    if (passe === 1 && sortsPasse < 8) {
      console.log(`[${s.id}] ${s.nom}  →  ${ref.nom}`)
      console.log(`    pose : ${aPoser.map(c => c.col).join(', ')}`)
      if (retenus.length) console.log(`    retenu par la garde (le renvoi en parle) : ${retenus.map(c => c.col).join(', ')}`)
    }
    sortsPasse++
    if (!appliquer) { champsPasse += aPoser.length; continue }

    for (const c of aPoser) {
      const v = ref[c.col]
      const r = c.col === 'composantes' ? await sql`UPDATE spells SET composantes = ${v} WHERE id = ${s.id} AND (composantes IS NULL OR trim(composantes)='') RETURNING id`
        : c.col === 'portee' ? await sql`UPDATE spells SET portee = ${v} WHERE id = ${s.id} AND (portee IS NULL OR trim(portee)='') RETURNING id`
        : c.col === 'zone_effet' ? await sql`UPDATE spells SET zone_effet = ${v} WHERE id = ${s.id} AND (zone_effet IS NULL OR trim(zone_effet)='') RETURNING id`
        : c.col === 'duree' ? await sql`UPDATE spells SET duree = ${v} WHERE id = ${s.id} AND (duree IS NULL OR trim(duree)='') RETURNING id`
        : c.col === 'jet_de_sauvegarde' ? await sql`UPDATE spells SET jet_de_sauvegarde = ${v} WHERE id = ${s.id} AND (jet_de_sauvegarde IS NULL OR trim(jet_de_sauvegarde)='') RETURNING id`
        : await sql`UPDATE spells SET resistance_magique = ${v} WHERE id = ${s.id} AND (resistance_magique IS NULL OR trim(resistance_magique)='') RETURNING id`
      if (r.length === 1) champsPasse++
    }
    const libelles = aPoser.map(c => ({ composantes: 'composantes', portee: 'portée', zone_effet: "zone d'effet",
      duree: 'durée', jet_de_sauvegarde: 'jet de sauvegarde', resistance_magique: 'résistance à la magie' } as any)[c.col]).join(', ')
    const note = `${NOTE_DEBUT}${ref.nom.toLowerCase()} (${libelles}) : le livre décrit ce sort par renvoi et ne les réimprime pas.*`
    await sql`UPDATE spells SET description = description || E'\n\n' || ${note} WHERE id = ${s.id} AND description IS NOT NULL`
  }

  console.log(`\npasse ${passe} : ${sortsPasse} sorts, ${champsPasse} champs`)
  totalChamps += champsPasse; totalSorts += sortsPasse
  if (!appliquer || champsPasse === 0) break
}

console.log(`\n${appliquer ? '' : '[APERÇU] '}total : ${totalSorts} sorts, ${totalChamps} champs`)
if (introuvables.size) {
  console.log(`\nRenvois dont la cible est introuvable en base (${introuvables.size}) — laissés tels quels :`)
  for (const [n, c] of introuvables) console.log(`  ${n} → « ${c} »`)
}
if (bloques.length) {
  console.log(`\nRenvois vers une référence elle-même nue (${bloques.length}) — attendent le relevé du livre :`)
  for (const b of bloques.slice(0, 20)) console.log('  ' + b)
}
const reste = await sql`SELECT count(*)::int n FROM spells WHERE (portee IS NULL OR trim(portee)='') OR (duree IS NULL OR trim(duree)='')` as any[]
console.log(`\nfiches encore incomplètes : ${reste[0].n}`)

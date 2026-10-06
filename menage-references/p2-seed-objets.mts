// Phase 2 Bibliothèque — semis des objets magiques officiels du GdM ch. 7
// Usage :
//   npx tsx menage-references/p2-seed-objets.mts <fichier.md> <Type>            → aperçu (dry-run)
//   npx tsx menage-references/p2-seed-objets.mts <fichier.md> <Type> --appliquer → insertion
// <Type> = valeur de la colonne magic_items.type (Anneau, Baguette, Bâton, Sceptre, Objet merveilleux)
// Le fichier .md vient des relevés p2-releves/ : entrées « ### Nom » suivies de
// lignes « - prix: », « - niveau_lanceur: », « - aura: », « - charges: », « - description: ».
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const [fichier, typeObjet, flag] = process.argv.slice(2)
if (!fichier || !typeObjet) { console.error('Usage: p2-seed-objets.mts <fichier.md> <Type> [--appliquer]'); process.exit(1) }
const appliquer = flag === '--appliquer'

const normaliser = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, ' ').replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim()

type Entree = { nom: string; prix: number | null; nls: number | null; aura: string | null; charges: number | null; description: string }

function parser(md: string): Entree[] {
  const entrees: Entree[] = []
  const blocs = md.split(/^### /m).slice(1)
  for (const bloc of blocs) {
    const lignes = bloc.split('\n')
    const nom = lignes[0].trim()
    const corps = lignes.slice(1).join('\n')
    const champ = (c: string) => corps.match(new RegExp(`^- ${c}:\\s*(.+)$`, 'm'))?.[1].trim() ?? null
    // premier nombre du champ seulement — jamais de concaténation des chiffres d'une parenthèse explicative
    const premierNombre = (v: string | null) => {
      if (!v) return null
      const m = v.replace(/(\d)[\s  ](?=\d)/g, '$1').match(/\d+(?:\.\d+)?/)
      return m ? parseFloat(m[0]) : null
    }
    const prix = premierNombre(champ('prix'))
    const nls = premierNombre(champ('niveau_lanceur'))
    const charges = premierNombre(champ('charges'))
    let aura = champ('aura')
    if (aura) {
      aura = aura.replace(/\s*\[sic[^\]]*\]/gi, '').trim()
      if (/non indiqu|non précis|aucune/i.test(aura) || !aura) aura = null
    }
    // description : tout ce qui suit « - description: » jusqu'à la fin du bloc
    const mDesc = corps.match(/^- description:\s*([\s\S]+)$/m)
    // retire l'indentation markdown de chaque ligne — la fiche affiche en whitespace-pre-line
    const description = mDesc ? mDesc[1].trim().split('\n').map(l => l.replace(/^[ \t]+/, '')).join('\n') : ''
    if (nom) entrees.push({ nom, prix, nls: Number.isFinite(nls as number) ? nls : null, aura, charges, description })
  }
  return entrees
}

const md = fs.readFileSync(fichier, 'utf8')
const entrees = parser(md)
console.log(`${entrees.length} entrées lues dans ${fichier}`)

// clé sémantique : nom normalisé sans mots-outils ni mot de catégorie — attrape
// « Anneau Retour de sorts » vs « Anneau de renvoi des sorts » seulement s'ils partagent les mots-clés,
// et « Anneau feuille Morte » vs « Anneau de feuille morte ».
const STOP = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'un', 'une', 'aux', 'au', 'et', 'sur'])
// La famille d'objet reste dans la clé : « Anneau d'invisibilité » ≠ « Baguette d'invisibilité ».
// Seuls les vrais synonymes de famille fusionnent (bâtonnet = vieille VF de baguette).
const FAMILLES: Record<string, string> = { batonnet: 'baguette' }
const cle = (s: string) => {
  const mots = normaliser(s).split(' ').filter(m => m && !STOP.has(m))
  if (mots.length > 1) mots[0] = FAMILLES[mots[0]] ?? mots[0]
  return [mots[0], ...mots.slice(1).sort()].join(' ')
}

const existants = await sql`select id, nom, type from magic_items` as any[]
const parNom = new Map(existants.map(e => [normaliser(e.nom), e]))
const parCle = new Map(existants.map(e => [cle(e.nom), e]))

// Exclusions manuelles : même objet déjà en base sous un synonyme que la clé sémantique ne peut pas lier.
// À trancher par le MJ (renommage ou fusion), comme les quasi-doublons de SORTS_BASE.
const SAUTER_MANUEL = new Map<string, string>([
  ['anneau de renvoi des sorts', '[19] Anneau Retour de sorts — même objet (spell turning), synonyme de traduction'],
])

const nouveaux: Entree[] = []
for (const e of entrees) {
  if (/^Règles générales/i.test(e.nom)) continue
  const manuel = SAUTER_MANUEL.get(normaliser(e.nom))
  if (manuel) { console.log(`  ≈ EXCLUSION MANUELLE : « ${e.nom} » ↔ ${manuel}`); continue }
  const doublon = parNom.get(normaliser(e.nom))
  if (doublon) { console.log(`  = déjà en base : « ${e.nom} » → [${doublon.id}] ${doublon.nom} (${doublon.type})`); continue }
  const proche = parCle.get(cle(e.nom))
  if (proche) { console.log(`  ≈ QUASI-DOUBLON, SAUTÉ : « ${e.nom} » ↔ [${proche.id}] ${proche.nom} (${proche.type}) — à trancher par le MJ`); continue }
  if (!e.description || e.description.length < 20) { console.log(`  ⚠ description trop courte, SAUTÉ : « ${e.nom} »`); continue }
  nouveaux.push(e)
}
console.log(`\n${nouveaux.length} nouveaux à semer comme type « ${typeObjet} » :`)
for (const e of nouveaux) console.log(`  + ${e.nom} | ${e.prix ?? '—'} po | NLS ${e.nls ?? '—'} | ${e.aura ?? '—'} | desc ${e.description.length} car.`)

if (!appliquer) { console.log('\n(aperçu seulement — relancer avec --appliquer pour insérer)'); process.exit(0) }

let inseres = 0
for (const e of nouveaux) {
  await sql`insert into magic_items (nom, type, prix, niveau_lanceur, aura_magique, charges_max, description)
            values (${e.nom}, ${typeObjet}, ${e.prix}, ${e.nls}, ${e.aura}, ${e.charges}, ${e.description})`
  inseres++
}
console.log(`\n✅ ${inseres} objets insérés.`)
const total = await sql`select count(*)::int as n from magic_items` as any[]
console.log(`magic_items compte maintenant ${total[0].n} références.`)

// Phase 2 Bibliothèque — insertion des niveaux de sorts par classe depuis les relevés classes-*.md
// Usage :
//   npx tsx menage-references/p2-seed-classes-sorts.mts <fichier.md>              → aperçu
//   npx tsx menage-references/p2-seed-classes-sorts.mts <fichier.md> --appliquer  → insertion
// Format du fichier : « ## CLASSE: Nom » puis « ### Niveau N » puis « - Nom du sort ».
// « Ensorceleur/Magicien » insère pour les deux classes au même niveau (liste commune du Manuel).
// Les noms sans correspondance dans spells sont RAPPORTÉS, jamais créés.
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const [fichier, flag] = process.argv.slice(2)
if (!fichier) { console.error('Usage: p2-seed-classes-sorts.mts <fichier.md> [--appliquer]'); process.exit(1) }
const appliquer = flag === '--appliquer'

const normaliser = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, ' ').replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim()

const classesDb = await sql`select id, nom from classes` as any[]
const idClasse = new Map(classesDb.map(c => [normaliser(c.nom), c.id]))

const sorts = await sql`select id, nom from spells` as any[]
const idSort = new Map<string, { id: number; nom: string }>()
for (const s of sorts) idSort.set(normaliser(s.nom), s)

const existants = await sql`select sort_id, classe_id, niveau from spell_class_levels` as any[]
const dejaLa = new Set(existants.map(e => `${e.sort_id}|${e.classe_id}`))

const md = fs.readFileSync(fichier, 'utf8')
let classesCourantes: number[] = []
let classeLabel = ''
let niveau: number | null = null
const aInserer: { sortId: number; classeId: number; niveau: number; nom: string; classe: string }[] = []
const nonApparies: string[] = []
const conflits: string[] = []
let lus = 0

for (const ligne of md.split('\n')) {
  const mC = ligne.match(/^## CLASSE:\s*(.+)$/)
  if (mC) {
    classeLabel = mC[1].trim()
    classesCourantes = classeLabel.split('/').map(part => {
      const id = idClasse.get(normaliser(part))
      if (!id) { console.error(`Classe inconnue : « ${part.trim()} »`); process.exit(1) }
      return id
    })
    continue
  }
  const mN = ligne.match(/^### Niveau\s+(\d+)/i)
  if (mN) { niveau = parseInt(mN[1], 10); continue }
  const mS = ligne.match(/^- (.+)$/)
  if (!mS || niveau === null || !classesCourantes.length) continue
  lus++
  const nomBrut = mS[1].replace(/\s*\[\?\]\s*$/, '').trim()
  const sort = idSort.get(normaliser(nomBrut))
  if (!sort) { nonApparies.push(`${classeLabel} ${niveau} : ${nomBrut}${mS[1].includes('[?]') ? ' [lecture incertaine]' : ''}`); continue }
  for (const cid of classesCourantes) {
    const clef = `${sort.id}|${cid}`
    if (dejaLa.has(clef)) {
      const ex = existants.find(e => e.sort_id === sort.id && e.classe_id === cid)!
      if (ex.niveau !== niveau) conflits.push(`« ${sort.nom} » ${classeLabel} : base niveau ${ex.niveau} ≠ relevé niveau ${niveau} — NON modifié`)
      continue
    }
    dejaLa.add(clef)
    aInserer.push({ sortId: sort.id, classeId: cid, niveau, nom: sort.nom, classe: classeLabel })
  }
}

console.log(`${lus} entrées de liste lues dans ${fichier}`)
console.log(`${aInserer.length} associations (sort, classe, niveau) à insérer`)
if (conflits.length) { console.log(`\n⚠ ${conflits.length} conflits de niveau (base conservée) :`); conflits.forEach(c => console.log('  ' + c)) }
if (nonApparies.length) { console.log(`\n✗ ${nonApparies.length} noms sans correspondance dans spells :`); nonApparies.forEach(n => console.log('  ' + n)) }

if (!appliquer) { console.log('\n(aperçu seulement — relancer avec --appliquer pour insérer)'); process.exit(0) }

for (const a of aInserer) {
  await sql`insert into spell_class_levels (sort_id, classe_id, niveau) values (${a.sortId}, ${a.classeId}, ${a.niveau})`
}
console.log(`\n✅ ${aInserer.length} associations insérées.`)
const total = await sql`select count(*)::int n from spell_class_levels` as any[]
console.log(`spell_class_levels compte maintenant ${total[0].n} lignes.`)

// Phase 2 Bibliothèque — semis des sorts du Manuel des Joueurs absents de la table spells.
// GO d'André le 2026-10-06 (DM) : créer les sorts manquants avec leurs niveaux de classe
// dès l'insertion, MAIS avec une garde anti-doublon floue — tout nom trop proche d'une
// entrée existante n'est PAS créé : il est mis sur la liste à trancher par le MJ
// (dossier des quasi-doublons sémantiques déjà ouvert chez André).
//
// Sources (chapitre 11 du Manuel, relevées à l'image) :
//   p2-releves/classes-barde.md, classes-ens-mag.md, classes-pretre.md  (## CLASSE / ### Niveau / - nom)
//   druide-releve.txt   (niveau|nom)                                     → Druide
//   palrod-releve.txt   (P|niveau|nom, R|niveau|nom)                     → Paladin, Rôdeur
//
// Usage :
//   npx tsx menage-references/p3-semer-sorts-manuel.mts              → aperçu
//   npx tsx menage-references/p3-semer-sorts-manuel.mts --appliquer  → insertion
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv[2] === '--appliquer'
const DIR = 'X:/Claude-Tools/cormac/menage-references'

// ————— Normalisation et garde floue (mêmes règles que src/lib/recherche-floue.ts) —————
const normaliser = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, ' ').replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim()

function distanceBornee(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let ligneMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < ligneMin) ligneMin = cur[j]
    }
    if (ligneMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

const singulier = (m: string) => (m.length > 3 && (m.endsWith('s') || m.endsWith('x')) ? m.slice(0, -1) : m)
const decoupe = (t: string) => normaliser(t).split(/[\s()]+/).filter(m => m.length > 1).map(singulier)

function scoreMot(requete: string, cible: string): number {
  if (cible.startsWith(requete)) return 2
  const tolerance = requete.length >= 7 ? 2 : requete.length >= 4 ? 1 : 0
  if (tolerance === 0) return 0
  const tronque = cible.slice(0, Math.max(requete.length, Math.min(cible.length, requete.length + tolerance)))
  return distanceBornee(requete, tronque, tolerance) <= tolerance ? 1 : 0
}

// Chaque mot de A trouve un mot de B (préfixe ou coquille tolérée).
const couvre = (motsA: string[], motsB: string[]) =>
  motsA.every(a => motsB.some(b => scoreMot(a, b) > 0))

// « Convocation de monstres IV » — la série en chiffres romains N'EST PAS un doublon
// de ses sœurs : même base + numéro différent = sorts distincts.
const serie = (n: string) => {
  const m = n.match(/^(.*?)\s+(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/)
  return m ? { base: m[1], num: m[2] } : { base: n, num: '' }
}

/** Les noms d'existants trop proches du candidat; vide = le candidat est sûr. */
function suspectsDe(candidat: string, existants: { nom: string; norm: string }[]): string[] {
  const nc = normaliser(candidat)
  const sc = serie(nc)
  const motsC = decoupe(candidat)
  const motsCTries = [...motsC].sort().join(' ')
  const proches: string[] = []
  for (const e of existants) {
    const se = serie(e.norm)
    if (sc.base === se.base && sc.num !== se.num) continue
    const motsE = decoupe(e.nom)
    const lenMin = Math.min(nc.length, e.norm.length)
    const coquille = distanceBornee(nc, e.norm, lenMin >= 10 ? 2 : 1) <= (lenMin >= 10 ? 2 : 1)
    const memesMots = motsCTries === [...motsE].sort().join(' ')
    const mutuel = motsC.length > 0 && motsE.length > 0 && couvre(motsC, motsE) && couvre(motsE, motsC)
    if (coquille || memesMots || mutuel) proches.push(e.nom)
  }
  return proches
}

// ————— Lecture des cinq relevés du chapitre 11 —————
type Niveau = { classe: string; classeId: number; niveau: number }
const parNom = new Map<string, { nom: string; niveaux: Niveau[] }>()

const classesDb = await sql`select id, nom from classes` as any[]
const idClasse = new Map(classesDb.map((c: any) => [normaliser(c.nom), c.id]))
const cid = (nom: string) => {
  const id = idClasse.get(normaliser(nom))
  if (!id) { console.error(`Classe inconnue : ${nom}`); process.exit(1) }
  return id
}

function noter(nomBrut: string, classe: string, niveau: number) {
  const nom = nomBrut.replace(/\s*\[\?\]\s*$/, '').trim()
  if (!nom) return
  const clef = normaliser(nom)
  let entree = parNom.get(clef)
  if (!entree) { entree = { nom, niveaux: [] }; parNom.set(clef, entree) }
  const id = cid(classe)
  const deja = entree.niveaux.find(n => n.classeId === id)
  if (deja) {
    if (deja.niveau !== niveau) console.log(`⚠ conflit relevés : « ${nom} » ${classe} ${deja.niveau} ≠ ${niveau} — premier conservé`)
    return
  }
  entree.niveaux.push({ classe, classeId: id, niveau })
}

for (const [fichier, classes] of [
  ['p2-releves/classes-barde.md', null],
  ['p2-releves/classes-ens-mag.md', null],
  ['p2-releves/classes-pretre.md', null],
] as const) {
  void classes
  const md = fs.readFileSync(`${DIR}/${fichier}`, 'utf8')
  let courantes: string[] = []
  let niveau: number | null = null
  for (const l of md.split('\n')) {
    const mC = l.match(/^## CLASSE:\s*(.+)$/)
    if (mC) { courantes = mC[1].split('/').map(p => p.trim()); continue }
    const mN = l.match(/^### Niveau\s+(\d+)/i)
    if (mN) { niveau = parseInt(mN[1], 10); continue }
    const mS = l.match(/^- (.+)$/)
    if (mS && niveau !== null) for (const c of courantes) noter(mS[1], c, niveau)
  }
}
for (const l of fs.readFileSync(`${DIR}/druide-releve.txt`, 'utf8').split('\n')) {
  const m = l.match(/^(\d)\|(.+)$/)
  if (m) noter(m[2], 'Druide', parseInt(m[1], 10))
}
for (const l of fs.readFileSync(`${DIR}/palrod-releve.txt`, 'utf8').split('\n')) {
  const m = l.match(/^([PR])\|(\d)\|(.+)$/)
  if (m) noter(m[3], m[1] === 'P' ? 'Paladin' : 'Rôdeur', parseInt(m[2], 10))
}
console.log(`${parNom.size} noms de sorts distincts dans les relevés du chapitre 11`)

// ————— Partition : déjà en base / à semer / suspects —————
const sortsDb = await sql`select id, nom from spells` as any[]
const existants = sortsDb.map((s: any) => ({ id: s.id, nom: s.nom as string, norm: normaliser(s.nom) }))
const normExistants = new Map(existants.map(e => [e.norm, e]))

// La garde ne joue que contre les entrées PRÉEXISTANTES : c'est là que vivent les
// vieilles traductions maison. Deux noms proches tous deux imprimés dans le Manuel
// (Création mineure/majeure, Poing/Poigne de Bigby…) sont des sorts distincts par
// construction — on les sème tous les deux et on les signale à titre d'information.
const dejaEnBase: string[] = []
const aSemer: { nom: string; niveaux: Niveau[]; norm: string }[] = []
const suspects: { nom: string; proches: string[]; niveaux: Niveau[] }[] = []

// GO d'André le 2026-10-07 (DM, « GO les 8 ») : les huit noms que la garde avait
// retenus au premier passage sont des sorts DISTINCTS de leur voisin en base —
// chaque voisin est un autre sort réel, le plus souvent tiré d'un supplément.
// Portrait de chaque cas envoyé à André le 2026-10-06 avant la décision.
const EXEMPTES = new Set([
  'reperage',            // ↔ Dépeçage [132]
  'rage',                // ↔ Nage [285]
  'mur de pierre',       // ↔ Cœur de pierre [358]
  'mur de fer',          // ↔ Mur de feu [13]
  'rayons prismatiques', // ↔ Rayon prismatique [341]  (un « s » d'écart, les deux réels)
  'entrave',             // ↔ Entrain [421]
  'bouclier de la loi',  // ↔ Bouclier de la foi [74]
  'collet',              // ↔ Colle [406]
].map(normaliser))
const exemptesVues = new Set<string>()

for (const [clef, entree] of parNom) {
  if (normExistants.has(clef)) { dejaEnBase.push(entree.nom); continue }
  const proches = suspectsDe(entree.nom, existants)
  if (proches.length && !EXEMPTES.has(clef)) { suspects.push({ nom: entree.nom, proches, niveaux: entree.niveaux }); continue }
  if (proches.length) exemptesVues.add(clef)
  aSemer.push({ ...entree, norm: clef })
}

// Garde-fou : une exemption qui ne correspond à aucun nom retenu est une faute de
// frappe silencieuse — on refuse de semer plutôt que d'en oublier un.
const manquantes = [...EXEMPTES].filter(e => !exemptesVues.has(e))
if (manquantes.length) {
  console.error(`✖ exemptions sans effet (nom introuvable ou non retenu par la garde) : ${manquantes.join(', ')}`)
  process.exit(1)
}
console.log(`Exemptions appliquées (GO d'André) : ${exemptesVues.size}/8`)

const pairesInternes: string[] = []
for (let i = 0; i < aSemer.length; i++)
  for (let j = i + 1; j < aSemer.length; j++)
    if (suspectsDe(aSemer[i].nom, [{ nom: aSemer[j].nom, norm: aSemer[j].norm } as any]).length)
      pairesInternes.push(`« ${aSemer[i].nom} » ↔ « ${aSemer[j].nom} »`)

console.log(`Déjà dans spells : ${dejaEnBase.length}`)
console.log(`À semer (nom sûr) : ${aSemer.length}`)
console.log(`Retenus par la garde anti-doublon : ${suspects.length}`)
if (pairesInternes.length) {
  console.log(`\nℹ Paires de noms proches TOUTES DEUX du Manuel (semées, distinctes par construction) :`)
  pairesInternes.forEach(p => console.log('  ' + p))
}
if (suspects.length) {
  console.log('\n⚠ LISTE À TRANCHER PAR ANDRÉ — non créés, trop proches d\'une entrée existante :')
  for (const s of suspects) {
    console.log(`  « ${s.nom} » (${s.niveaux.map(n => `${n.classe} ${n.niveau}`).join(', ')}) ↔ ${s.proches.map(p => `« ${p} »`).join(' | ')}`)
  }
}

if (!appliquer) {
  console.log(`\nAssociations de classe qui accompagneraient le semis : ${aSemer.reduce((t, s) => t + s.niveaux.length, 0)}`)
  console.log('(aperçu seulement — relancer avec --appliquer pour insérer)')
  process.exit(0)
}

// ————— Insertion —————
const sortIds: number[] = []
const classeIds: number[] = []
const niveaux: number[] = []
let faits = 0
for (const s of aSemer) {
  const r = await sql`insert into spells (nom) values (${s.nom}) returning id` as any[]
  for (const n of s.niveaux) { sortIds.push(r[0].id); classeIds.push(n.classeId); niveaux.push(n.niveau) }
  if (++faits % 50 === 0) console.log(`  … ${faits}/${aSemer.length} sorts insérés`)
}
await sql`insert into spell_class_levels (sort_id, classe_id, niveau)
          select * from unnest(${sortIds}::int[], ${classeIds}::int[], ${niveaux}::int[])`
console.log(`\n✅ ${aSemer.length} sorts créés, ${sortIds.length} associations (sort, classe, niveau) insérées.`)

const tot = await sql`select count(*)::int n from spells` as any[]
const totScl = await sql`select count(*)::int n from spell_class_levels` as any[]
const sans = await sql`select count(*)::int n from spells s where not exists (select 1 from spell_class_levels scl where scl.sort_id = s.id)` as any[]
const parClasse = await sql`select c.nom, count(distinct scl.sort_id)::int n from classes c join spell_class_levels scl on scl.classe_id = c.id group by c.nom order by n desc` as any[]
console.log(`spells : ${tot[0].n} | spell_class_levels : ${totScl[0].n} | sorts sans classes relevées : ${sans[0].n}`)
console.log('Par classe :', parClasse.map((c: any) => `${c.nom} ${c.n}`).join(' | '))

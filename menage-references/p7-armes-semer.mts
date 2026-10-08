/**
 * Sème le catalogue des armes du Manuel (table 7-5) dans `weapons`.
 *
 * RÈGLE D'OR : aucune ligne existante n'est supprimée, et aucune valeur déjà
 * saisie par André n'est écrasée. La table contient ses lignes d'inventaire
 * FileMaker ("Longbow +3, rapid shot", "Tigre BLANC Patte"), pas un catalogue.
 *
 * Appariement d'une entrée du livre à une ligne existante — DEUX conditions,
 * toutes deux nécessaires :
 *   1. le nom NORMALISÉ est identique (casse, accents, apostrophes, espaces);
 *   2. le champ `degats` est vide OU exactement égal au dégât taille M du livre.
 * La 2e condition est là parce que les dégâts en base incluent souvent le
 * modificateur de Force du PORTEUR ("grande hache" = 1d12+5). Marquer une
 * telle ligne comme catalogue publierait un dégât faux.
 * Tout ce qui ne satisfait pas les deux → entrée NEUVE + la ligne existante
 * part au rapport comme « à rattacher », décision d'André.
 *
 * Usage : npx tsx menage-references/p7-armes-semer.mts [--ecrire]
 * Sans --ecrire : essai à blanc, rien n'est touché.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

type Entree = {
  nom: string; famille: string; prix: number | null
  degatsP: string | null; degats: string | null
  critMin: number | null; critMult: number | null
  portee: number | null; poids: number | null; type: string | null
  description: string; allonge?: boolean; double?: boolean; nonLetal?: boolean
}

const livre: Entree[] = JSON.parse(
  fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p7-armes-catalogue.json', 'utf8')
).armes

/** Casse, accents, apostrophes typographiques, espaces multiples. */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[\u2018\u2019\u02bc]/g, "'")
   .replace(/\s+/g, ' ').trim().toLowerCase()

/** La description finale porte les notes de table du livre. */
function descriptionComplete(e: Entree): string {
  const notes: string[] = []
  if (e.allonge) notes.push('Arme à allonge.')
  if (e.double) notes.push('Arme double.')
  if (e.nonLetal) notes.push('Inflige des dégâts non-létaux.')
  const bloc = notes.length ? `\n\n*${notes.join(' ')}*` : ''
  const degP = e.degatsP ? `\n\n*Dégâts pour une arme de taille P : ${e.degatsP}.*` : ''
  return `${e.description}${bloc}${degP}\n\n*[Manuel des Joueurs, table 7-5 et chapitre 7]*`
}

const existantes = await sql`
  SELECT id, nom, est_catalogue, degats, critique_min, critique_mult, portee, type_degats, taille, poids, prix, description,
    (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = weapons.id) porteurs
  FROM weapons ORDER BY id` as any[]

const parNom = new Map<string, any[]>()
for (const w of existantes) {
  const k = norm(w.nom)
  if (!parNom.has(k)) parNom.set(k, [])
  parNom.get(k)!.push(w)
}

const aCreer: Entree[] = []
const aCompleter: { e: Entree; w: any; champs: string[] }[] = []
const divergences: string[] = []
const refusees: string[] = []

let dejaSemees = 0
for (const e of livre) {
  const toutes = parNom.get(norm(e.nom)) ?? []

  // Idempotence : si l'entrée est déjà au catalogue, ne rien faire. Sans cette
  // garde, un 2e passage verrait 2 lignes du même nom (la ligne d'inventaire et
  // celle qu'on vient de créer), refuserait d'apparier et créerait une 3e ligne.
  if (toutes.some((c: any) => c.est_catalogue)) { dejaSemees++; continue }

  // Une seule ligne candidate, sinon on ne devine pas.
  const candidats = toutes
  const w = candidats.length === 1 ? candidats[0] : null

  if (!w) {
    if (candidats.length > 1) refusees.push(`${e.nom} — ${candidats.length} lignes portent ce nom (ids ${candidats.map(c => c.id).join(', ')})`)
    aCreer.push(e)
    continue
  }

  // Condition 2 : les dégâts en base ne doivent pas contredire le livre.
  const dBase = (w.degats ?? '').replace(/\s/g, '')
  const dLivre = (e.degats ?? '').replace(/\s/g, '')
  if (dBase && dLivre && dBase !== dLivre) {
    refusees.push(`${e.nom} [${w.id}] — dégâts en base « ${w.degats} » ≠ livre « ${e.degats} » (${w.porteurs} porteur(s)) → entrée neuve créée`)
    aCreer.push(e)
    continue
  }

  // On ne remplit que le vide. Tout écart sur un champ déjà rempli part au rapport.
  const champs: string[] = []
  const cmp = (col: string, actuel: any, voulu: any) => {
    if (voulu === null || voulu === undefined) return
    const estVide = actuel === null || actuel === '' || actuel === undefined
    if (estVide) { champs.push(col); return }
    const a = String(actuel).replace(/\s/g, '').toLowerCase()
    const v = String(voulu).replace(/\s/g, '').toLowerCase()
    if (a !== v && Math.abs(Number(a) - Number(v)) !== 0) {
      divergences.push(`${e.nom} [${w.id}] ${col} : base « ${actuel} » vs livre « ${voulu} »`)
    }
  }
  cmp('degats', w.degats, e.degats)
  cmp('critique_min', w.critique_min, e.critMin)
  cmp('critique_mult', w.critique_mult, e.critMult)
  cmp('portee', w.portee, e.portee)
  cmp('type_degats', w.type_degats, e.type)
  cmp('poids', w.poids, e.poids)
  cmp('prix', w.prix, e.prix)
  if (!w.description) champs.push('description')
  champs.push('famille', 'est_catalogue')
  aCompleter.push({ e, w, champs })
}

console.log(`\n=== ESSAI ${ECRIRE ? 'RÉEL' : 'À BLANC'} ===`)
console.log(`${livre.length} entrées du Manuel · ${existantes.length} lignes en base`)
console.log(`  → ${dejaSemees} déjà au catalogue (ignorées)`)
console.log(`  → ${aCompleter.length} lignes existantes complétées et marquées catalogue`)
console.log(`  → ${aCreer.length} entrées créées`)
console.log(`  → ${refusees.length} appariements REFUSÉS (laissés intacts, entrée neuve créée)`)
console.log(`  → ${divergences.length} divergences base≠livre, NON touchées`)

if (aCompleter.length) {
  console.log('\n--- lignes existantes reprises comme catalogue ---')
  for (const { e, w, champs } of aCompleter)
    console.log(`  [${w.id}] ${w.nom}  (${w.porteurs} porteur(s)) → remplit ${champs.filter(c => c !== 'famille' && c !== 'est_catalogue').join(', ') || 'rien, marquage seul'}`)
}
if (refusees.length) {
  console.log('\n--- appariements refusés ---')
  for (const r of refusees) console.log(`  ${r}`)
}
if (divergences.length) {
  console.log('\n--- divergences base ≠ livre (rien touché, décision d\'André) ---')
  for (const d of divergences) console.log(`  ${d}`)
}

if (!ECRIRE) {
  console.log('\nRien écrit. Relancer avec --ecrire pour appliquer.')
  process.exit(0)
}

let champsEcrits = 0, crees = 0
for (const { e, w, champs } of aCompleter) {
  const d = descriptionComplete(e)
  await sql`UPDATE weapons SET
      degats            = COALESCE(NULLIF(degats,''), ${e.degats}),
      critique_min      = COALESCE(critique_min, ${e.critMin}),
      critique_mult     = COALESCE(critique_mult, ${e.critMult}),
      portee            = COALESCE(portee, ${e.portee}),
      type_degats       = COALESCE(NULLIF(type_degats,''), ${e.type}),
      poids             = COALESCE(poids, ${e.poids}),
      prix              = COALESCE(prix, ${e.prix}),
      description       = COALESCE(NULLIF(description,''), ${d}),
      famille           = ${e.famille},
      est_catalogue     = true
    WHERE id = ${w.id}`
  champsEcrits += champs.length
}
for (const e of aCreer) {
  await sql`INSERT INTO weapons (nom, degats, critique_min, critique_mult, portee, type_degats, poids, prix, description, famille, est_catalogue)
    VALUES (${e.nom}, ${e.degats}, ${e.critMin}, ${e.critMult}, ${e.portee}, ${e.type}, ${e.poids}, ${e.prix}, ${descriptionComplete(e)}, ${e.famille}, true)`
  crees++
}
console.log(`\n✅ ${crees} créées, ${aCompleter.length} complétées (${champsEcrits} champs).`)

const t = await sql`SELECT count(*)::int total,
  count(*) FILTER (WHERE est_catalogue)::int catalogue,
  count(*) FILTER (WHERE NOT est_catalogue)::int inventaire FROM weapons` as any[]
console.log(`weapons : ${t[0].total} lignes — ${t[0].catalogue} catalogue, ${t[0].inventaire} inventaire`)

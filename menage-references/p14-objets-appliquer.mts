/**
 * Les 41 fiches d'objets magiques manquantes + la séparation catalogue / fiche.
 *
 * CE QUE LE CHANTIER A TROUVÉ (mesuré le 2026-10-08) :
 * `magic_items` porte 745 lignes de deux populations distinctes.
 *   - 671 entrées de LIVRE semées par mes scripts (ids 73-276 : reliques,
 *     armes et armures spécifiques, objets de Faerûn ; ids 279-745 : le
 *     chapitre 7 du Guide du Maître). Elles ont TOUTES leur description.
 *   - 74 lignes de la saisie FileMaker d'André (ids 1-72, 277, 278), dont 41
 *     sans description. Ce sont elles — et elles seules — qui affichaient
 *     « La description de cette entrée n'a pas encore été relevée dans les
 *     livres ». Le message promettait un relevé qui n'aura jamais lieu : il n'y
 *     a rien à relever, ce sont des quantités d'inventaire, des noms anglais et
 *     des pièces de campagne.
 *
 * CE QUE LE SCRIPT FAIT :
 *   1. marque `est_catalogue` sur les 671 entrées de livre (+ les 3 adoptées) ;
 *   2. écrit les 41 descriptions tranchées à la main dans
 *      p14-objets-verdicts.json, avec leur motif ;
 *   3. pose `catalogue_id` sur les lignes dont l'équivalent officiel existe
 *      déjà au catalogue, pour que le 📖 ouvre la règle et non la ligne ;
 *   4. complète type / aura / NLS / prix des 3 lignes ADOPTÉES comme entrées de
 *      catalogue (les 3 objets du Guide du Maître que le semis du 2026-10-06
 *      avait sautés en attendant une décision de renommage).
 *
 * CE QU'IL NE FAIT PAS : aucune suppression, aucun renommage, aucune fusion.
 * Les doublons repérés (Anneau de jade, Anneau de protection +2, Gantelets de
 * dextérité) sont signalés dans les fiches et laissés au MJ.
 *
 * GARDE-FOUS :
 *   - il ne remplit QUE le vide : un champ déjà rempli par André n'est jamais
 *     écrasé, et la deuxième exécution n'écrit rien ;
 *   - il REFUSE d'écrire sur une ligne dont le nom en base diffère du relevé
 *     (une ligne renommée depuis n'est plus celle que j'ai tranchée) ;
 *   - il REFUSE de poser un catalogue_id qui ne pointe pas sur une entrée de
 *     livre existante ;
 *   - il vérifie que le compte des entrées de livre tombe juste avant d'écrire.
 *
 * Usage : npx tsx menage-references/p14-objets-appliquer.mts [--ecrire]
 * Sans --ecrire : rapport seulement, rien n'est touché.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const RACINE = 'X:/Claude-Tools/cormac'
const sql = neon(fs.readFileSync(`${RACINE}/.env.local`, 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

type Verdict = {
  id: number
  nom: string
  verdict: 'adoptee' | 'renvoi' | 'campagne' | 'inventaire'
  est_catalogue?: boolean
  catalogue_id?: number
  type?: string
  aura_magique?: string
  niveau_lanceur?: number
  prix?: string
  description: string
  motif: string
}

const releve = JSON.parse(fs.readFileSync(`${RACINE}/menage-references/p14-objets-verdicts.json`, 'utf8'))
const verdicts: Verdict[] = releve.verdicts

// Les deux tranches d'ids semées depuis les livres. Frontière mesurée, pas
// supposée : les 204 lignes 73-276 portent toutes un prix et une description,
// les 467 lignes 279-745 sont le chapitre 7 du Guide du Maître.
const estLigneDeLivre = (id: number) => (id >= 73 && id <= 276) || id >= 279

const lignes = await sql`SELECT id, nom, type, aura_magique, niveau_lanceur, prix, description, est_catalogue, catalogue_id FROM magic_items ORDER BY id` as any[]
const parId = new Map<number, any>(lignes.map(l => [l.id, l]))

// ---------------------------------------------------------------- garde-fous
const fautes: string[] = []

for (const v of verdicts) {
  const l = parId.get(v.id)
  if (!l) { fautes.push(`[${v.id}] ${v.nom} : la ligne n'existe plus en base`); continue }
  if (l.nom !== v.nom) fautes.push(`[${v.id}] renommée depuis le relevé : base « ${l.nom} » ≠ relevé « ${v.nom} »`)
  if (v.catalogue_id != null) {
    const cible = parId.get(v.catalogue_id)
    if (!cible) fautes.push(`[${v.id}] cible de rattachement [${v.catalogue_id}] absente`)
    else if (!estLigneDeLivre(v.catalogue_id)) fautes.push(`[${v.id}] la cible [${v.catalogue_id}] « ${cible.nom} » n'est pas une entrée de livre`)
  }
}

const nbLivre = lignes.filter(l => estLigneDeLivre(l.id)).length
if (nbLivre !== 671) fautes.push(`compte des entrées de livre : ${nbLivre}, attendu 671 — la frontière a bougé, le relevé doit être refait`)

const videsEnBase = lignes.filter(l => !l.description || !String(l.description).trim()).map(l => l.id).sort((a, b) => a - b)
const videsDuReleve = verdicts.map(v => v.id).sort((a, b) => a - b)
const nonCouvertes = videsEnBase.filter(id => !videsDuReleve.includes(id))
if (nonCouvertes.length) fautes.push(`lignes sans description non couvertes par le relevé : ${nonCouvertes.join(', ')}`)

if (fautes.length) {
  console.log('⛔ REFUS D\'ÉCRIRE :\n' + fautes.map(f => '  - ' + f).join('\n'))
  process.exit(1)
}
console.log(`garde-fous : ${verdicts.length} verdicts, ${nbLivre} entrées de livre, ${videsEnBase.length} lignes sans description — toutes couvertes.`)

// ------------------------------------------------- 1. le statut de catalogue
let statuts = 0
for (const l of lignes) {
  const v = verdicts.find(x => x.id === l.id)
  const doitEtre = estLigneDeLivre(l.id) || v?.est_catalogue === true
  if (l.est_catalogue !== doitEtre) {
    if (ECRIRE) await sql`UPDATE magic_items SET est_catalogue = ${doitEtre} WHERE id = ${l.id}`
    statuts++
  }
}
console.log(`statut de catalogue : ${statuts} ligne(s) ${ECRIRE ? 'mise(s) à jour' : 'à mettre à jour'}`)

// ----------------------------------------- 2/3/4. fiches, renvois, blocs techniques
let ecrites = 0, rattachees = 0, champs = 0, sautees = 0
const parVerdict: Record<string, number> = {}

for (const v of verdicts) {
  const l = parId.get(v.id)
  parVerdict[v.verdict] = (parVerdict[v.verdict] ?? 0) + 1

  // la description : seulement si elle est vide
  if (!l.description || !String(l.description).trim()) {
    if (ECRIRE) await sql`UPDATE magic_items SET description = ${v.description} WHERE id = ${v.id}`
    ecrites++
  } else {
    sautees++
    console.log(`  ⏭ [${v.id}] ${v.nom} : description déjà remplie, laissée intacte`)
  }

  // le rattachement
  if (v.catalogue_id != null && l.catalogue_id !== v.catalogue_id) {
    if (ECRIRE) await sql`UPDATE magic_items SET catalogue_id = ${v.catalogue_id} WHERE id = ${v.id}`
    rattachees++
  }

  // le bloc technique des 3 adoptées — chaque champ seulement s'il est vide
  for (const [col, val] of [['type', v.type], ['aura_magique', v.aura_magique], ['niveau_lanceur', v.niveau_lanceur], ['prix', v.prix]] as [string, any][]) {
    if (val == null) continue
    if (l[col] != null && String(l[col]).trim() !== '') continue
    if (ECRIRE) await sql.query(`UPDATE magic_items SET ${col} = $1 WHERE id = $2`, [val, v.id])
    champs++
  }
}

console.log(`\nfiches écrites       : ${ecrites}`)
console.log(`déjà remplies        : ${sautees}`)
console.log(`rattachements posés  : ${rattachees}`)
console.log(`champs techniques    : ${champs}`)
console.log(`répartition          : ${Object.entries(parVerdict).map(([k, n]) => `${k} ${n}`).join(' · ')}`)

if (!ECRIRE) { console.log('\n(essai à blanc — relancer avec --ecrire)'); process.exit(0) }

// ------------------------------------------------------------- contrôle final
const apres = await sql`
  SELECT count(*)::int total,
         count(*) FILTER (WHERE description IS NULL OR btrim(description) = '')::int vides,
         count(*) FILTER (WHERE est_catalogue)::int catalogue,
         count(*) FILTER (WHERE catalogue_id IS NOT NULL)::int rattachees
  FROM magic_items` as any[]
console.log('\naprès écriture :', apres[0])

const orphelins = await sql`SELECT m.id, m.nom, m.catalogue_id FROM magic_items m WHERE m.catalogue_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM magic_items c WHERE c.id = m.catalogue_id AND c.est_catalogue)` as any[]
console.log('rattachements orphelins :', orphelins.length === 0 ? 'aucun' : JSON.stringify(orphelins))

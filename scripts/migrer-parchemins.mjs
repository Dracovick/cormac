/* Déménagement des parchemins hors du rayon des potions — drizzle/0013.
 *
 * Demande d'André le 2026-10-25 : « j'avais un parchemin lors de la partie
 * d'aujourd'hui… avec une gorgée ! » Les parchemins vivaient dans `potions`,
 * donc le journal écrivait « Boit « Parchemin Porte dimensionnelle » (0 gorgée
 * restante) ».
 *
 * ⚠ Ce script REMESURE l'état au lieu de se fier au relevé écrit dans la
 * migration : entre le moment où j'ai compté et celui où il s'exécute, André
 * peut avoir saisi un troisième parchemin en pleine partie.
 *
 * Usage :
 *   node scripts/migrer-parchemins.mjs              → essai, n'écrit rien
 *   node scripts/migrer-parchemins.mjs --appliquer  → écrit
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APPLIQUER = process.argv.includes('--appliquer')

// ⚠ DATABASE_URL n'est PAS entre guillemets dans .env.local, contrairement à
// BLOB_READ_WRITE_TOKEN. On enlève les guillemets éventuels dans les deux cas.
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()
  .replace(/\r/g, '')
  .replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

/** Nom comparable : sans accent, sans casse, sans espaces en trop. */
const norm = s => (s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim()

// Classes du Manuel. Les classes maison d'André (Dracologist, Battle-mage,
// Cryptomancière…) sont volontairement hors de ce partage : elles ne tranchent
// pas la question profane/divin, et une devinette ici deviendrait une règle.
const ARCANIQUES = new Set([2, 8, 17])   // Magicien, Ensorceleur, Barde
const DIVINES = new Set([5, 12, 7, 3])   // Prêtre, Druide, Paladin, Rôdeur

console.log(APPLIQUER ? '▶ MIGRATION RÉELLE\n' : '▶ ESSAI — rien ne sera écrit (ajouter --appliquer)\n')

// ── 1. La table ─────────────────────────────────────────────────────────────
const ddl = fs.readFileSync(path.join(RACINE, 'drizzle', '0013_parchemins.sql'), 'utf8')
if (APPLIQUER) {
  // `neon()` n'accepte qu'une instruction par appel : on découpe sur les `;`
  // en fin d'instruction, et on saute les blocs purement commentaires.
  for (const instr of ddl.split(/;\s*(?:\r?\n|$)/)) {
    const utile = instr.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim()
    if (!utile) continue
    await sql.query(instr)
  }
  console.log('✔ table character_scrolls et son index en place')
} else {
  const [{ existe }] = await sql`
    SELECT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema='public' AND table_name='character_scrolls') AS existe`
  console.log(`· table character_scrolls : ${existe ? 'déjà là' : 'à créer'}`)
}

// ── 2. Ce qu'il y a à déménager, mesuré maintenant ──────────────────────────
const candidats = await sql`
  SELECT id, nom, sort_effet, niveau, charges_max, description
  FROM potions
  WHERE nom ILIKE '%parchemin%' OR nom ILIKE '%scroll%' OR nom ILIKE '%rouleau%'
  ORDER BY id`
console.log(`\n· ${candidats.length} entrée(s) de catalogue qui sont des parchemins :`)
for (const c of candidats) console.log(`   [${c.id}] ${c.nom}  (effet : ${c.sort_effet ?? '—'})`)

const lignes = await sql`
  SELECT cp.id, cp.personnage_id, cp.potion_id, cp.charges_restantes, cp.notes,
         p.nom, p.sort_effet, c.nom AS perso
  FROM character_potions cp
  JOIN potions p ON p.id = cp.potion_id
  JOIN characters c ON c.id = cp.personnage_id
  WHERE p.nom ILIKE '%parchemin%' OR p.nom ILIKE '%scroll%' OR p.nom ILIKE '%rouleau%'
  ORDER BY cp.id`
console.log(`\n· ${lignes.length} ligne(s) d'inventaire à déménager :`)

// ── 3. Retrouver le sort de chaque parchemin ────────────────────────────────
const sorts = await sql`SELECT id, nom FROM spells`
const parNom = new Map(sorts.map(s => [norm(s.nom), s]))
const niveaux = await sql`SELECT sort_id, classe_id, niveau FROM spell_class_levels`
const parSort = new Map()
for (const n of niveaux) {
  if (!parSort.has(n.sort_id)) parSort.set(n.sort_id, [])
  parSort.get(n.sort_id).push(n)
}

/** Le sort visé : l'effet d'abord, puis le nom débarrassé de son préfixe. */
function trouverSort(nomPotion, sortEffet) {
  const pistes = [sortEffet, nomPotion?.replace(/^\s*(parchemin|scroll|rouleau)\s*(de|d'|du|des)?\s*/i, '')]
  for (const p of pistes) {
    const trouve = p && parNom.get(norm(p))
    if (trouve) return trouve
  }
  return null
}

const aEcrire = []
for (const l of lignes) {
  const sort = trouverSort(l.nom, l.sort_effet)
  const classes = sort ? (parSort.get(sort.id) ?? []) : []
  const arcanique = classes.some(c => ARCANIQUES.has(c.classe_id))
  const divin = classes.some(c => DIVINES.has(c.classe_id))
  // Un sort des deux listes ne tranche pas : on laisse NULL plutôt que choisir.
  const type = arcanique && !divin ? 'profane' : !arcanique && divin ? 'divin' : null
  // Le niveau inscrit : le plus bas des classes du Manuel qui le portent. Pour
  // un parchemin trouvé, c'est la lecture la plus favorable et la plus courante.
  const duManuel = classes.filter(c => ARCANIQUES.has(c.classe_id) || DIVINES.has(c.classe_id))
  const niveauSort = duManuel.length ? Math.min(...duManuel.map(c => c.niveau)) : null
  // ⛔ Le niveau de lanceur reste NULL : il n'était nulle part dans l'ancienne
  // ligne. L'inventer serait fabriquer une portée et des dégâts.
  const ligne = {
    personnageId: l.personnage_id,
    sortId: sort?.id ?? null,
    nomLibre: sort ? null : (l.sort_effet || l.nom),
    niveauSort,
    niveauLanceur: null,
    type,
    quantite: Math.max(0, l.charges_restantes ?? 1),
    notes: l.notes,
    _apercu: `${l.perso} — ${l.nom} → ${sort ? `sort #${sort.id} « ${sort.nom} », niv. ${niveauSort ?? '?'}, ${type ?? 'type indéterminé'}` : '⚠ SORT INTROUVABLE, nom libre'}, ${Math.max(0, l.charges_restantes ?? 1)} exemplaire(s)`,
  }
  aEcrire.push(ligne)
  console.log(`   ${ligne._apercu}`)
}

// ── 4. Écriture ─────────────────────────────────────────────────────────────
if (!APPLIQUER) {
  console.log('\n⏹ essai terminé — rien n\'a été écrit.')
  process.exit(0)
}

for (const l of aEcrire) {
  await sql`
    INSERT INTO character_scrolls
      (personnage_id, sort_id, nom_libre, niveau_sort, niveau_lanceur, type, quantite, notes)
    VALUES (${l.personnageId}, ${l.sortId}, ${l.nomLibre}, ${l.niveauSort},
            ${l.niveauLanceur}, ${l.type}, ${l.quantite}, ${l.notes})`
}
console.log(`\n✔ ${aEcrire.length} parchemin(s) inscrit(s) dans character_scrolls`)

const idsLignes = lignes.map(l => l.id)
if (idsLignes.length) {
  await sql.query(`DELETE FROM character_potions WHERE id = ANY($1::int[])`, [idsLignes])
  console.log(`✔ ${idsLignes.length} ligne(s) retirée(s) de character_potions`)
}

// Les entrées de catalogue ne partent QUE si plus personne ne les porte — y
// compris par une ligne qu'on n'aurait pas reconnue comme parchemin.
const idsCat = candidats.map(c => c.id)
if (idsCat.length) {
  const restants = await sql.query(
    `SELECT DISTINCT potion_id FROM character_potions WHERE potion_id = ANY($1::int[])`, [idsCat])
  const encorePortes = new Set((restants.rows ?? restants).map(r => r.potion_id))
  const aSupprimer = idsCat.filter(id => !encorePortes.has(id))
  if (aSupprimer.length) {
    await sql.query(`DELETE FROM potions WHERE id = ANY($1::int[])`, [aSupprimer])
    console.log(`✔ ${aSupprimer.length} entrée(s) retirée(s) du catalogue des potions : ${aSupprimer.join(', ')}`)
  }
  if (encorePortes.size) {
    console.log(`⚠ ${encorePortes.size} entrée(s) gardée(s) au catalogue — encore portées : ${[...encorePortes].join(', ')}`)
  }
}

// ── 5. Contrôle, sur un motif PLUS LARGE que celui qui a servi à migrer ─────
const resteCat = await sql`
  SELECT id, nom FROM potions
  WHERE nom ~* '(parchem|scroll|rouleau|velin|vélin|papyrus)'`
const resteInv = await sql`
  SELECT cp.id, p.nom FROM character_potions cp JOIN potions p ON p.id = cp.potion_id
  WHERE p.nom ~* '(parchem|scroll|rouleau|velin|vélin|papyrus)'`
const total = await sql`SELECT count(*)::int AS n FROM character_scrolls`
console.log(`\n── Contrôle (motif élargi) ──`)
console.log(`   parchemins restants au catalogue des potions : ${resteCat.length}${resteCat.length ? ' → ' + resteCat.map(r => r.nom).join(', ') : ''}`)
console.log(`   lignes d'inventaire restantes               : ${resteInv.length}`)
console.log(`   lignes dans character_scrolls               : ${total[0].n}`)
console.log(resteCat.length === 0 && resteInv.length === 0 ? '\n✅ Déménagement complet.' : '\n⚠ Il reste des lignes — à regarder.')

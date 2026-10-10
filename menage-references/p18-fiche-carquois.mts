/**
 * La FICHE du carquois de Cormac — magic_items #41.
 *
 * André a dicté le texte de l'objet le 2026-10-10 : il vient de l'Encyclopedia
 * Magica (volumes papier), qui le reprend du Dragon Magazine no 133. Ce n'est
 * donc pas un objet de la 3.5, et aucun relevé dans les huit livres ne l'aurait
 * trouvé. Il a ajouté : « En plus de ce qui est décrit, il donne des flèches +2. »
 *
 * Ce que le script corrige, en plus d'écrire la fiche :
 *   la description disait « Flèches magiques +1. » — elle contredisait à la fois
 *   le nom de la ligne (« +2 infini ») et la dictée d'André (+2).
 *
 * Rejouable : il refuse d'écrire si la description en base n'est plus celle qu'il
 * attend (ni l'ancienne fautive, ni la neuve) — ce serait une saisie d'André.
 *
 * Usage : ./node_modules/.bin/tsx menage-references/p18-fiche-carquois.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (k?.trim() && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim()
}
const sql = neon(process.env.DATABASE_URL!)
const ECRIRE = process.argv.includes('--ecrire')

const ID = 41
/** La description fautive à remplacer, au caractère près. */
const ANCIENNE = 'Flèches magiques +1.'

const NOUVELLE = `🗃️ Ligne d'inventaire : le carquois de **Cormac**. Il vient de l'**Encyclopedia Magica**, qui le reprend du *Dragon Magazine* no 133 — ⚠ **ce n'est pas un objet de la 3.5**. Aucun des livres de la 3e édition ne le contient, et aucun relevé ne l'y trouvera. Le texte ci-dessous est celui que le MJ a dicté depuis ses volumes papier.

**Le texte de sa source**

« Ce carquois semble être un carquois ordinaire, mais il possède des propriétés magiques semblables à celles d'un sac sans fond. Il peut contenir jusqu'à 200 flèches sans augmenter la charge portée par l'archer : le carquois lui-même pèse autant qu'un carquois ordinaire vide. Les flèches qu'il contient sont facilement accessibles et peuvent être de n'importe quel type. »

Sa source lui donne une valeur de 4 000 po et de 1 000 XP. ⚠ La « valeur en XP » d'un objet est une mécanique d'AD&D 2e édition : en 3.5, trouver un objet ne rapporte aucune expérience.

⚠ **« Infini » vient du nom de la ligne, pas de la source** : le texte parle d'une contenance de 200 flèches, pas d'une réserve sans fin. À cette table, c'est le MJ qui tranche.

**La règle de la table**

Les flèches qui en sortent sont des **flèches +2** : +2 aux jets d'attaque et +2 aux jets de dégâts. C'est une propriété ajoutée par le MJ — elle ne figure pas dans le texte de la source.

**Ce que la 3.5 en dit quand même**

⚠ **Le bonus des flèches ne se cumule pas avec celui de l'arc.** Le livre est net : « le bonus d'altération d'une arme à projectiles ne se cumule pas avec le bonus d'altération de ses munitions ; on ne tient compte que de la plus haute des deux valeurs ». L'arc long composite +1 de Cormac et ces flèches +2 donnent donc **+2**, et non +3.

L'arc n'y perd pas tout : une munition tirée d'une arme à +1 ou plus est considérée comme magique pour ignorer la réduction des dégâts, et une munition tirée d'une arme alignée en reçoit l'alignement. Le bonus ne se cumule pas ; la qualité magique, oui.

**Une munition magique est détruite quand elle touche**, et a 50 % de chances d'être perdue quand elle rate. C'est ce qui fait le prix des flèches magiques au livre — et c'est exactement ce coût qu'une réserve inépuisable fait disparaître.

**Ce que ces flèches vaudraient au livre** : les munitions magiques se vendent et se créent par lots de 50. Un lot de 50 flèches +2 coûte **8 350 po** (8 000 po pour le bonus de +2, plus 350 po pour le lot de flèches de maître), soit 167 po la flèche.

**L'objet du livre le plus proche** est le *carquois d'Elhonna* (1 800 po) : lui aussi contient bien plus que sa taille ne le laisse croire — 60 flèches, 18 javelines et 6 arcs dans trois compartiments non dimensionnels — et pèse le même poids vide ou rempli. Il ne fournit aucune flèche magique. C'est une parenté de catégorie, pas le même objet : les deux restent des entrées distinctes, et ce carquois-ci n'est rattaché à aucune entrée de livre.

*Le bonus de +2 de ces flèches est saisi au champ « Munitions +Mag » de l'arc de Cormac : la fiche l'ajoute à son attaque et à ses dégâts, après la règle du non-cumul ci-dessus.*`

const PRIX = '4000.00'

const [avant] = (await sql`
  SELECT id, nom, type, emplacement, bonus, bonus_type, prix, aura_magique,
         niveau_lanceur, est_catalogue, catalogue_id, description
  FROM magic_items WHERE id = ${ID}
`) as any[]

if (!avant) {
  console.error(`⛔ magic_items #${ID} introuvable — rien écrit`)
  process.exit(1)
}

console.log(`── État actuel de #${ID} ──`)
console.log(`  nom         : ${avant.nom}`)
console.log(`  type        : ${avant.type} · emplacement ${avant.emplacement}`)
console.log(`  bonus       : ${avant.bonus} (type ${avant.bonus_type})`)
console.log(`  prix        : ${avant.prix}`)
console.log(`  catalogue   : est_catalogue=${avant.est_catalogue}, catalogue_id=${avant.catalogue_id}`)
console.log(`  description : ${JSON.stringify(avant.description)}`)

// ── Garde-fous ───────────────────────────────────────────────────────────────
if (avant.description === NOUVELLE && avant.prix === PRIX) {
  console.log('\n✓ Déjà fait : la fiche porte déjà ce texte et ce prix. Rien à écrire.')
  process.exit(0)
}
if (avant.description !== ANCIENNE) {
  console.error(
    `\n⛔ La description en base n'est pas celle que j'attendais (${JSON.stringify(ANCIENNE)}).` +
    `\n   C'est donc une saisie du MJ : je n'y touche pas. Rien écrit.`,
  )
  process.exit(1)
}
if (avant.bonus !== null || avant.bonus_type !== null) {
  console.error(
    `\n⛔ Cette ligne porte un bonus (${avant.bonus}/${avant.bonus_type}).` +
    `\n   Un carquois ne donne aucun bonus de CA : à vérifier avant d'écrire. Rien écrit.`,
  )
  process.exit(1)
}

// État d'avant archivé en clair, avant toute écriture.
const archive = resolve(process.cwd(), 'menage-references/p18-carquois-etat-avant.json')
writeFileSync(archive, JSON.stringify(avant, null, 2), 'utf-8')
console.log(`\n  état d'avant archivé → ${archive}`)

if (!ECRIRE) {
  console.log('\n(blanc : relancer avec --ecrire pour écrire)')
  process.exit(0)
}

await sql`
  UPDATE magic_items
  SET description = ${NOUVELLE}, prix = ${PRIX}
  WHERE id = ${ID} AND description = ${ANCIENNE}
`

const [apres] = (await sql`SELECT prix, description FROM magic_items WHERE id = ${ID}`) as any[]
const ok = apres.description === NOUVELLE && apres.prix === PRIX
console.log(`\n${ok ? '✓' : '✗'} écrit — prix ${apres.prix}, description ${apres.description.length} caractères`)

// Contrôle élargi : plus aucune ligne de carquois ne doit annoncer « +1 »
// alors que son nom dit « +2 ». On cherche l'ANCIEN discours, pas le neuf.
const residus = (await sql`
  SELECT id, nom, description FROM magic_items
  WHERE nom ILIKE '%carquois%' AND description ILIKE '%+1%'
`) as any[]
console.log(`\nContrôle — lignes de carquois dont la description mentionne encore « +1 » : ${residus.length}`)
for (const r of residus) console.log(`  [${r.id}] ${r.nom}`)

process.exit(ok ? 0 : 1)

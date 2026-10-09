/**
 * FUSION DES 3 DOUBLONS D'OBJETS MAGIQUES — décision d'André (DM, 2026-10-09) :
 * « 3. Tu peux fusionner ces 3 doublons. »
 *
 *   [52] « Anneau  de jade +2 »    → [18] « Anneau de jade »
 *   [72] « Anneaux protection +2 » → [2]  « Anneau de protection +2 »
 *   [55] « Gants de dextérité »    → [5]  « Gantelets de dextérité +2 »
 *
 * DIRECTION : la cible est, dans les trois cas, la ligne qui porte les champs
 * STRUCTURÉS (type, bonus, NLS, aura) et le nom le plus propre — la source ne
 * porte qu'un nom fautif (double espace, pluriel) ou un modèle indéterminé.
 * La description de la source (ma fiche de règle) est reversée dans la cible,
 * écrite à la main ci-dessous : une fusion ne doit rien perdre.
 *
 * ⚠ CHAQUE PAIRE A UN PORTEUR DE CHAQUE CÔTÉ, et aucun personnage ne porte les
 * deux — le repointage est donc d'une ligne par paire, sans doublon à arbitrer
 * (contrairement à la fusion de compétences du 2026-10-08).
 *
 * ⚠⚠ CONSÉQUENCE MESURÉE SUR LES FICHES, signalée à André : la CA du Grimoire
 * additionne le champ `bonus` de TOUS les objets magiques
 * (src/app/personnage/[id]/page.tsx:122). Les sources portaient bonus = NULL,
 * les cibles portent bonus = 2. La fusion ajoute donc +2 à la CA de Rham,
 * de Gaïa et de Tellian Fore. Pour les deux anneaux de protection c'est juste
 * (bonus de parade). Pour les gants de Dextérité c'est DOUTEUX : +2 de Dex
 * vaut +1 de CA, pas +2 — défaut de calcul préexistant (Cormac le porte déjà
 * avec, en plus, dex_magique = 2 saisi). Rien n'est corrigé ici : la CA d'un
 * personnage est une décision de MJ, et André a écrit « On ne touchera pas ces
 * objets qui appartiennent déjà à un personnage ».
 *
 * Usage : npx tsx menage-references/p15-fusion-doublons.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

type Fusion = {
  src: number; srcNom: string; cib: number; cibNom: string
  motif: string; description: string; catalogueId?: number
}

const FUSIONS: Fusion[] = [
  {
    src: 52, srcNom: 'Anneau  de jade +2',
    cib: 18, cibNom: 'Anneau de jade',
    motif: "[18] porte le type, le bonus et l'effet que le MJ a donné à l'objet (« protection +2 et protection contre le feu ») ; [52] n'a qu'un nom à double espace et ma note de scribe.",
    description: [
      'Protection +2 et protection contre le feu. *(saisie du MJ)*',
      '',
      "🗃️ Anneau de la campagne : aucun « anneau de jade » ne figure au Guide du Maître. L'effet ci-dessus est celui que le MJ lui a donné ; le Grimoire compte son bonus de +2 dans la CA, comme le bonus de parade d'un anneau de protection.",
      '',
      'Règle des anneaux : on ne peut porter que deux anneaux magiques à la fois ; un troisième ne fonctionne pas.',
      '',
      '*Fusion du 2026-10-09, sur décision d\u2019André : la ligne « Anneau de jade +2 » désignait le même objet et a été repointée ici.*',
    ].join('\n'),
  },
  {
    src: 72, srcNom: 'Anneaux protection +2',
    cib: 2, cibNom: 'Anneau de protection +2',
    motif: "[2] porte le type, le bonus, le niveau de lanceur, l'aura et le nom officiel au singulier ; [72] est un pluriel fautif sans aucun champ structuré.",
    description: [
      'Confère un bonus de déviation de +2 à la CA. *(saisie du MJ)*',
      '',
      "C'est le modèle +2 de la série du Guide du Maître : 8 000 po ; Abjuration modérée ; NLS 5. Le livre nomme ce bonus **bonus de parade** — il s'applique aussi contre les attaques de contact et compte même lorsque le porteur est pris au dépourvu. La série complète va de +1 à +5.",
      '',
      'Règle des anneaux : on ne peut porter que deux anneaux magiques à la fois ; un troisième ne fonctionne pas.',
      '',
      '*Fusion du 2026-10-09, sur décision d\u2019André : la ligne « Anneaux protection +2 » désignait la même pièce et a été repointée ici.*',
    ].join('\n'),
  },
  {
    src: 55, srcNom: 'Gants de dextérité',
    cib: 5, cibNom: 'Gantelets de dextérité +2',
    motif: '[5] porte le type, le bonus, le niveau de lanceur, l\u2019aura — et surtout il NOMME le modèle (+2), que [55] laissait indéterminé entre +2, +4 et +6.',
    catalogueId: 592, // « Gants de Dextérité +2 » du Guide du Maître (4 000 po), déjà au catalogue
    description: [
      'Augmente la DEX de +2. *(saisie du MJ)*',
      '',
      "**Gants de Dextérité** du Guide du Maître : ces gants de cuir souple extrêmement moulants permettent de manipuler les objets les plus délicats. De plus, ils améliorent la Dextérité de leur porteur, sous la forme d'un bonus d'altération variable s'appliquant à cette caractéristique. **Il faut porter les deux gants** pour profiter de ce bonus. Le livre en donne trois modèles — +2 (4 000 po), +4 (16 000 po) et +6 (36 000 po) ; cette ligne est le modèle **+2**.",
      '',
      'Transmutation modérée ; NLS 8 ; Création d\u2019objets merveilleux, grâce féline.',
      '',
      "⚠ Un bonus de Dextérité n'est pas un bonus de CA : +2 de Dextérité vaut +1 à la CA, +1 à l'initiative et +1 aux jets de Réflexes. Le Grimoire, lui, ajoute le +2 de cette ligne directement à la CA. À vérifier avec le MJ sur les fiches qui portent ces gants.",
      '',
      '*Fusion du 2026-10-09, sur décision d\u2019André : la ligne « Gants de dextérité » désignait la même pièce et a été repointée ici.*',
    ].join('\n'),
  },
]

const ARCHIVE = 'X:/Claude-Tools/cormac/menage-references/p15-fusion-etat-avant.json'
const archive: unknown[] = []
let aEcrire = 0

for (const f of FUSIONS) {
  console.log(`\n==================== [${f.src}] → [${f.cib}] ====================`)
  const src = (await sql`SELECT * FROM magic_items WHERE id = ${f.src}`)[0] as any
  const cib = (await sql`SELECT * FROM magic_items WHERE id = ${f.cib}`)[0] as any

  // --- Idempotence : la source a déjà disparu ------------------------------
  if (!src) {
    const reste = (await sql`SELECT count(*)::int AS n FROM magic_items WHERE nom = ${f.srcNom}`)[0] as any
    console.log(`✅ Déjà fusionné : [${f.src}] n'existe plus (${reste.n} ligne nommée « ${f.srcNom} »).`)
    continue
  }

  // --- Garde-fous ----------------------------------------------------------
  if (src.nom !== f.srcNom) throw new Error(`REFUS : [${f.src}] se nomme « ${src.nom} », pas « ${f.srcNom} » — la table a bougé depuis l'écriture du script.`)
  if (!cib) throw new Error(`REFUS : la cible [${f.cib}] est absente.`)
  if (cib.nom !== f.cibNom) throw new Error(`REFUS : [${f.cib}] se nomme « ${cib.nom} », pas « ${f.cibNom} ».`)

  const pointent = (await sql`SELECT id, nom FROM magic_items WHERE catalogue_id = ${f.src}`) as any[]
  if (pointent.length) throw new Error(`REFUS : ${pointent.length} ligne(s) ont catalogue_id = ${f.src} : ${JSON.stringify(pointent)}`)

  const pSrc = (await sql`SELECT cmi.*, c.nom AS perso FROM character_magic_items cmi JOIN characters c ON c.id = cmi.personnage_id WHERE cmi.objet_id = ${f.src}`) as any[]
  const pCib = (await sql`SELECT cmi.*, c.nom AS perso FROM character_magic_items cmi JOIN characters c ON c.id = cmi.personnage_id WHERE cmi.objet_id = ${f.cib}`) as any[]
  const doubles = pSrc.filter(a => pCib.some(b => b.personnage_id === a.personnage_id))
  if (doubles.length) throw new Error(`REFUS : ${doubles.length} personnage(s) portent LES DEUX lignes — c'est un doublon à arbitrer, pas un repointage : ${JSON.stringify(doubles.map(d => d.perso))}`)

  if (f.catalogueId) {
    const cat = (await sql`SELECT id, nom, est_catalogue FROM magic_items WHERE id = ${f.catalogueId}`)[0] as any
    if (!cat) throw new Error(`REFUS : l'entrée de catalogue [${f.catalogueId}] est absente.`)
    if (!cat.est_catalogue) throw new Error(`REFUS : [${f.catalogueId}] « ${cat.nom} » n'est pas une entrée de catalogue.`)
    console.log(`   📖 rattachement prévu : [${f.cib}] → [${cat.id}] « ${cat.nom} »`)
  }

  const delta = (cib.bonus ?? 0) - (src.bonus ?? 0)
  console.log(`   motif : ${f.motif}`)
  console.log(`   porteurs à repointer (${pSrc.length}) : ${pSrc.map(p => `${p.perso}#${p.personnage_id} [cmi:${p.id}]`).join(', ') || 'aucun'}`)
  console.log(`   CA : bonus source = ${src.bonus ?? 'NULL'} → bonus cible = ${cib.bonus ?? 'NULL'}  ⇒ ${pSrc.map(p => `${p.perso} ${delta >= 0 ? '+' : ''}${delta} de CA`).join(', ') || '—'}`)

  archive.push({ fusion: `${f.src}->${f.cib}`, source: src, cible_avant: cib, porteurs_source: pSrc, porteurs_cible: pCib })
  aEcrire++

  if (!ECRIRE) { console.log('   (lecture seule — rien écrit)'); continue }

  for (const p of pSrc) await sql`UPDATE character_magic_items SET objet_id = ${f.cib} WHERE id = ${p.id}`
  await sql`UPDATE magic_items SET description = ${f.description} WHERE id = ${f.cib}`
  if (f.catalogueId) await sql`UPDATE magic_items SET catalogue_id = ${f.catalogueId} WHERE id = ${f.cib}`
  await sql`DELETE FROM magic_items WHERE id = ${f.src}`
  console.log(`   ✍  ${pSrc.length} porteur(s) repointé(s), description de [${f.cib}] réécrite, [${f.src}] supprimée.`)
}

if (ECRIRE && archive.length) {
  fs.writeFileSync(ARCHIVE + '.tmp', JSON.stringify(archive, null, 2), 'utf8')
  fs.renameSync(ARCHIVE + '.tmp', ARCHIVE)
  console.log(`\n📦 État d'avant archivé dans ${ARCHIVE}`)
}

// --- Contrôle final --------------------------------------------------------
console.log('\n==================== CONTRÔLE ====================')
const orphelins = (await sql`SELECT cmi.id, cmi.objet_id FROM character_magic_items cmi LEFT JOIN magic_items mi ON mi.id = cmi.objet_id WHERE mi.id IS NULL`) as any[]
console.log(`lignes de fiche orphelines : ${orphelins.length} ${orphelins.length ? JSON.stringify(orphelins) : '✅'}`)
for (const f of FUSIONS) {
  const n = (await sql`SELECT count(*)::int AS n FROM magic_items WHERE id = ${f.src}`)[0] as any
  const p = (await sql`SELECT c.nom FROM character_magic_items cmi JOIN characters c ON c.id = cmi.personnage_id WHERE cmi.objet_id = ${f.cib}`) as any[]
  console.log(`[${f.src}] présente ? ${n.n ? '⚠ OUI' : 'non ✅'}   —   « ${f.cibNom} » porté par ${p.length} : ${p.map(x => x.nom).join(', ')}`)
}
const total = (await sql`SELECT count(*)::int AS n FROM magic_items`)[0] as any
console.log(`magic_items : ${total.n} lignes`)
if (!ECRIRE) console.log(`\n→ ${aEcrire} fusion(s) prête(s). Relancer avec --ecrire.`)

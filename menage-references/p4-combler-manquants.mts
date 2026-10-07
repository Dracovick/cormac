// Phase 2 — sorts du Manuel absents de la base APRÈS le semis p3, constatés par la
// campagne des descriptions (p4-fiches-appliquer : « sans correspondance en base »).
//
// Pourquoi le semis p3 les a manqués : il est bâti sur les listes de CLASSE du
// chapitre 11. Quatre de ces sorts n'y figurent pas — ce sont des sorts de DOMAINE
// (niveau 4 de Bien, Loi, Chaos, Mal), vérifiés à l'image sur leur page :
//   Châtiment sacré  p. 211 « Niveau : Bien 4 »   | Courroux de l'ordre p. 223 « Niveau : Loi 4 »
//   Marteau du Chaos p. 257 « Niveau : Chaos 4 »  | Ténèbres maudites   p. 296 « Niveau : Mal 4 »
// Le cinquième est un cas de nom doublé dans le livre : la liste d'Ensorceleur/magicien
// imprime « Contrôle des morts-vivants » aux niveaux 2 ET 7. La page 217 tranche :
//   « Contrôle des morts-vivants » → Ens/Mag 7   (la base portait 2 — corrigé ici)
//   « Contrôle mineur des morts-vivants » → Ens/Mag 2   (créé ici)
//
// Les fiches (école, portée, durée, description…) ne sont PAS écrites par ce script :
// elles arrivent par p4-fiches-appliquer.mts, qui est la source unique des relevés.
//
// Usage : npx tsx menage-references/p4-combler-manquants.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

// nom → niveaux de classe à poser (vide = sort de domaine, aucune classe générale)
const A_CREER: Array<{ nom: string; note: string; niveaux: Array<[string, number]> }> = [
  { nom: 'Châtiment sacré', note: 'domaine Bien 4 (p. 211)', niveaux: [] },
  { nom: "Courroux de l'ordre", note: 'domaine Loi 4 (p. 223)', niveaux: [] },
  { nom: 'Marteau du Chaos', note: 'domaine Chaos 4 (p. 257)', niveaux: [] },
  { nom: 'Ténèbres maudites', note: 'domaine Mal 4 (p. 296)', niveaux: [] },
  { nom: 'Contrôle mineur des morts-vivants', note: 'Ens/Mag 2 (p. 217)', niveaux: [['Ensorceleur', 2], ['Magicien', 2]] },
]

const classes = await sql`select id, nom from classes` as any[]
const idClasse = new Map(classes.map((c: any) => [norm(c.nom), c.id]))

const deja = await sql`select id, nom from spells` as any[]
const parNom = new Map(deja.map((s: any) => [norm(s.nom), s]))

for (const s of A_CREER) {
  const vu = parNom.get(norm(s.nom))
  if (vu) { console.log(`déjà en base, rien à faire : [${vu.id}] ${vu.nom}`); continue }
  if (!appliquer) { console.log(`à créer : ${s.nom} — ${s.note}`); continue }
  const r = await sql`insert into spells (nom) values (${s.nom}) returning id` as any[]
  const id = r[0].id
  for (const [classe, niveau] of s.niveaux) {
    const cid = idClasse.get(norm(classe))
    if (!cid) { console.error(`✖ classe inconnue : ${classe}`); process.exit(1) }
    await sql`insert into spell_class_levels (sort_id, classe_id, niveau) values (${id}, ${cid}, ${niveau})`
  }
  console.log(`✅ créé [${id}] ${s.nom} — ${s.note}`)
}

// Correction du niveau de « Contrôle des morts-vivants » : Ens/Mag 2 → 7 (p. 217).
const cible = await sql`select id from spells where nom = 'Contrôle des morts-vivants'` as any[]
if (cible.length !== 1) { console.error(`✖ attendu 1 « Contrôle des morts-vivants », trouvé ${cible.length}`); process.exit(1) }
const avant = await sql`select c.nom classe, scl.niveau from spell_class_levels scl
  join classes c on c.id = scl.classe_id where scl.sort_id = ${cible[0].id} order by c.nom` as any[]
console.log(`\n[${cible[0].id}] Contrôle des morts-vivants — avant : ${avant.map((a: any) => `${a.classe} ${a.niveau}`).join(', ')}`)
if (appliquer) {
  const r = await sql`update spell_class_levels set niveau = 7
    where sort_id = ${cible[0].id} and niveau = 2 returning sort_id` as any[]
  const apres = await sql`select c.nom classe, scl.niveau from spell_class_levels scl
    join classes c on c.id = scl.classe_id where scl.sort_id = ${cible[0].id} order by c.nom` as any[]
  console.log(`  ${r.length} ligne(s) corrigée(s) — après : ${apres.map((a: any) => `${a.classe} ${a.niveau}`).join(', ')}`)
}

const tot = await sql`select count(*)::int n from spells` as any[]
console.log(`\nspells : ${tot[0].n}${appliquer ? '' : '  (aperçu — relancer avec --appliquer)'}`)

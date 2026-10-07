// Phase 2 — éclatement des quatre familles de sorts d'alignement (GO d'André, 2026-10-07).
//
// Le Manuel donne une FICHE PAR VERSION (p. 209-210, 229-231, 276, 282), mais les listes
// de classe du chapitre 11 impriment une seule ligne groupée — « Protection contre la
// Loi/le Bien/le Chaos/le Mal ». Le semis a donc créé une entrée groupée par famille,
// pendant que la liste de Paladin, qui nomme ses versions une par une, en créait d'autres
// séparées. Résultat : 11 entrées pour 16 sorts, et les niveaux d'une même version
// éparpillés sur deux lignes.
//
// Ce script porte la base à 16 sorts distincts :
//   - l'entrée groupée est RENOMMÉE en la version dont elle porte déjà le texte (contre
//     la Loi / de la Loi), et perd la note « quatre versions » que j'y avais ajoutée;
//   - son école généralisée « Abjuration [Loi, Bien, Chaos ou Mal] » est vidée pour que
//     p4-fiches-appliquer y remette le descripteur exact du livre;
//   - les versions manquantes sont créées;
//   - les niveaux de la ligne groupée (Prêtre, Ens/Mag) sont recopiés sur les QUATRE
//     versions, puisque la liste de classe les leur donne à toutes.
//
// ⚠ Les niveaux de Paladin ne sont PAS recopiés : la liste de Paladin ne nomme que les
// versions « contre le Chaos » et « contre le Mal » — un paladin ne lance pas un sort
// contre le Bien ou contre la Loi. Ces niveaux restent où ils sont.
// ⚠ Rien n'est supprimé : [32] Protection contre le Mal est porté par 4 personnages.
//
// Usage : npx tsx menage-references/p5-eclater-alignement.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

type Famille = { groupee: string; renommerEn: string; versions: string[] }
const FAMILLES: Famille[] = [
  { groupee: 'Cercle magique contre la Loi/le Bien/le Chaos/le Mal', renommerEn: 'Cercle magique contre la Loi',
    versions: ['Cercle magique contre la Loi', 'Cercle magique contre le Bien', 'Cercle magique contre le Chaos', 'Cercle magique contre le Mal'] },
  { groupee: 'Détection de la Loi/du Bien/du Chaos/du Mal', renommerEn: 'Détection de la Loi',
    versions: ['Détection de la Loi', 'Détection du Bien', 'Détection du Chaos', 'Détection du Mal'] },
  { groupee: 'Protection contre la Loi/le Bien/le Chaos/le Mal', renommerEn: 'Protection contre la Loi',
    versions: ['Protection contre la Loi', 'Protection contre le Bien', 'Protection contre le Chaos', 'Protection contre le Mal'] },
  { groupee: 'Rejet de la Loi/du Bien/du Chaos/du Mal', renommerEn: 'Rejet de la Loi',
    versions: ['Rejet de la Loi', 'Rejet du Bien', 'Rejet du Chaos', 'Rejet du Mal'] },
]

const tous = await sql`SELECT id, nom, ecole, description FROM spells` as any[]
const parNom = new Map(tous.map((s: any) => [norm(s.nom), s]))

let renommees = 0, creees = 0, niveauxPoses = 0
for (const f of FAMILLES) {
  const g = parNom.get(norm(f.groupee))
  if (!g) { console.log(`⏭  entrée groupée absente (déjà éclatée?) : ${f.groupee}`); continue }

  // Les niveaux de la ligne groupée valent pour les quatre versions.
  const universels = await sql`SELECT classe_id, niveau FROM spell_class_levels WHERE sort_id = ${g.id}` as any[]
  const classesDb = await sql`SELECT id, nom FROM classes` as any[]
  const nomClasse = new Map(classesDb.map((c: any) => [c.id, c.nom]))
  console.log(`\n━━ ${f.groupee}  [${g.id}]`)
  console.log(`   niveaux de la ligne groupée (valent pour les 4) : ${universels.map((u: any) => `${nomClasse.get(u.classe_id)} ${u.niveau}`).join(', ') || '—'}`)

  // 1) Renommer la groupée, nettoyer la note et l'école généralisée.
  const conflit = parNom.get(norm(f.renommerEn))
  if (conflit && conflit.id !== g.id) { console.error(`✖ « ${f.renommerEn} » existe déjà en [${conflit.id}] — renommage impossible`); process.exit(1) }
  const sansNote = String(g.description ?? '').replace(/^\*Le Manuel décrit ce sort en quatre versions[^*]*\*\s*/u, '').trim()
  // On ne vide que le descripteur généralisé que j'avais écrit moi-même; une école
  // saisie par André ou venue du livre n'est pas touchée (consigne : ne rien écraser).
  const ecoleGeneralisee = /\[Loi, Bien, Chaos ou Mal\]/.test(String(g.ecole ?? ''))
  const ecole = ecoleGeneralisee ? null : g.ecole
  console.log(`   renommer → « ${f.renommerEn} », école ${ecoleGeneralisee ? `vidée (${g.ecole}) pour que le livre y remette le bon descripteur` : `gardée (${g.ecole})`}, note « quatre versions » retirée`)
  if (appliquer) await sql`UPDATE spells SET nom = ${f.renommerEn}, ecole = ${ecole}, description = ${sansNote || null} WHERE id = ${g.id}`
  renommees++

  // 2) Créer les versions absentes, 3) poser les niveaux universels sur les quatre.
  for (const v of f.versions) {
    let ligne = v === f.renommerEn ? g : parNom.get(norm(v))
    if (!ligne) {
      console.log(`   créer   « ${v} »`)
      if (appliquer) {
        const r = await sql`INSERT INTO spells (nom) VALUES (${v}) RETURNING id` as any[]
        ligne = { id: r[0].id, nom: v }
      } else { ligne = { id: -1, nom: v } }
      creees++
    }
    if (!appliquer) continue
    for (const u of universels) {
      const deja = await sql`SELECT 1 FROM spell_class_levels WHERE sort_id = ${ligne.id} AND classe_id = ${u.classe_id}` as any[]
      if (deja.length) continue
      await sql`INSERT INTO spell_class_levels (sort_id, classe_id, niveau) VALUES (${ligne.id}, ${u.classe_id}, ${u.niveau})`
      niveauxPoses++
    }
  }
}

console.log(`\n${appliquer ? '' : '[APERÇU] '}groupées renommées : ${renommees} | versions créées : ${creees} | niveaux posés : ${niveauxPoses}`)
if (appliquer) {
  const noms = FAMILLES.flatMap(f => f.versions)
  const bilan = await sql`SELECT s.id, s.nom, s.ecole,
    (SELECT string_agg(c.nom||' '||scl.niveau, ', ' ORDER BY c.nom) FROM spell_class_levels scl JOIN classes c ON c.id=scl.classe_id WHERE scl.sort_id=s.id) classes,
    (SELECT count(*)::int FROM character_spells cs WHERE cs.sort_id=s.id) porteurs
    FROM spells s WHERE s.nom = ANY(${noms}) ORDER BY s.nom` as any[]
  console.log(`\nLes 16 versions (${bilan.length} trouvées) :`)
  for (const b of bilan) console.log(`  [${b.id}] ${b.nom} — ${b.ecole ?? '(école à remplir)'} | ${b.classes ?? 'aucune classe'}${b.porteurs ? ` | ${b.porteurs} porteur(s)` : ''}`)
  const restes = await sql`SELECT id, nom FROM spells WHERE nom LIKE '%/le Bien/le Chaos/le Mal' OR nom LIKE '%/du Bien/du Chaos/du Mal'` as any[]
  console.log(`\nentrées groupées restantes : ${restes.length}`)
}

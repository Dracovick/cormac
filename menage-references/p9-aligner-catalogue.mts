/**
 * Deux corrections sur le catalogue d'armes publié, avant de régénérer la liste
 * du formulaire.
 *
 * 1. ORTHOGRAPHE DE DEUX NOMS. Le semis p7 a adopté des lignes d'André plutôt
 *    que d'en créer des jumelles — elles ont donc gardé son orthographe :
 *    « Arbalète Légère » (majuscule) et « Masse d’armes lourde » (apostrophe
 *    typographique U+2019). La seconde a déjà fait refuser deux rattachements
 *    le 2026-10-08 : `normaliserNom` replie la casse et les accents, mais PAS
 *    l'apostrophe. Le catalogue est publié comme la référence du Manuel : il
 *    porte l'orthographe du Manuel. Les liens suivent l'id, rien ne se perd.
 *
 * 2. TROIS POIDS EN LIVRES ANGLAISES. Masse d'armes lourde, Arbalète lourde et
 *    Hache de guerre naine portent 8,00 dans une colonne en kilos : ce sont les
 *    8 livres de la version originale, recopiées sans conversion. Le livre dit
 *    4 kg. Ce n'est pas cosmétique — ça compte dans l'encombrement.
 *
 * Idempotent : un second passage n'écrit rien. Refuse d'écrire si la valeur
 * trouvée n'est pas celle attendue (quelqu'un est passé entre-temps).
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const RENOMMAGES = [
  { id: 14,  attendu: 'Arbalète Légère',       voulu: 'Arbalète légère' },
  { id: 174, attendu: 'Masse d\u2019armes lourde', voulu: "Masse d'armes lourde" },
]

const POIDS = [
  { nom: "Masse d'armes lourde",  attendu: 8, voulu: 4 },
  { nom: 'Arbalète lourde',       attendu: 8, voulu: 4 },
  { nom: 'Hache de guerre naine', attendu: 8, voulu: 4 },
]

let ecrits = 0, deja = 0, refuses = 0

console.log('── 1. Orthographe des noms de catalogue ──')
for (const r of RENOMMAGES) {
  const [ligne] = await sql`SELECT id, nom, est_catalogue FROM weapons WHERE id = ${r.id}` as any[]
  if (!ligne) { console.log(`  ⛔ [${r.id}] introuvable`); refuses++; continue }
  if (ligne.nom === r.voulu) { console.log(`  = [${r.id}] déjà « ${r.voulu} »`); deja++; continue }
  if (ligne.nom !== r.attendu) {
    console.log(`  ⛔ [${r.id}] porte « ${ligne.nom} », attendu « ${r.attendu} » — rien écrit`)
    refuses++; continue
  }
  if (!ligne.est_catalogue) { console.log(`  ⛔ [${r.id}] n'est pas une entrée de catalogue — rien écrit`); refuses++; continue }
  await sql`UPDATE weapons SET nom = ${r.voulu} WHERE id = ${r.id}`
  console.log(`  ✓ [${r.id}] « ${ligne.nom} » → « ${r.voulu} »`)
  ecrits++
}

console.log('\n── 2. Poids en livres anglaises → kg ──')
for (const p of POIDS) {
  const lignes = await sql`SELECT id, nom, poids FROM weapons WHERE est_catalogue AND nom = ${p.nom}` as any[]
  if (lignes.length !== 1) { console.log(`  ⛔ « ${p.nom} » : ${lignes.length} entrée(s) de catalogue — rien écrit`); refuses++; continue }
  const l = lignes[0]
  const actuel = l.poids === null ? null : Number(l.poids)
  if (actuel === p.voulu) { console.log(`  = [${l.id}] ${p.nom} déjà à ${p.voulu} kg`); deja++; continue }
  if (actuel !== p.attendu) {
    console.log(`  ⛔ [${l.id}] ${p.nom} porte ${actuel} kg, attendu ${p.attendu} — rien écrit`)
    refuses++; continue
  }
  await sql`UPDATE weapons SET poids = ${p.voulu} WHERE id = ${l.id}`
  console.log(`  ✓ [${l.id}] ${p.nom} : ${actuel} → ${p.voulu} kg`)
  ecrits++
}

console.log(`\nécrits=${ecrits}  déjà bons=${deja}  refusés=${refuses}`)

// Contrôle : plus aucune apostrophe typographique ni poids à 8 au catalogue.
const reste = await sql`
  SELECT id, nom, poids FROM weapons
  WHERE est_catalogue AND (nom LIKE '%' || chr(8217) || '%' OR poids = 8)` as any[]
console.log(`contrôle final — entrées de catalogue restant à problème : ${reste.length}`)
for (const r of reste) console.log(`  [${r.id}] « ${r.nom} » poids=${r.poids}`)

// Niveau manquant constaté en instruisant le dossier des quasi-doublons (2026-10-07).
// Page 289 du Manuel, lue à l'image : « Soins intensifs de groupe — Niveau : Dru 9,
// Guérison 8, Prê 8 ». La base ne lui donnait que Druide 9 : le niveau de prêtre était
// parti sur [1125] « Soins critiques de groupe », nom employé par la liste de classe du
// chapitre 11 pour le MÊME sort (le chapitre écrit « intensifs », la liste « critiques »).
// On rend son niveau de prêtre au sort réel. [1125] n'est pas touché — sa suppression
// est une décision d'André.
// Usage : npx tsx menage-references/p5-niveau-manquant.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')

const s = (await sql`SELECT id, nom FROM spells WHERE nom = 'Soins intensifs de groupe'` as any[])[0]
const c = (await sql`SELECT id FROM classes WHERE nom = 'Prêtre'` as any[])[0]
if (!s || !c) { console.error('✖ sort ou classe introuvable'); process.exit(1) }
const deja = await sql`SELECT niveau FROM spell_class_levels WHERE sort_id = ${s.id} AND classe_id = ${c.id}` as any[]
if (deja.length) { console.log(`rien à faire : [${s.id}] ${s.nom} a déjà Prêtre ${deja[0].niveau}`); process.exit(0) }
console.log(`[${s.id}] ${s.nom} → ajouter Prêtre 8 (p. 289)`)
if (appliquer) {
  await sql`INSERT INTO spell_class_levels (sort_id, classe_id, niveau) VALUES (${s.id}, ${c.id}, 8)`
  const apres = await sql`SELECT c.nom, scl.niveau FROM spell_class_levels scl JOIN classes c ON c.id = scl.classe_id
    WHERE scl.sort_id = ${s.id} ORDER BY c.nom` as any[]
  console.log(`  après : ${apres.map((a: any) => `${a.nom} ${a.niveau}`).join(', ')}`)
} else console.log('[APERÇU] relancer avec --appliquer')

/**
 * MESURE — l'écart entre les oraisons que le Grimoire affiche et celles du livre.
 *
 *   npx tsx scripts/mesure-oraisons-vs-livre.mts
 *
 * ⚠ Ce script NE CORRIGE RIEN : il chiffre le dossier des tables d'emplacements
 * de base (signalé à André le 24 octobre 2026, toujours son arbitrage). Il est né
 * de sa question du 12 novembre sur les oraisons de Bram Verrelune [99].
 *
 * ⭐ Les colonnes « 0 » attendues sont RECOPIÉES des tables du Manuel des Joueurs
 * relevées à l'image — prêtre table 3-14 p. 50, druide table 3-6 p. 31 — et non
 * recalculées. Le magicien sert de témoin : sa colonne est bien celle que le
 * Grimoire applique, ce qui désigne la cause (une table de magicien servie à
 * toutes les classes à neuf niveaux de sorts).
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getEmplacementsNiveau } from '../src/lib/dnd35/classes'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
const sql = neon(url!)

// Colonne « 0 » (oraisons) du livre, indexée par niveau de classe 1 → 20.
const ORAISONS_LIVRE: Record<string, number[]> = {
  // Table 3-14 : le prêtre, p. 50 — relevée à l'image.
  'Prêtre': [3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  // Table 3-6 : le druide, p. 31 — relevée à l'image.
  'Druide': [3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
}

const rows = await sql`
  SELECT c.id, c.nom, cl.nom AS classe, cc.niveau
  FROM characters c
  JOIN character_classes cc ON cc.personnage_id = c.id
  JOIN classes cl ON cl.id = cc.classe_id
  WHERE cl.nom IN ('Prêtre', 'Druide')
  ORDER BY c.id
` as { id: number; nom: string; classe: string; niveau: number }[]

let ecarts = 0, conformes = 0
const manquantes: string[] = []
for (const r of rows) {
  const attendu = ORAISONS_LIVRE[r.classe]?.[Math.min(Math.max(r.niveau, 1), 20) - 1]
  const affiche = getEmplacementsNiveau(r.classe, r.niveau, 0)
  if (attendu === undefined) continue
  if (attendu === affiche) { conformes++; continue }
  ecarts++
  manquantes.push(`  [${r.id}] ${r.nom} — ${r.classe} ${r.niveau} : ${affiche} affichée(s), ${attendu} au livre (${attendu - affiche > 0 ? '−' : '+'}${Math.abs(attendu - affiche)})`)
}

console.log('ORAISONS — Grimoire contre livre, prêtres et druides\n')
console.log(manquantes.join('\n'))
console.log(`\n${ecarts} ligne(s) en écart, ${conformes} conforme(s), sur ${rows.length} relevée(s).`)
console.log(`Total d'oraisons manquantes : ${rows.reduce((s, r) => {
  const a = ORAISONS_LIVRE[r.classe]?.[Math.min(Math.max(r.niveau, 1), 20) - 1]
  return a === undefined ? s : s + Math.max(0, a - getEmplacementsNiveau(r.classe, r.niveau, 0))
}, 0)}`)

// Témoin : le magicien, lui, est conforme — c'est ce qui désigne la cause.
const MAGICIEN_LIVRE = [3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
const magEcarts = MAGICIEN_LIVRE.filter((a, i) => a !== getEmplacementsNiveau('Magicien', i + 1, 0)).length
console.log(`\n⭐ Témoin — magicien : ${magEcarts} écart(s) sur 20 niveaux (la table servie est la sienne).`)

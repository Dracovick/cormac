// Phase 2 — nettoyage des libellés imprimés restés en tête de `zone_effet`.
//
// Le Manuel intitule cette ligne de plusieurs façons selon le sort : « Cible », « Cibles »,
// « Effet », « Zone d'effet », et toutes leurs combinaisons (« Cible ou zone d'effet »,
// « Cibles ou effet », « Cible/effet »…). Le premier nettoyage ne couvrait que les formes
// simples; celui-ci généralise. La page de la Bibliothèque affiche déjà son propre
// intitulé « Zone d'effet / cible » — garder le libellé le ferait lire deux fois.
//
// Cas à part traité ici : [245] Fureur vertueuse des fidèles, dont la valeur avait avalé
// la ligne « Durée : » du livre alors que la colonne duree était vide. La durée est
// remise à sa place; la zone reste tronquée (le rayon manque) — à reprendre au relevé
// du supplément dont ce sort est tiré.
//
// Usage : npx tsx menage-references/p4-zones-nettoyer.mts [--appliquer]
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const appliquer = process.argv.includes('--appliquer')

// un ou plusieurs mots-libellés reliés par « ou », « / » ou « , », suivis de « : »
const MOT = String.raw`(?:cibles?|effets?|zone\s+d['’]effet)`
const LIBELLE = new RegExp(String.raw`^${MOT}(?:\s*(?:ou|/|,)\s*${MOT})*\s*:\s*`, 'i')

const lignes = await sql`SELECT id, nom, zone_effet, duree FROM spells
  WHERE zone_effet IS NOT NULL AND trim(zone_effet) <> ''` as any[]

let nettoyees = 0
for (const s of lignes) {
  const sansLibelle = String(s.zone_effet).replace(LIBELLE, '').trim()
  if (sansLibelle === s.zone_effet || !sansLibelle) continue
  console.log(`[${s.id}] ${s.nom}\n    avant : ${s.zone_effet}\n    après : ${sansLibelle}`)
  if (appliquer) await sql`UPDATE spells SET zone_effet = ${sansLibelle} WHERE id = ${s.id}`
  nettoyees++
}

// Cas particulier : la durée avalée par la zone d'effet.
const fureur = await sql`SELECT id, nom, zone_effet, duree FROM spells WHERE id = 245` as any[]
if (fureur.length === 1) {
  const f = fureur[0]
  const m = String(f.zone_effet ?? '').match(/^(.*?)\s*Durée\s*:\s*(.+)$/i)
  if (m && (f.duree === null || String(f.duree).trim() === '')) {
    console.log(`\n[245] ${f.nom} — la ligne « Durée » du livre avait été avalée par la zone d'effet`)
    console.log(`    zone  → ${m[1].trim()}   ⚠ tronquée (le rayon manque) — à reprendre au relevé`)
    console.log(`    durée → ${m[2].trim()}`)
    if (appliquer) await sql`UPDATE spells SET zone_effet = ${m[1].trim()}, duree = ${m[2].trim()} WHERE id = 245`
  } else {
    console.log(`\n[245] ${f.nom} — rien à déplacer (déjà corrigé ou durée non vide)`)
  }
}

const reste = await sql`SELECT count(*)::int n FROM spells WHERE zone_effet ~* ${'^' + MOT}` as any[]
console.log(`\n${appliquer ? '' : '[APERÇU] '}valeurs nettoyées : ${nettoyees} | commençant encore par un mot-libellé : ${reste[0].n}`)

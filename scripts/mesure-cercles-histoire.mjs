/**
 * Relève, dans l'histoire déposée de DracoVick [4], tout ce qui parle de
 * « cercle » — pour vérifier qu'aucune phrase ne contredit la table de la
 * conversion 3.5 (dix cercles, pas cinq).
 *
 *   node scripts/mesure-cercles-histoire.mjs
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
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

const chapitres = await sql`
  SELECT ordre, titre, contenu FROM character_story_chapters
  WHERE personnage_id = 4 ORDER BY ordre`

const MOTIFS = [/cinqui[èe]me/i, /cinq cercles/i, /\bcinq\b/i, /huiti[èe]me cercle/i, /s'arr[êe]te/i]
let n = 0
for (const ch of chapitres) {
  for (const phrase of ch.contenu.split(/(?<=[.!?])\s+/)) {
    if (MOTIFS.some(m => m.test(phrase))) {
      n++
      console.log(`\n[ch.${ch.ordre} ${ch.titre}]\n  ${phrase.trim()}`)
    }
  }
}
console.log(`\n=== ${n} phrases relevées sur ${chapitres.length} chapitres ===`)

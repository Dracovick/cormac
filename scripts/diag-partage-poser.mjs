/* Pose ou retire un partage d'essai sur un personnage, pour les diagnostics.
 *   node scripts/diag-partage-poser.mjs 98 zzdiagabcdefghijkmnpqrst
 *   node scripts/diag-partage-poser.mjs --retirer zzdiagabcdefghijkmnpqrst
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
const sql = neon(url)

if (process.argv[2] === '--retirer') {
  const jeton = process.argv[3]
  const r = await sql`delete from character_story_shares where jeton = ${jeton} returning personnage_id`
  console.log('retiré :', JSON.stringify(r))
} else {
  const id = Number(process.argv[2])
  const jeton = process.argv[3]
  await sql`delete from character_story_shares where personnage_id = ${id}`
  await sql`insert into character_story_shares (personnage_id, jeton) values (${id}, ${jeton})`
  const r = await sql`select personnage_id, jeton from character_story_shares where jeton = ${jeton}`
  console.log('posé :', JSON.stringify(r))
}

/* Ouvrir (ou retrouver) le lien de partage d'une histoire, depuis la ligne de
 * commande. Le bloc « 🔗 Partager cette histoire » de la page d'histoire fait la
 * même chose; ceci sert quand on veut le lien sans ouvrir le navigateur.
 *
 *   node scripts/ouvrir-partage.mjs 98              → ouvre ou retrouve
 *   node scripts/ouvrir-partage.mjs 98 --revoquer   → coupe le lien
 *
 * ⚠ L'alphabet et la longueur sont RECOPIÉS de `src/lib/partage.ts` — un .mjs ne
 * peut pas importer du TypeScript applicatif (ERR_MODULE_NOT_FOUND). Le contrôle
 * `scripts/controle-partage.mts` vérifie que tout jeton en base respecte la
 * forme attendue : une divergence de ce fichier s'y verrait.
 */
import { neon } from '@neondatabase/serverless'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
const LONGUEUR = 24

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

const id = Number(process.argv[2])
if (!Number.isInteger(id) || id <= 0) throw new Error('usage : node scripts/ouvrir-partage.mjs <id> [--revoquer]')

const [personnage] = await sql`select id, nom from characters where id = ${id}`
if (!personnage) throw new Error(`aucun personnage ${id}`)

if (process.argv.includes('--revoquer')) {
  const r = await sql`delete from character_story_shares where personnage_id = ${id} returning jeton`
  console.log(r.length ? `Lien coupé pour [${id}] ${personnage.nom}.` : `Aucun lien pour [${id}].`)
} else {
  const [existant] = await sql`select jeton, cree_le from character_story_shares where personnage_id = ${id}`
  if (existant) {
    console.log(`Lien déjà ouvert pour [${id}] ${personnage.nom} (depuis ${existant.cree_le}) :`)
    console.log(`  https://www.dracovick.com/histoire/${existant.jeton}`)
  } else {
    // 256 est un multiple exact de 32 : `octet % 32` est uniforme, sans biais.
    const octets = crypto.randomBytes(LONGUEUR)
    let jeton = ''
    for (const o of octets) jeton += ALPHABET[o % ALPHABET.length]
    await sql`insert into character_story_shares (personnage_id, jeton) values (${id}, ${jeton})`
    console.log(`Lien ouvert pour [${id}] ${personnage.nom} :`)
    console.log(`  https://www.dracovick.com/histoire/${jeton}`)
  }
}

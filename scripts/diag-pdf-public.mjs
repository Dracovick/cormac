/* Diagnostic ponctuel : pourquoi /api/pdf rend 500 sur une histoire partagée.
 * ⛔ Script d'enquête, pas un contrôle. Il crée un partage, interroge la route,
 *    affiche le corps de la réponse, puis nettoie dans un finally. */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
const sql = neon(url)

const jeton = 'zzdiagabcdefghijkmnpqrst'
const [ancien] = await sql`select jeton from character_story_shares where personnage_id = 98`

try {
  await sql`delete from character_story_shares where personnage_id = 98`
  await sql`insert into character_story_shares (personnage_id, jeton) values (98, ${jeton})`

  // 1. La page elle-même
  const page = await fetch(`https://www.dracovick.com/histoire/${jeton}/imprimer`)
  console.log('page imprimable  :', page.status, page.headers.get('content-type'))

  // 2. La route PDF
  const pdf = await fetch(
    `https://www.dracovick.com/api/pdf?cible=${encodeURIComponent(`/histoire/${jeton}/imprimer`)}&nom=essai`)
  console.log('api/pdf          :', pdf.status, pdf.headers.get('content-type'))
  const corps = await pdf.text()
  console.log('corps            :', corps.slice(0, 600))

  // 3. Témoin : la même route, avec cookie, sur la fiche (connue bonne)
  const temoin = await fetch(
    'https://www.dracovick.com/api/pdf?cible=%2Fpersonnage%2F98%2Fimprimer&nom=essai',
    { headers: { Cookie: 'cormac_auth=granted' } })
  console.log('témoin fiche     :', temoin.status, temoin.headers.get('content-type'),
    (await temoin.arrayBuffer()).byteLength, 'octets')
} finally {
  await sql`delete from character_story_shares where jeton = ${jeton}`
  if (ancien) {
    await sql`insert into character_story_shares (personnage_id, jeton) values (98, ${ancien.jeton})
      on conflict (personnage_id) do update set jeton = ${ancien.jeton}`
  }
  console.log('nettoyé')
}

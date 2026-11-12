/**
 * Applique drizzle/0016 et PROUVE l'état de la colonne avant / après.
 *
 * On ne se contente pas de « la commande n'a pas crié » : on lit
 * information_schema avant et après, et on compte les lignes. Un ALTER
 * idempotent qui ne fait rien se lit exactement comme un ALTER qui réussit.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const colonne = async () => (await sql`
  select column_name, data_type, is_nullable from information_schema.columns
  where table_name = 'character_weapons' and column_name = 'carac_attaque'`)

console.log('AVANT :', JSON.stringify(await colonne()))

await sql`ALTER TABLE "character_weapons" ADD COLUMN IF NOT EXISTS "carac_attaque" text`

console.log('APRÈS :', JSON.stringify(await colonne()))

const [n]: any[] = await sql`
  select count(*)::int total,
         count(carac_attaque)::int renseignees
  from character_weapons`
console.log(`Lignes d'armes : ${n.total} · avec un choix saisi : ${n.renseignees} (attendu 0 juste après la migration)`)

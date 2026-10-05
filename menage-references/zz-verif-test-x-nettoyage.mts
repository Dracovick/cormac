/** Vérifie que le perso jetable #95 du test du ✕ (2026-10-05) a tout laissé propre. */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

console.log('characters 95 :', await sql`SELECT id FROM characters WHERE id = 95`)
console.log('character_potions 95 :', await sql`SELECT id FROM character_potions WHERE personnage_id = 95`)
console.log('journal 95 :', await sql`SELECT id FROM character_journal WHERE personnage_id = 95`)
console.log('lignes potions orphelines :', await sql`
  SELECT cp.id FROM character_potions cp LEFT JOIN characters c ON c.id = cp.personnage_id WHERE c.id IS NULL`)
console.log('catalogue potions :', await sql`SELECT count(*) AS n FROM potions`)

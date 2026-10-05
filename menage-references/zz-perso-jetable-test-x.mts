/**
 * Test du ✕ Jeter une potion (2026-10-05) : crée un personnage jetable
 * avec deux potions du catalogue (une pleine, une vide), imprime les ids.
 * Nettoyage par zz-perso-jetable-test-x-detruire.mts après le test.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const [perso] = await sql`
  INSERT INTO characters (nom, joueur_prenom)
  VALUES ('ZZ-Test-JeterPotion', 'Dracovick (test)')
  RETURNING id, nom`
console.log('Perso jetable :', perso)

const potions = await sql`SELECT id, nom FROM potions WHERE nom IN ('Potion de rapidité', 'Potion d''état gazeux') ORDER BY nom`
console.log('Potions du catalogue :', potions)

for (const p of potions) {
  const charges = p.nom === 'Potion de rapidité' ? 2 : 0
  const [ligne] = await sql`
    INSERT INTO character_potions (personnage_id, potion_id, charges_restantes)
    VALUES (${perso.id}, ${p.id}, ${charges})
    RETURNING id, potion_id, charges_restantes`
  console.log('Ligne potion :', ligne)
}

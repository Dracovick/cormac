/**
 * Fiche d'essai pour l'équipement courant (drizzle/0017). À DÉTRUIRE après lecture.
 *
 * Construite pour que chaque règle se prouve CONTRE son contraire sur la même
 * fiche : FOR 10 (seuils du Manuel VF : légère ≤16,5 kg · moyenne ≤33 · lourde
 * ≤49,5), une dague au catalogue pour que la ligne « Charge portée » existe déjà
 * avant qu'on y touche, et AUCUNE ligne d'équipement au départ — c'est le
 * navigateur qui en écrira, par la section 🎒 de la fiche.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
  .match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, ''))

const [perso]: any[] = await sql`
  INSERT INTO characters (nom, joueur_prenom, alignement)
  VALUES ('ZZ-Essai-Equipement', 'Dracovick (essai)', 'Neutre')
  RETURNING id, nom`
console.log('Fiche d’essai :', perso)

await sql`INSERT INTO character_ability_scores (personnage_id, for_base, dex_base, con_base, int_base, sag_base, cha_base)
          VALUES (${perso.id}, 10, 12, 12, 10, 10, 10)`

const [guerrier]: any[] = await sql`SELECT id FROM classes WHERE nom = 'Guerrier' LIMIT 1`
await sql`INSERT INTO character_classes (personnage_id, classe_id, niveau) VALUES (${perso.id}, ${guerrier.id}, 3)`
await sql`INSERT INTO character_combat_stats (personnage_id, pv_max, pv_actuels) VALUES (${perso.id}, 24, 24)`

const [dague]: any[] = await sql`SELECT id, nom, poids FROM weapons WHERE nom = 'Dague' AND catalogue_id IS NULL LIMIT 1`
await sql`INSERT INTO character_weapons (personnage_id, arme_id, bonus_magique, quantite) VALUES (${perso.id}, ${dague.id}, 0, 1)`
console.log(`Arme ${dague.id} ${dague.nom} · poids ${dague.poids} kg`)

const n = (await sql`SELECT count(*)::int n FROM character_equipment WHERE personnage_id = ${perso.id}`)[0].n
console.log('Lignes d’équipement au départ :', n, '(0 attendu)')

console.log(`\nhttps://www.dracovick.com/personnage/${perso.id}`)
console.log('Attendu AVANT toute saisie : « Charge portée : 0,5 kg · légère · légère ≤16,5 · moy. ≤33 · lourde ≤49,5 kg ».')
console.log('Seuils du Manuel français à FOR 10. La section 🎒 Équipement doit être là, vide.')

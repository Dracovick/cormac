/**
 * Fiche d'essai pour le choix FOR/DEX (drizzle/0016). À DÉTRUIRE après lecture.
 *
 * Construite pour que chaque chiffre se prouve CONTRE son contraire sur la même
 * fiche : une dague (éligible), une épée bâtarde (non éligible) et une fronde
 * (à distance). FOR 12 (+1) et DEX 18 (+4) : l'écart de 3 rend tout changement
 * visible et non ambigu.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
  .match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, ''))

const [perso]: any[] = await sql`
  INSERT INTO characters (nom, joueur_prenom, alignement)
  VALUES ('ZZ-Essai-ChoixFinesse', 'Dracovick (essai)', 'Neutre')
  RETURNING id, nom`
console.log('Fiche d’essai :', perso)

await sql`INSERT INTO character_ability_scores (personnage_id, for_base, dex_base, con_base, int_base, sag_base, cha_base)
          VALUES (${perso.id}, 12, 18, 12, 14, 10, 10)`

const [guerrier]: any[] = await sql`SELECT id FROM classes WHERE nom = 'Guerrier' LIMIT 1`
await sql`INSERT INTO character_classes (personnage_id, classe_id, niveau) VALUES (${perso.id}, ${guerrier.id}, 4)`
await sql`INSERT INTO character_combat_stats (personnage_id, pv_max, pv_actuels) VALUES (${perso.id}, 30, 30)`

const [don]: any[] = await sql`SELECT id, nom FROM feats WHERE nom = 'Attaque en finesse' LIMIT 1`
await sql`INSERT INTO character_feats (personnage_id, feat_id) VALUES (${perso.id}, ${don.id})`
console.log('Don :', don)

for (const nom of ['Dague', 'Épée bâtarde', 'Fronde']) {
  const [a]: any[] = await sql`SELECT id, nom, famille, portee FROM weapons WHERE nom = ${nom} AND catalogue_id IS NULL LIMIT 1`
  if (!a) { console.log(`  ⛔ arme introuvable au catalogue : ${nom}`); continue }
  await sql`INSERT INTO character_weapons (personnage_id, arme_id, bonus_magique, quantite) VALUES (${perso.id}, ${a.id}, 0, 1)`
  console.log(`  arme ${a.id} ${a.nom} · famille ${JSON.stringify(a.famille)} · portée ${a.portee}`)
}

console.log(`\nhttps://www.dracovick.com/personnage/${perso.id}`)
console.log(`Attendu AVANT tout choix : Dague +8 (BBA 4 + DEX 4), Épée bâtarde +5 (FOR 1), Fronde +8 (DEX 4).`)

/**
 * Applique drizzle/0015 et déplace les quantités saisies dans la case du bonus.
 *
 * On ne devine PAS lesquelles : le Manuel plafonne l'altération d'une arme ou
 * d'une munition à +5, donc tout ce qui dépasse est une quantité. On relève
 * l'état avant, on écrit, on relève l'état après — et on publie les deux.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const sql = neon(env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, ''))

const AVANT: any[] = await sql`
  select cw.id, c.id pid, c.nom perso, w.nom arme, cw.bonus_munitions
  from character_weapons cw
  join characters c on c.id = cw.personnage_id
  join weapons w on w.id = cw.arme_id
  where cw.bonus_munitions is not null and cw.bonus_munitions <> 0
  order by cw.bonus_munitions desc`
console.log('── AVANT : les lignes à munitions non nulles')
for (const l of AVANT) console.log(`  [${l.pid}] ${l.perso} — ${l.arme} : bonus_munitions ${l.bonus_munitions}`)

await sql`ALTER TABLE "character_weapons" ADD COLUMN IF NOT EXISTS "quantite_munitions" integer`
console.log('\ncolonne quantite_munitions : en place')

// Au-delà de +5, ce n'est pas un bonus d'altération : c'est un nombre de projectiles.
const deplacees: any[] = await sql`
  update character_weapons
  set quantite_munitions = bonus_munitions, bonus_munitions = null
  where bonus_munitions > 5
  returning id, personnage_id, quantite_munitions`
console.log(`\n${deplacees.length} ligne(s) déplacée(s) :`)
for (const d of deplacees) console.log(`  ligne ${d.id} (fiche ${d.personnage_id}) → quantite_munitions ${d.quantite_munitions}`)

const APRES: any[] = await sql`
  select cw.id, c.id pid, c.nom perso, w.nom arme, cw.bonus_munitions, cw.quantite_munitions
  from character_weapons cw
  join characters c on c.id = cw.personnage_id
  join weapons w on w.id = cw.arme_id
  where cw.bonus_munitions is not null or cw.quantite_munitions is not null
  order by c.id`
console.log('\n── APRÈS')
for (const l of APRES)
  console.log(`  [${l.pid}] ${l.perso} — ${l.arme} : bonus ${l.bonus_munitions ?? '—'}, quantité ${l.quantite_munitions ?? '—'}`)

// Témoin de présence : un contrôle « plus aucun bonus > 5 » serait vrai même
// si la table était vide. On compte donc aussi ce qui reste légitimement.
const reste: any[] = await sql`
  select count(*) filter (where bonus_munitions > 5)::int fautifs,
         count(*) filter (where bonus_munitions between 1 and 5)::int legitimes,
         count(*) filter (where quantite_munitions is not null)::int quantites,
         count(*)::int total
  from character_weapons`
console.log(`\nContrôle sur ${reste[0].total} lignes d'armes : ${reste[0].fautifs} bonus > +5 (attendu 0), ` +
            `${reste[0].legitimes} bonus légitimes +1..+5 (attendu 2), ${reste[0].quantites} quantités (attendu 2)`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// André (DM 2026-10-05) : Cormac possède vraiment 3 fioles de Potion de soins importants.
// La fusion du 2026-10-05 avait réduit ses 3 lignes à cp[338] = 3 gorgées (1 fiole).
// 1 fiole = 3 gorgées (charges_max de [23]) → 3 fioles pleines = 9 gorgées.
const avant = await sql`select id, charges_restantes from character_potions where id = 338` as any[]
console.log('Avant :', JSON.stringify(avant))
await sql`update character_potions set charges_restantes = 9 where id = 338 and potion_id = 23`
const apres = await sql`select cp.id, cp.potion_id, cp.charges_restantes, c.nom
  from character_potions cp join characters c on c.id = cp.personnage_id where cp.id = 338` as any[]
console.log('Après :', JSON.stringify(apres))

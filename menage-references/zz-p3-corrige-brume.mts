import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
// Manuel des Joueurs 3.5 VF, liste ens/mag relevée à l'image : Brume de dissimulation = niveau 1 (Obscuring Mist).
const avant = await sql`select scl.id, scl.niveau, c.nom classe from spell_class_levels scl
  join spells s on s.id=scl.sort_id join classes c on c.id=scl.classe_id
  where s.nom='Brume de dissimulation'` as any[]
console.log('Avant :', JSON.stringify(avant))
const r = await sql`update spell_class_levels scl set niveau=1
  from spells s, classes c
  where s.id=scl.sort_id and c.id=scl.classe_id and s.nom='Brume de dissimulation'
    and c.nom in ('Ensorceleur','Magicien') and scl.niveau=2 returning scl.id` as any[]
console.log('Corrigées :', r.length)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const porteurs = [27, 33, 36, 39, 41, 56, 99]
const r: any[] = await sql`
  select cw.personnage_id pid, c.nom perso, w.id wid, w.nom arme, w.famille, w.portee,
         w.est_catalogue, w.catalogue_id, cw.bonus_magique, cw.bonus_munitions
  from character_weapons cw
  join weapons w on w.id = cw.arme_id
  join characters c on c.id = cw.personnage_id
  where cw.personnage_id = any(${porteurs})
  order by cw.personnage_id, w.nom`
for (const x of r) console.log(`[${x.pid}] ${x.perso} | "${x.arme}" | fam=${x.famille} | portee=${x.portee} | cat=${x.est_catalogue} catId=${x.catalogue_id} | bonus=${x.bonus_magique} mun=${x.bonus_munitions}`)

// Combien d'entrées d'armes en base, toutes fiches, ont une famille nulle ?
const g: any[] = await sql`
  select count(*)::int total,
         count(*) filter (where w.famille is null)::int sans_famille,
         count(*) filter (where w.famille ilike '%légère%')::int legeres
  from character_weapons cw join weapons w on w.id = cw.arme_id`
console.log('\n--- lignes d\'armes de fiches:', JSON.stringify(g[0]))

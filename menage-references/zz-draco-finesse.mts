import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const r: any[] = await sql`
  select f.id, f.nom, f.categorie, f.est_catalogue,
         (select count(*)::int from character_feats cf where cf.feat_id = f.id) porteurs
  from feats f
  where f.nom ilike '%finesse%' or f.nom ilike '%acuit%'
  order by f.est_catalogue desc, f.nom`
console.log('--- lignes feats contenant finesse/acuite:', r.length)
for (const x of r) console.log(`  [${x.id}] cat=${x.est_catalogue} "${x.nom}" | ${x.categorie} | porteurs=${x.porteurs}`)

const p: any[] = await sql`
  select c.id, c.nom nom_perso, c.joueur_prenom, f.nom nom_don
  from character_feats cf join feats f on f.id = cf.feat_id join characters c on c.id = cf.personnage_id
  where f.nom ilike '%finesse%' or f.nom ilike '%acuit%'
  order by c.id`
console.log('--- fiches porteuses:', p.length)
for (const x of p) console.log(`  [${x.id}] ${x.nom_perso} (${x.joueur_prenom}) -> "${x.nom_don}"`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ids = [57,83,85,39,24,6,77,53,72,30,52]
const sk = await sql`select cs.personnage_id, c.nom as perso, s.nom, cs.rangs_investis, cs.modif_divers
  from character_skills cs
  join skills s on s.id = cs.skill_id
  join characters c on c.id = cs.personnage_id
  where cs.personnage_id = any(${ids}) and s.nom ~* 'd[ée]tection|psychologie|perception auditive|diplomatie|diplomacy'
  order by cs.personnage_id, s.nom` as any[]
console.log('Divers stockés (compétences visées par Vigilance/Alertness/Skill Focus) :')
for (const r of sk) console.log(`  [${r.personnage_id}] ${r.perso} — ${r.nom}: rangs ${r.rangs_investis}, divers ${r.modif_divers}`)

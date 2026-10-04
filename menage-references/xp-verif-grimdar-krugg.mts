import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const id of [86, 82]) {
  const [p] = await sql`select nom, xp from characters where id = ${id}` as {nom:string;xp:number}[]
  const cls = await sql`select cc.niveau, cl.nom from character_classes cc join classes cl on cl.id=cc.classe_id where cc.personnage_id = ${id}`
  const [stats] = await sql`select pv_max, pv_actuels from character_combat_stats where personnage_id = ${id}` as {pv_max:number;pv_actuels:number}[]
  const niveau = await sql`select description, created_at from character_journal where personnage_id = ${id} and type = 'niveau' order by id desc limit 3`
  console.log(JSON.stringify({ id, nom: p.nom, xp: p.xp, classes: cls, stats, montees: niveau }, null, 1))
}

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const [cs] = await sql.query(`select bba_corps_a_corps, bba_projectiles, pv_max, pv_actuels from character_combat_stats where personnage_id=93`) as any[]
console.log('APRÈS MONTÉE:', JSON.stringify(cs))
const cls = await sql.query(`select cl.nom, cc.niveau from character_classes cc join classes cl on cl.id=cc.classe_id where cc.personnage_id=93`)
console.log('CLASSES:', JSON.stringify(cls))
const j = await sql.query(`select type, description from character_journal where personnage_id=93 order by id desc limit 2`)
console.log('JOURNAL:', JSON.stringify(j))

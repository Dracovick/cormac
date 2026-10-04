import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const armes = await sql.query(`select id, nom, degats from weapons where nom like 'ZZ %'`)
console.log('ARME REF APRÈS MODIF:', JSON.stringify(armes))
const [cs] = await sql.query(`select bba_corps_a_corps, bba_projectiles, pv_max, pv_actuels from character_combat_stats where personnage_id=93`) as any[]
console.log('COMBAT STATS:', JSON.stringify(cs))

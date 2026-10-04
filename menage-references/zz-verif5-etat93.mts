import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const t of ['character_combat_stats','character_ability_scores','character_classes','character_weapons','character_potions','character_journal','character_saving_throws','character_currency','character_skills','character_languages']) {
  const r = await sql.query(`select count(*)::int as n from ${t} where personnage_id=93`) as any[]
  if (r[0].n > 0) console.log(`${t}: ${r[0].n}`)
}
console.log('fin du relevé (tables non listées = 0)')

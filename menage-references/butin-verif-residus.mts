import fs from 'node:fs'
import { neon } from '@neondatabase/serverless'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const q = async (label: string, s: string) => console.log(label, JSON.stringify(await sql.query(s)))
await q('personnages ZZ/témoin :', "select id,nom from characters where nom ilike '%ZZ%' or nom ilike '%témoin%'")
await q('armes ZZ            :', "select id,nom from weapons where nom ilike '%ZZ%'")
await q('objets ZZ           :', "select id,nom from magic_items where nom ilike '%ZZ%'")
await q('potions ZZ          :', "select id,nom from potions where nom ilike '%ZZ%'")
await q('gemmes orphelines   :', "select id,nom from character_gems where personnage_id not in (select id from characters)")
await q('journal butin       :', "select count(*) as n from character_journal where type='butin'")
await q('ids 87/88/89        :', "select id,nom from characters where id in (87,88,89)")
await q('total personnages   :', 'select count(*) as n from characters')

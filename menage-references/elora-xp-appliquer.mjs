import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const AVANT = 128908, APRES = 282000
const av = await sql.query('select id, nom, xp from characters where id=45')
console.log('AVANT :', JSON.stringify(av[0]))
if (av[0].xp !== AVANT) { console.error('⛔ ARRET : xp inattendu, on ne touche a rien.'); process.exit(1) }
const r = await sql.query('update characters set xp=$1 where id=45 and xp=$2 returning id, nom, xp',[APRES, AVANT])
console.log('APRES :', JSON.stringify(r[0]))
console.log('Lignes touchees :', r.length)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const show = async (t,q,p=[]) => { console.log('--- '+t+' ---'); for (const r of await sql.query(q,p)) console.log('   ', JSON.stringify(r)) }
await show('armor (les 5)','select * from armor order by id')
await show('skills id 31 + voisins Discretion','select * from skills where id=31 or nom ilike \'%discr%\' order by id')
await show('skills utilises par 82','select s.id,s.nom from skills s where s.id in (3,15,181,191) order by s.id')
await show('magic_items 10,12,71','select * from magic_items where id in (10,12,71) order by id')
await show('magic_items ~ amulette charisme','select id,nom,bonus from magic_items where nom ilike \'%charisme%\' order by id')
await show('magic_items ~ parchemin protection','select id,nom,bonus from magic_items where nom ilike \'%parchemin%\' order by id')
await show('magic_items ~ anneau de protection','select id,nom,bonus from magic_items where nom ilike \'%anneau de protection%\' order by id')
await show('qui porte magic_items 10 (cape)','select cm.personnage_id, c.nom from character_magic_items cm join characters c on c.id=cm.personnage_id where cm.objet_id=10')
await show('qui porte magic_items 12','select cm.personnage_id, c.nom from character_magic_items cm join characters c on c.id=cm.personnage_id where cm.objet_id=12')
await show('qui porte magic_items 71','select cm.personnage_id, c.nom from character_magic_items cm join characters c on c.id=cm.personnage_id where cm.objet_id=71')
await show('qui porte armor 5','select ca.*, c.nom from character_armor ca join characters c on c.id=ca.personnage_id')
await show('classes','select * from classes where id=5')

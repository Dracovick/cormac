import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const show = async (t,q,p=[]) => { console.log('--- '+t+' ---'); const r=await sql.query(q,p); if(!r.length)console.log('   (vide)'); for (const x of r) console.log('   ', JSON.stringify(x)) }
await show('proprietaires des armes 157/158/159','select cw.arme_id, cw.personnage_id, c.nom from character_weapons cw join characters c on c.id=cw.personnage_id where cw.arme_id in (157,158,159) order by cw.arme_id')
await show('autres armes nommees Epee a deux mains','select id,nom,critique_min,critique_mult,degats from weapons where nom ilike \'%deux mains%\' order by id')
await show('domaines utilises','select domaine1,domaine2,count(*)::int n from character_combat_stats where domaine1 is not null or domaine2 is not null group by 1,2 order by n desc')
await show('skills 31 deja chez qui','select cs.personnage_id,c.nom,cs.rangs_investis from character_skills cs join characters c on c.id=cs.personnage_id where cs.skill_id=31 order by cs.personnage_id limit 12')
await show('recherche Krugg','select id,nom,joueur_prenom,joueur_nom from characters where nom ilike \'%krugg%\'')
await show('character_notes structure (exemple)','select * from character_notes limit 2')
await show('magic_items colonnes','select column_name,data_type from information_schema.columns where table_name=\'magic_items\' order by ordinal_position')
await show('character_magic_items colonnes','select column_name,data_type from information_schema.columns where table_name=\'character_magic_items\' order by ordinal_position')
await show('character_notes colonnes','select column_name,data_type from information_schema.columns where table_name=\'character_notes\' order by ordinal_position')
await show('character_armor colonnes','select column_name,data_type from information_schema.columns where table_name=\'character_armor\' order by ordinal_position')

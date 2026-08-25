import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const sql = neon(env.match(/DATABASE_URL=(.+)/)[1].trim())
const out = []
const say = (...a) => { const s = a.map(x => typeof x==='string'?x:JSON.stringify(x)).join(' '); out.push(s); console.log(s) }

say('=== RACES (toutes) ===')
for (const r of await sql`select id,nom,bonus_for,bonus_dex,bonus_con,bonus_int,bonus_sag,bonus_cha,taille,deplacement_base,vision_nocturne from races order by id`)
  say(JSON.stringify(r))

say('\n=== personnages par race ===')
for (const r of await sql`select r.id, r.nom, count(c.id)::int n from races r left join characters c on c.race_id=r.id group by r.id,r.nom order by r.id`)
  say(`race ${r.id} ${r.nom} -> ${r.n} personnages`)

say('\n=== racial_features par race ===')
for (const r of await sql`select race_id, count(*)::int n from racial_features group by race_id order by race_id`)
  say(`race_id ${r.race_id} -> ${r.n} traits`)

say('\n=== clans par race ===')
for (const r of await sql`select race_id, count(*)::int n from clans group by race_id order by race_id`)
  say(`clans race_id ${r.race_id} -> ${r.n}`)

say('\n=== CLASSES (toutes) ===')
for (const r of await sql`select id,nom,de_vie,bba_progression,vigueur_progression,reflexes_progression,volonte_progression,competences_par_niveau from classes order by id`)
  say(JSON.stringify(r))

say('\n=== personnages par classe (character_classes) ===')
for (const r of await sql`select cl.id, cl.nom, count(cc.id)::int liens, count(distinct cc.personnage_id)::int perso from classes cl left join character_classes cc on cc.classe_id=cl.id group by cl.id,cl.nom order by cl.id`)
  say(`classe ${r.id} ${r.nom} -> ${r.liens} liens / ${r.perso} personnages`)

say('\n=== class_features / class_skill_list par classe ===')
for (const r of await sql`select classe_id, count(*)::int n from class_features group by classe_id order by classe_id`) say(`class_features classe_id ${r.classe_id} -> ${r.n}`)
for (const r of await sql`select classe_id, count(*)::int n from class_skill_list group by classe_id order by classe_id`) say(`class_skill_list classe_id ${r.classe_id} -> ${r.n}`)

say('\n=== TOTAUX ===')
say('characters:', (await sql`select count(*)::int n from characters`)[0].n)
say('characters avec race_id non nul:', (await sql`select count(*)::int n from characters where race_id is not null`)[0].n)
say('character_classes:', (await sql`select count(*)::int n from character_classes`)[0].n)
say('character_skills:', (await sql`select count(*)::int n from character_skills`)[0].n)
say('races:', (await sql`select count(*)::int n from races`)[0].n)
say('classes:', (await sql`select count(*)::int n from classes`)[0].n)
say('skills:', (await sql`select count(*)::int n from skills`)[0].n)

say('\n=== COLLISION race : un perso ne peut avoir qu une race (champ simple) — verif structurelle ===')
say('OK par construction : characters.race_id est scalaire')

say('\n=== COLLISION classe : perso lie a la fois a Ensorcelleur et a un autre nom ? ===')
for (const r of await sql`select cc.personnage_id, c.nom, count(*)::int n, array_agg(cc.classe_id) ids from character_classes cc join characters c on c.id=cc.personnage_id group by cc.personnage_id,c.nom having count(*)>1 order by cc.personnage_id`)
  say(`perso ${r.personnage_id} ${r.nom} : ${r.n} classes ${JSON.stringify(r.ids)}`)

say('\n=== NOMS des 6 Demi-Elf / 3 Demi-Orc / 3 Petite-gens / 3 Nain ===')
for (const r of await sql`select c.id, c.nom, r.nom rnom from characters c join races r on r.id=c.race_id where r.nom in ('Demi-Elf','Demi-Elfe','Demi-Orc','Demi-Orque','Petite-gens','Halfelin','Nain') order by r.nom, c.id`)
  say(`  ${r.rnom} : perso ${r.id} ${r.nom}`)

say('\n=== NOMS des 9 Ensorcelleur ===')
for (const r of await sql`select c.id, c.nom, cc.niveau from characters c join character_classes cc on cc.personnage_id=c.id join classes cl on cl.id=cc.classe_id where cl.nom='Ensorcelleur' order by c.id`)
  say(`  perso ${r.id} ${r.nom} niv ${r.niveau}`)

say('\n=== Guerrier / Paladin : personnages ===')
for (const r of await sql`select cl.nom cnom, c.id, c.nom from characters c join character_classes cc on cc.personnage_id=c.id join classes cl on cl.id=cc.classe_id where cl.nom in ('Guerrier','Paladin') order by cl.nom, c.id`)
  say(`  ${r.cnom} : perso ${r.id} ${r.nom}`)

fs.writeFileSync('X:/Claude-Tools/cormac/menage-references/audit-avant.txt', out.join('\n'))

import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`
  SELECT m.id, m.nom, m.charges_max, m.emplacement,
         p.nom AS perso, (SELECT r.nom FROM races r WHERE r.id = p.race_id) AS race,
         (SELECT string_agg((SELECT cl.nom FROM classes cl WHERE cl.id = cc.classe_id) || ' ' || cc.niveau, ' / ') FROM character_classes cc WHERE cc.personnage_id = p.id) AS classes,
         cm.notes, cm.charges_restantes, cm.emplacement AS empl_fiche
  FROM magic_items m
  JOIN character_magic_items cm ON cm.objet_id = m.id
  JOIN characters p ON p.id = cm.personnage_id
  WHERE m.description IS NULL OR btrim(m.description) = ''
  ORDER BY m.id`
for (const x of r) console.log(`[${x.id}] ${x.nom}  ||  ${x.perso} (${x.race ?? '?'} · ${x.classes ?? '?'}) ${x.notes ? '|| notes: ' + x.notes : ''}${x.charges_restantes != null ? ' || ch.rest ' + x.charges_restantes : ''}${x.empl_fiche ? ' || empl ' + x.empl_fiche : ''}`)
console.log('total lignes de fiche', r.length)

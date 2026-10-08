import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const persos = [4, 62, 79, 76, 60, 64, 50]
const r = await sql`
  SELECT cc.personnage_id, c.nom, cl.nom AS classe, cc.classe_id, cc.niveau,
         EXISTS (SELECT 1 FROM class_skill_list csl WHERE csl.classe_id = cc.classe_id AND csl.skill_id = 164) AS art_de_classe
  FROM character_classes cc JOIN characters c ON c.id = cc.personnage_id
  JOIN classes cl ON cl.id = cc.classe_id
  WHERE cc.personnage_id = ANY(${persos}) ORDER BY cc.personnage_id`
for (const x of r as any[]) console.log(`${x.personnage_id} ${x.nom} — ${x.classe} (id ${x.classe_id}) niv ${x.niveau} — Art de classe: ${x.art_de_classe}`)

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
for (const n of ['Graisse', 'Repli expéditif', 'Image silencieuse', 'Convocation de monstres I', 'Convocation de monstres V', 'Hébétement', 'Frayeur', 'Création majeure', 'Poing de Bigby']) {
  const r = await sql`select s.id, s.nom, (select string_agg(c.nom || ' ' || scl.niveau, ', ' order by c.nom) from spell_class_levels scl join classes c on c.id = scl.classe_id where scl.sort_id = s.id) niveaux from spells s where s.nom = ${n}` as any[]
  console.log(r.length ? `[${r[0].id}] ${r[0].nom} — ${r[0].niveaux}` : `ABSENT : ${n}`)
}

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const liste = COMPETENCES_DND35.map(c => c.nom)

const rows = await sql`
  select s.id, s.nom, s.caracteristique car,
    count(cs.id)::int liens,
    coalesce(sum(case when coalesce(cs.rangs_investis,0)>0 or coalesce(cs.modif_divers,0)<>0 then 1 else 0 end),0)::int visibles,
    coalesce(max(cs.rangs_investis),0)::int maxrangs
  from skills s left join character_skills cs on cs.skill_id=s.id
  group by s.id, s.nom, s.caracteristique order by liens desc, s.nom` as
  { id:number; nom:string; car:string; liens:number; visibles:number; maxrangs:number }[]

const horsListe = rows.filter(r => !liste.includes(r.nom))
console.log(`=== COMPETENCES HORS TABLE 4-2 : ${horsListe.length} noms ===`)
console.log(`   (${rows.length} entrees au total, ${rows.length - horsListe.length} deja conformes)\n`)
for (const r of horsListe) {
  const p = await sql`select c.id, c.nom, cs.rangs_investis rg, cs.modif_divers dv
    from character_skills cs join characters c on c.id=cs.personnage_id where cs.skill_id=${r.id} order by cs.rangs_investis desc` as
    { id:number; nom:string; rg:number; dv:number }[]
  console.log(`id=${String(r.id).padStart(3)} « ${r.nom} » [${r.car}] — ${r.liens} lien(s)`)
  for (const x of p) console.log(`        perso ${String(x.id).padStart(2)} ${x.nom.padEnd(26)} ${x.rg} rangs${x.dv ? ', divers ' + x.dv : ''}`)
  if (!p.length) console.log('        (aucun personnage — scorie)')
}

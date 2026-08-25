import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
type Plan = { cible:string; survId:number; aFusionner:{id:number}[] }
const plan: Plan[] = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/plan-lot-sur.json','utf8'))
const apres = new Map<number,string>()
for (const p of plan) { apres.set(p.survId, p.cible); for (const m of p.aFusionner) apres.set(m.id, p.cible) }
const APOS = String.fromCharCode(39), BSL = String.fromCharCode(92)
const anciens = fs.readFileSync('X:/Claude-Tools/cormac/menage-references/skills-avant.txt','utf8').split('\n')
  .map(l => { const i=l.indexOf('{ nom: '+APOS); if(i<0) return null; const j=l.indexOf(APOS+',',i+8); if(j<0) return null; return l.slice(i+8,j).split(BSL+APOS).join(APOS) })
  .filter((x): x is string => x!==null)
const liste = COMPETENCES_DND35.map(c=>c.nom)
for (const pid of [83, 85, 3, 5, 6]) {
  const l = await sql`select cs.skill_id sid, s.nom, cs.rangs_investis r, cs.modif_divers d, c.nom pnom
    from character_skills cs join skills s on s.id=cs.skill_id join characters c on c.id=cs.personnage_id
    where cs.personnage_id=${pid} order by s.nom` as {sid:number;nom:string;r:number;d:number;pnom:string}[]
  console.log(`\n=== perso ${pid} ${l[0]?.pnom} ===`)
  for (const x of l) {
    const vis = (x.r??0)>0 || (x.d??0)!==0
    const na = apres.get(x.sid) ?? x.nom
    const av0 = vis && anciens.includes(x.nom), ap = vis && liste.includes(na)
    const etat = !vis ? 'rangs 0 — jamais imprimee' : (av0 && ap ? 'ok avant et apres' : av0 && !ap ? '>>> PERDUE' : !av0 && ap ? 'GAGNEE' : 'invisible avant et apres')
    console.log(`   id=${String(x.sid).padStart(3)} "${x.nom}"${na!==x.nom?` -> "${na}"`:''}  rangs=${x.r} div=${x.d}  ${etat}`)
  }
}

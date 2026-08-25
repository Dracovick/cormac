import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { COMPETENCES_DND35 } from '../src/lib/dnd35/skills'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const APOS = String.fromCharCode(39), BSL = String.fromCharCode(92)
const anciens = fs.readFileSync('X:/Claude-Tools/cormac/menage-references/skills-avant.txt','utf8').split('\n')
  .map(l => { const i = l.indexOf('{ nom: '+APOS); if (i<0) return null; const j = l.indexOf(APOS+',', i+8); if (j<0) return null; return l.slice(i+8, j).split(BSL+APOS).join(APOS) })
  .filter((x): x is string => x !== null)
const nouveaux = COMPETENCES_DND35.map(c => c.nom)
const liens = await sql`select c.id, c.nom pnom, s.nom snom, cs.rangs_investis r, cs.modif_divers d
  from character_skills cs join skills s on s.id=cs.skill_id join characters c on c.id=cs.personnage_id` as { id:number;pnom:string;snom:string;r:number;d:number }[]
const par = new Map<number, { nom:string; av:number; ap:number; tot:number }>()
for (const l of liens) {
  if (!par.has(l.id)) par.set(l.id, { nom: l.pnom, av:0, ap:0, tot:0 })
  const p = par.get(l.id)!; p.tot++
  const visible = (l.r ?? 0) > 0 || (l.d ?? 0) !== 0
  if (visible && anciens.includes(l.snom)) p.av++
  if (visible && nouveaux.includes(l.snom)) p.ap++
}
const regress = [...par.entries()].filter(([, p]) => p.ap < p.av)
const zero = [...par.entries()].filter(([, p]) => p.av > 0 && p.ap === 0)
console.log('personnages ayant des competences :', par.size)
console.log('\n=== PERSONNAGES QUI IMPRIMENT MOINS QU AVANT ===')
for (const [id, p] of regress.sort((a,b)=>(a[1].ap-a[1].av)-(b[1].ap-b[1].av)))
  console.log(`  perso ${String(id).padStart(2)} ${p.nom.padEnd(28)} ${p.av} -> ${p.ap} lignes (sur ${p.tot} competences)`)
if (!regress.length) console.log('  (aucun)')
console.log('\n=== PERSONNAGES TOMBES A ZERO ===')
for (const [id, p] of zero) console.log(`  perso ${id} ${p.nom} : ${p.av} -> 0`)
if (!zero.length) console.log('  (aucun)')
const gagne = [...par.entries()].filter(([, p]) => p.ap > p.av)
console.log(`\ngagnent : ${gagne.length} personnages | perdent : ${regress.length} | inchanges : ${par.size - gagne.length - regress.length}`)
console.log('max lignes imprimees sur une fiche :', Math.max(...[...par.values()].map(p=>p.ap)), '(gabarit fixe a 20)')

import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const classes = await sql`select c.nom, count(scl.id)::int n from classes c join spell_class_levels scl on scl.classe_id=c.id group by c.nom order by n desc` as any[]
console.log('Classes :', classes.map(c=>`${c.nom}: ${c.n}`).join(' | '))
const sans = await sql`select count(*)::int n from spells s where not exists (select 1 from spell_class_levels scl where scl.sort_id=s.id)` as any[]
console.log('Sorts sans classes :', sans[0].n, '/ 721')
// Sorts du Manuel absents de la base : union des non-appariés des trois relevés
const normaliser = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, ' ').replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim()
const sorts = await sql`select nom from spells` as any[]
const connus = new Set(sorts.map((s:any)=>normaliser(s.nom)))
const absents = new Set<string>()
for (const f of ['classes-barde','classes-ens-mag','classes-pretre']) {
  const md = fs.readFileSync(`menage-references/p2-releves/${f}.md`,'utf8')
  for (const l of md.split('\n')) {
    const m = l.match(/^- (.+)$/)
    if (!m) continue
    const nom = m[1].replace(/\s*\[\?\]\s*$/,'').trim()
    if (!connus.has(normaliser(nom))) absents.add(nom)
  }
}
console.log('Sorts du Manuel (listes barde+ens/mag+prêtre) ABSENTS de la table spells :', absents.size)

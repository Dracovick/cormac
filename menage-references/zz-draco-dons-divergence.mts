import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { FEATS_DND35 } from '../src/lib/dnd35/feats'

const env = fs.readFileSync('../.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, "'").replace(/\s+/g, ' ').trim()

const cat: any[] = await sql`select id, nom, categorie from feats where est_catalogue = true order by nom`
const catMap = new Map(cat.map(r => [norm(r.nom), r]))
const catCodeMap = new Map(FEATS_DND35.map(f => [norm(f.nom), f]))

console.log('code FEATS_DND35:', FEATS_DND35.length, '| catalogue base:', cat.length)
console.log('intersection (meme nom):', FEATS_DND35.filter(f => catMap.has(norm(f.nom))).length)

// Combien de fiches portent chaque don du code ABSENT du catalogue ?
const absents = FEATS_DND35.filter(f => !catMap.has(norm(f.nom)))
let portesCount = 0
const portes: string[] = []
for (const f of absents) {
  const r: any[] = await sql`
    select count(*)::int c from character_feats cf
    join feats ft on ft.id = cf.feat_id
    where lower(ft.nom) = lower(${f.nom}) or lower(ft.nom) like lower(${f.nom + ' (%'})`
  if (r[0].c > 0) { portesCount++; portes.push(`${f.nom} [${f.categorie}] = ${r[0].c}`) }
}
console.log('--- dons du code absents du catalogue:', absents.length, '| dont PORTES par au moins une fiche:', portesCount)
portes.sort().forEach(p => console.log('   ', p))

// Et les noms du catalogue absents du code : portes ?
const orph = cat.filter(r => !catCodeMap.has(norm(r.nom)))
let orphPortes = 0
const op: string[] = []
for (const r of orph) {
  const q: any[] = await sql`select count(*)::int c from character_feats where feat_id = ${r.id}`
  if (q[0].c > 0) { orphPortes++; op.push(`${r.nom} [${r.categorie}] = ${q[0].c}`) }
}
console.log('--- noms du catalogue absents du code:', orph.length, '| dont portes:', orphPortes)
op.sort().forEach(p => console.log('   ', p))

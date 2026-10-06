import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const normaliser = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, ' ').replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim()
const sorts = await sql`select id, nom from spells` as any[]
const essais = ['Hébétement','Lumières dansantes','Convocation de monstres I','Graisse','Image silencieuse','Déguisement','Repli expéditif','Fou rire de Tasha','Cécité/surdité','Berceuse','Identification','Ventriloquie','Effacement','Frayeur','Hypnose']
for (const e of essais) {
  const ne = normaliser(e)
  const prochesSub = sorts.filter(s => { const n = normaliser(s.nom); return n.includes(ne.split(' ')[0]) || ne.includes(n.split(' ')[0]) })
  console.log(`« ${e} » →`, prochesSub.slice(0,4).map(s=>`[${s.id}] ${s.nom}`).join(' | ') || 'RIEN')
}
console.log('Total spells:', sorts.length)

import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const norm = (s: string) => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u2019'`]/g, "'")
  .replace(/\s+/g, ' ').trim()

const cat = await sql`SELECT id, nom, type FROM magic_items WHERE id > 278 ORDER BY nom`
const andre = await sql`SELECT id, nom, type, description IS NULL OR btrim(description)='' AS vide FROM magic_items WHERE id <= 278 ORDER BY id`

// mots signifiants d'une ligne d'André, pour proposer des candidats (sans décider)
const stop = new Set(['de','du','des','d','la','le','les','l','a','au','aux','en','et','of','the','contre','+1','+2','+3','+4','+5'])
const motsDe = (s: string) => norm(s).replace(/[^a-z0-9+ ]/g, ' ').split(' ').filter(m => m.length > 2 && !stop.has(m))

console.log('=== 41 LIGNES SANS DESCRIPTION : candidats du catalogue GdM ===')
for (const a of andre.filter(x => x.vide)) {
  const mots = motsDe(a.nom)
  const cands = cat.map(c => {
    const mc = motsDe(c.nom)
    const communs = mots.filter(m => mc.some(x => x.startsWith(m) || m.startsWith(x))).length
    return { nom: c.nom, id: c.id, score: communs / Math.max(1, mots.length) }
  }).filter(c => c.score >= 0.5).sort((x, y) => y.score - x.score).slice(0, 3)
  console.log(`[${a.id}] ${a.nom}  ->  ${cands.length ? cands.map(c => `[${c.id}] ${c.nom} (${c.score.toFixed(2)})`).join(' | ') : '— aucun candidat'}`)
}

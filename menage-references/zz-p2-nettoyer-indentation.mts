// Passe corrective : retire l'indentation markdown des descriptions semées ce soir.
// Garde-fou : UPDATE seulement si nom ET description brute correspondent exactement.
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const fichiers = ['anneaux-nommes.md','sceptres-nommes.md','batons-seul.md','baguettes-seul.md']
let corriges = 0, intacts = 0
for (const f of fichiers) {
  const md = fs.readFileSync(`X:/Claude-Tools/cormac/menage-references/p2-releves/${f}`,'utf8')
  for (const bloc of md.split(/^### /m).slice(1)) {
    const nom = bloc.split('\n')[0].trim()
    const mDesc = bloc.match(/^- description:\s*([\s\S]+)$/m)
    if (!mDesc || /^Règles générales/i.test(nom)) continue
    const brute = mDesc[1].trim()
    const propre = brute.split('\n').map(l=>l.replace(/^[ \t]+/,'')).join('\n')
    if (brute === propre) { intacts++; continue }
    const r = await sql`update magic_items set description=${propre} where nom=${nom} and description=${brute} returning id` as any[]
    if (r.length) corriges += r.length
    else console.log(`  (aucune ligne pour « ${nom} » — déjà propre ou non semée)`)
  }
}
console.log(`${corriges} descriptions nettoyées, ${intacts} déjà sans indentation.`)

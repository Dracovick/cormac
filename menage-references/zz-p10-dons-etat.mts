import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const rows = await sql`
  SELECT f.id, f.nom, f.categorie, f.prerequis, f.description, f.effet_mecanique,
    (SELECT count(*)::int FROM character_feats cf WHERE cf.feat_id = f.id) porteurs
  FROM feats f ORDER BY f.nom` as any[]
console.log(`total=${rows.length}  avec porteur=${rows.filter(r => r.porteurs > 0).length}  sans porteur=${rows.filter(r => !r.porteurs).length}`)
console.log(`avec description=${rows.filter(r => r.description).length}  avec effet=${rows.filter(r => r.effet_mecanique).length}  avec catégorie=${rows.filter(r => r.categorie).length}  avec prérequis=${rows.filter(r => r.prerequis).length}`)
const out = rows.map(r => `[${r.id}]\t${r.porteurs}\t${r.nom}`).join('\n')
fs.writeFileSync('X:/Claude-Tools/cormac/menage-references/zz-p10-dons-liste.txt', out, 'utf8')
console.log('→ zz-p10-dons-liste.txt')

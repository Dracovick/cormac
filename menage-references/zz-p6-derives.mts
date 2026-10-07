import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim()
const tous = await sql`SELECT id, nom, description, portee, duree, composantes, zone_effet, jet_de_sauvegarde, resistance_magique, ecole FROM spells` as any[]
const parNom = new Map(tous.map(s => [norm(s.nom), s]))
const incomplets = tous.filter(s => vide(s.portee) || vide(s.duree))
const sansSource = incomplets.filter(s => !/\[[^\]]+\]$/.test(String(s.description ?? '').trim()))

// « Ce sort est identique à X, si ce n'est que… » / « semblable à X » / « Comme X, »
const RENVOI = /(?:identique|semblable)\s+à\s+\*?([^,.*]+?)\*?\s*(?:,|\.|$)/i
let avecRenvoi = 0, refComplete = 0, refIntrouvable: string[] = [], sansRenvoi: any[] = []
for (const s of sansSource) {
  const m = String(s.description ?? '').match(RENVOI)
  if (!m) { sansRenvoi.push(s); continue }
  avecRenvoi++
  const ref = parNom.get(norm(m[1]))
  if (!ref) { refIntrouvable.push(`${s.nom} → « ${m[1].trim()} »`); continue }
  if (!vide(ref.portee) && !vide(ref.duree)) refComplete++
}
console.log(`incomplets : ${incomplets.length} | sans source indiquée : ${sansSource.length}`)
console.log(`  dont renvoi « identique/semblable à X » : ${avecRenvoi}`)
console.log(`    → référence trouvée ET complète (portée+durée) : ${refComplete}`)
console.log(`    → référence introuvable en base : ${refIntrouvable.length}`)
console.log(`  sans renvoi exploitable : ${sansRenvoi.length}`)
console.log('\n— références introuvables —')
for (const x of refIntrouvable.slice(0, 15)) console.log('  ' + x)
console.log('\n— sans renvoi, échantillon —')
for (const s of sansRenvoi.slice(0, 20)) console.log(`  [${s.id}] ${s.nom} — ${String(s.description ?? '(vide)').replace(/\n/g,' ').slice(0,70)}`)

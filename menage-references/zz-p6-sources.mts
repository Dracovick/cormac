import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const r = await sql`SELECT id, nom, description, portee, duree, composantes FROM spells` as any[]
const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''
const incomplets = r.filter(s => vide(s.portee) || vide(s.duree))
const parSource = new Map<string, any[]>()
for (const s of incomplets) {
  const m = String(s.description ?? '').trim().match(/\[([^\]]+)\]$/)
  const src = m ? m[1] : '(aucune source indiquée)'
  if (!parSource.has(src)) parSource.set(src, [])
  parSource.get(src)!.push(s)
}
console.log(`incomplets (portée ou durée manquante) : ${incomplets.length} sur ${r.length}\n`)
const tri = [...parSource.entries()].sort((a, b) => b[1].length - a[1].length)
for (const [src, liste] of tri) console.log(`  ${String(liste.length).padStart(4)}  ${src}`)
console.log('\n— sans source indiquée, échantillon —')
for (const s of (parSource.get('(aucune source indiquée)') ?? []).slice(0, 20))
  console.log(`  [${s.id}] ${s.nom} — ${String(s.description ?? '(vide)').replace(/\n/g,' ').slice(0, 80)}`)

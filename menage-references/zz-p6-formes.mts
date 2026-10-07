import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''
const tous = await sql`SELECT id, nom, description, portee, duree FROM spells` as any[]
const incomplets = tous.filter(s => vide(s.portee) || vide(s.duree))
// Toutes les fiches incomplètes, pas seulement les « sans source » : un sort de
// supplément peut lui aussi être décrit par renvoi.
const formes = new Map<string, number>()
for (const s of incomplets) {
  const d = String(s.description ?? '').replace(/\s+/g, ' ').trim()
  if (!d) { formes.set('(description vide)', (formes.get('(description vide)') ?? 0) + 1); continue }
  const m = d.match(/^(.{0,60}?)(?:\*?[A-ZÀÉÈÊÎÔÛ][^,.*]{2,}\*?)(?:,|\.)/)
  const tete = d.slice(0, 48)
  const clef = tete.replace(/\*/g, '').replace(/[A-ZÀÉÈÊÎÔÛ][\wÀ-ÿ'’-]*(\s+(de|du|des|la|le|les|d'|l')\s*[\wÀ-ÿ'’-]+)*/g, '§')
  formes.set(clef, (formes.get(clef) ?? 0) + 1)
}
const tri = [...formes.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 30)
for (const [f, n] of tri) console.log(String(n).padStart(4), '  ', f)

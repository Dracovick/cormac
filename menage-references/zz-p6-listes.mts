import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const vide = (v: any) => v === null || v === undefined || String(v).trim() === ''
const tous = await sql`SELECT id, nom, ecole, description, portee, duree FROM spells ORDER BY nom` as any[]
const incomplets = tous.filter(s => vide(s.portee) || vide(s.duree))
const parSource = new Map<string, any[]>()
for (const s of incomplets) {
  const d = String(s.description ?? '').trim()
  const m = d.match(/\[([^\]]+)\]$/)
  const src = m ? m[1] : '(sans source)'
  if (!parSource.has(src)) parSource.set(src, [])
  parSource.get(src)!.push(s)
}
const DISPO: Record<string,string> = {
  'Codex Divin':'CD', 'Codex Profane':'CP', 'Maîtres de la Nature':'MN',
  'MJ de Faerûn':'MF', 'Royaumes Oubliés':'RO', 'Codex Divin / Maîtres de la Nature':'CD-MN',
}
console.log('incomplets :', incomplets.length, '\n')
for (const [src, liste] of [...parSource.entries()].sort((a,b)=>b[1].length-a[1].length)) {
  const code = DISPO[src]
  console.log(`${String(liste.length).padStart(4)}  ${src}${code ? '   ✅ livre disponible ('+code+')' : '   ❌ livre absent'}`)
  if (code) {
    const lignes = liste.map(s => `${s.id}\t${s.nom}\t${s.ecole ?? ''}\t${String(s.description ?? '').replace(/\s+/g,' ')}`).join('\n')
    fs.writeFileSync(`X:/Claude-Tools/cormac/menage-references/p6-listes/${code}.tsv`, 'id\tnom\tecole\tdescription_actuelle\n' + lignes + '\n', 'utf8')
  }
}

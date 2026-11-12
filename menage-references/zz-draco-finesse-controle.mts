/**
 * Contrôle d'après-déploiement : le self-join sur le catalogue d'armes a-t-il
 * dupliqué des lignes d'armes sur les fiches ?
 *
 * Un leftJoin qui ramène plusieurs lignes pour une même arme se verrait ici :
 * le nombre de panneaux « Attaque — … » rendus par la page doit tomber sur le
 * nombre de lignes `character_weapons` en base, fiche par fiche.
 *
 * Témoin DANS le test : une fiche sans arme doit rendre 0, et le total des
 * lignes comparées doit être non nul (sinon le contrôle est vrai sur le vide).
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)![1].trim().replace(/^"|"$/g, '')
const sql = neon(url)

const fiches: any[] = await sql`
  select cw.personnage_id pid, count(*)::int n
  from character_weapons cw group by cw.personnage_id
  order by count(*) desc limit 15`

let compares = 0, ecarts = 0
for (const f of fiches) {
  const r = await fetch(`https://www.dracovick.com/personnage/${f.pid}`, {
    headers: { Cookie: 'cormac_auth=granted' },
  })
  const html = (await r.text()).replace(/\\"/g, '"')
  const vus = (html.match(/"titre":"Attaque — /g) ?? []).length
  compares++
  if (vus !== f.n) { ecarts++; console.log(`  ⚠ [${f.pid}] base ${f.n} lignes, page ${vus}`) }
  else console.log(`  ok [${f.pid}] ${f.n} ligne(s) d'arme`)
}
console.log(`\n=== fiches comparées : ${compares} (doit être > 0) · écarts : ${ecarts}`)

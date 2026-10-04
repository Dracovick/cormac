import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { xpPourNiveau } from '../src/lib/dnd35/rules'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// Qui a reçu de l'XP récemment (journal), et qui est au-dessus du seuil de son niveau+1 ?
const recents = await sql`select j.personnage_id, c.nom, j.description, j.created_at
  from character_journal j join characters c on c.id = j.personnage_id
  where j.type = 'xp' and j.created_at > now() - interval '3 days'
  order by j.created_at desc` as { personnage_id:number; nom:string; description:string; created_at:string }[]
console.log('=== Entrées XP des 3 derniers jours ===')
for (const r of recents) console.log(`${r.created_at}  [${r.personnage_id}] ${r.nom} — ${r.description}`)

const persos = await sql`select c.id, c.nom, c.xp,
    coalesce(json_agg(json_build_object('classe', cl.nom, 'niveau', cc.niveau)) filter (where cc.id is not null), '[]') classes
  from characters c left join character_classes cc on cc.personnage_id = c.id left join classes cl on cl.id = cc.classe_id
  group by c.id order by c.nom` as { id:number; nom:string; xp:number|null; classes:{classe:string;niveau:number}[] }[]

console.log('\n=== Personnages dont l\'XP dépasse le seuil du niveau suivant ===')
for (const p of persos) {
  const nivTotal = p.classes.reduce((s, c) => s + c.niveau, 0)
  const xp = p.xp ?? 0
  // niveau que l'XP justifie
  let nivXp = Math.max(1, nivTotal)
  while (xpPourNiveau(nivXp + 1) <= xp) nivXp++
  if (nivXp > nivTotal && nivTotal > 0) {
    console.log(`[${p.id}] ${p.nom} — niveau ${nivTotal} (${p.classes.map(c=>`${c.classe} ${c.niveau}`).join('/')}), ${xp.toLocaleString('fr-CA')} XP → l'XP justifie le niveau ${nivXp} (seuil ${xpPourNiveau(nivXp).toLocaleString('fr-CA')})`)
  }
}

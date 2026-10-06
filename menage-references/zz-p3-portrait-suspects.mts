// Portrait des entrées existantes trop proches des 13 noms retenus par la garde :
// école, description présente?, niveaux de classe, usage par des personnages.
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const noms = ['Dépeçage', 'Nage', 'Création mineure', 'Cœur de pierre', 'Transmutation de la boue en pierre',
  'Mur de feu', 'Rayon prismatique', 'Entrain', 'Poigne de Bigby', 'Domination', 'Emprisonnement',
  'Bouclier de la foi', 'Colle']
for (const n of noms) {
  const r = await sql`select id, nom, ecole, portee, duree,
      coalesce(left(description, 90), '—') descr
    from spells where nom = ${n}` as any[]
  if (!r.length) { console.log(`« ${n} » : INTROUVABLE par nom exact`); continue }
  for (const s of r) {
    const niv = await sql`select c.nom classe, scl.niveau from spell_class_levels scl join classes c on c.id = scl.classe_id where scl.sort_id = ${s.id} order by c.nom` as any[]
    const usage = await sql`select count(*)::int n from character_spells where sort_id = ${s.id}` as any[]
    console.log(`[${s.id}] « ${s.nom} » — école: ${s.ecole ?? '∅'} | portée: ${s.portee ?? '∅'} | durée: ${s.duree ?? '∅'}`)
    console.log(`     niveaux: ${niv.map((x: any) => `${x.classe} ${x.niveau}`).join(', ') || '∅'} | utilisé par ${usage[0].n} personnage(s)`)
    console.log(`     descr: ${String(s.descr).replace(/\s+/g, ' ')}`)
  }
}

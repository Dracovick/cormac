/** Les 10 lignes « trancher » : leur état réel en base et qui les porte. */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const j = JSON.parse(fs.readFileSync('X:/Claude-Tools/cormac/menage-references/p8-rattachement.json', 'utf8'))
const aTrancher = j.liens.filter((l: any) => l.verdict === 'trancher')
console.log(`à trancher : ${aTrancher.length}\n`)
for (const l of aTrancher) {
  const [w] = await sql`SELECT id, nom, degats, critique_min, critique_mult, portee, type_degats, poids, prix, description, catalogue_id
    FROM weapons WHERE id = ${l.id}` as any[]
  const porteurs = await sql`SELECT c.id, c.nom, cw.bonus_magique, cw.quantite, cw.cote_de_force, cw.bonus_munitions
    FROM character_weapons cw JOIN characters c ON c.id = cw.personnage_id WHERE cw.arme_id = ${l.id}` as any[]
  console.log(`[${l.id}] « ${w.nom} »  cible proposée : ${l.cible ?? '—'}`)
  console.log(`      dé=${w.degats ?? '∅'}  crit=${w.critique_min}/×${w.critique_mult}  portée=${w.portee ?? '∅'}  type=${w.type_degats ?? '∅'}  poids=${w.poids ?? '∅'}  prix=${w.prix ?? '∅'}  cat_id=${w.catalogue_id ?? '∅'}`)
  if (w.description) console.log(`      note : ${String(w.description).slice(0, 160)}`)
  for (const p of porteurs) {
    const autres = await sql`SELECT w2.nom, w2.degats FROM character_weapons cw2 JOIN weapons w2 ON w2.id = cw2.arme_id
      WHERE cw2.personnage_id = ${p.id} AND w2.id <> ${l.id} ORDER BY w2.nom` as any[]
    console.log(`      porté par ${p.nom} (#${p.id})  +mag=${p.bonus_magique} qté=${p.quantite} côte=${p.cote_de_force ?? '∅'} munitions=${p.bonus_munitions ?? '∅'}`)
    console.log(`         ses autres armes : ${autres.map((a: any) => `${a.nom} [${a.degats ?? '∅'}]`).join(' · ') || 'aucune'}`)
  }
  console.log('')
}

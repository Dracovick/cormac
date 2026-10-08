import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const noms = ['Enchevêtrement', 'Arme spirituelle', 'Œil du mage', 'Oeil du mage', 'Doux rappel de Nybor', 'Matrice de la Simbule', 'Bouclier de Lathandre', 'Épée et marteau']
for (const n of noms) {
  const r = await sql`SELECT id, nom, ecole, composantes, portee, duree, zone_effet, jet_de_sauvegarde, resistance_magique FROM spells WHERE nom ILIKE ${n}` as any[]
  if (!r.length) { console.log(`— ${n} : ABSENT de la base`); continue }
  for (const s of r) console.log(`[${s.id}] ${s.nom} | ${s.ecole ?? '—'} | ${s.composantes ?? '—'} | portée ${s.portee ?? '—'} | durée ${s.duree ?? '—'} | ${s.zone_effet ?? '—'} | JdS ${s.jet_de_sauvegarde ?? '—'} | RM ${s.resistance_magique ?? '—'}`)
}

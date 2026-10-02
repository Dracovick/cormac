// Nettoyage des « divers » entrés à la main pour des dons désormais comptés
// automatiquement par la fiche (commit du 2026-10-01, GO d'André en DM).
// Hypothèse appliquée : un divers ≥ 4 chez un porteur du don d'initiative
// incluait le +4 du don — on le retire, le reste survit.
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const initCibles: [number, string, number][] = [
  [86, 'Grimdar', 0],      // 4 → 0 (le 4 = le don)
  [30, 'Tatiana', 1],      // 5 → 1 (4 du don + 1 d'autre chose)
  [27, 'Miridor', 0],      // 4 → 0
  [80, 'Karad Malar', 0],  // 4 → 0
  [39, "L'vethian", 1],    // 5 → 1
]
for (const [id, nom, nouveau] of initCibles) {
  const avant = await sql`select initiative_bonus from character_combat_stats where personnage_id = ${id}` as any[]
  await sql`update character_combat_stats set initiative_bonus = ${nouveau} where personnage_id = ${id}`
  const apres = await sql`select initiative_bonus from character_combat_stats where personnage_id = ${id}` as any[]
  console.log(`[${id}] ${nom} — initiative divers : ${avant[0]?.initiative_bonus} → ${apres[0]?.initiative_bonus}`)
}

// Beastman [57] : « Alertness (+2 listen and Spot) » entré à la main dans les divers
// de Détection et Perception auditive — le don est maintenant compté automatiquement.
const skBefore = await sql`select cs.id, s.nom, cs.modif_divers from character_skills cs
  join skills s on s.id = cs.skill_id
  where cs.personnage_id = 57 and s.nom in ('Détection','Perception auditive')` as any[]
for (const row of skBefore) {
  const nouveau = Math.max(0, (row.modif_divers ?? 0) - 2)
  await sql`update character_skills set modif_divers = ${nouveau} where id = ${row.id}`
  console.log(`[57] Beastman — ${row.nom} divers : ${row.modif_divers} → ${nouveau}`)
}
console.log('Nettoyage terminé.')

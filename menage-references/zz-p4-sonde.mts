import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const comp = await sql`SELECT composantes, count(*)::int n FROM spells
  WHERE composantes IS NOT NULL AND trim(composantes)<>'' GROUP BY 1 ORDER BY n DESC LIMIT 12`
console.log('--- composantes les plus fréquentes en base ---'); console.table(comp)

const g = await sql`SELECT
  count(*) FILTER (WHERE composantes ~ '\mS\M')::int avec_S,
  count(*) FILTER (WHERE composantes ~ '\mG\M')::int avec_G,
  count(*) FILTER (WHERE composantes ~ 'DF')::int avec_DF,
  count(*) FILTER (WHERE composantes ~ 'FD')::int avec_FD
  FROM spells WHERE composantes IS NOT NULL AND trim(composantes)<>''`
console.log('--- notation ---'); console.table(g)

const z = await sql`SELECT count(*)::int n, count(*) FILTER (WHERE zone_effet ~* '^(cible|cibles|effet|zone d)')::int prefixe
  FROM spells WHERE zone_effet IS NOT NULL AND trim(zone_effet)<>''`
console.log('--- zone_effet : combien portent déjà un préfixe de libellé ---'); console.table(z)

const noms = ['Cercle magique contre la Loi','Détection de la Loi','Protection contre le Bien','Rejet du Bien','Blessure grave de groupe','Châtiment sacré','Contrôle mineur des morts-vivants','Courroux de l\'ordre','Marteau du Chaos','Téléportation sans erreur','Ténèbres maudites','Détection du Bien','Détection du Chaos','Cercle magique contre le Bien','Rejet de la Loi','Protection contre la Loi']
console.log('--- les 16 noms sans correspondance : y a-t-il un voisin en base? ---')
for (const n of noms) {
  const racine = n.split(' ').filter(w=>w.length>4)[0] ?? n
  const r = await sql`SELECT id, nom FROM spells WHERE nom ILIKE ${'%'+racine+'%'} ORDER BY nom LIMIT 6`
  console.log(`  ${n}  →  ${r.map((x:any)=>'['+x.id+'] '+x.nom).join(' | ') || 'AUCUN'}`)
}

// Applique la migration 0004 : zone_effet varchar(100) -> text, puis complète
// les 10 zones d'effet tronquées à l'import d'origine (99 caractères + « … »).
// Les fins de texte sont RECONSTITUÉES depuis les règles (SRD 3.5 / suppléments),
// pas vérifiées à l'image — voir le rapport du 2026-09-29 dans le canal.
// Trois corrections de règle au passage, signalées à André :
//   [13] Mur de feu : « diamètre » -> « rayon » (SRD : radius 5 ft/2 niveaux)
//   [30] Feuille morte : « à moins de 6 m » -> « à plus de 6 m » (SRD : no two
//        of which may be MORE than 20 ft. apart)
//   [106] Dispersion : « au moins 6 objets » -> « jusqu'à 6 objets » (up to six)
// Idempotent — relançable sans dommage (verrou optimiste sur la valeur actuelle).
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  const [key, ...vals] = line.split('=')
  if (key?.trim() && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim()
}

// [id, valeur actuelle exacte (verrou), nouvelle valeur complète]
const COMPLETIONS: Array<[number, string, string]> = [
  [13, 'rideau de feu opaque long de 6 m/niveau ou anneau de feu d’un diamètre de 1,50 m/2 niveaux ; dans l…',
       'rideau de feu opaque long de 6 m/niveau ou anneau de feu d’un rayon de 1,50 m/2 niveaux ; dans les deux cas, haut de 6 m'],
  [30, 'un objet ou créature de taille M ou inférieure/niveau, aucun ne devant se trouver à moins de 6 m d’…',
       'un objet ou créature de taille M ou inférieure/niveau, aucun ne devant se trouver à plus de 6 m d’un autre'],
  [71, 'le lanceur de sorts et tous les alliés se trouvant dans un rayonnement de 15 m ou moins centré sur …',
       'le lanceur de sorts et tous les alliés se trouvant dans un rayonnement de 15 m ou moins centré sur lui'],
  [93, 'mur de lames tourbillonnantes de 6 m de long/niveau, ou anneau de lames tourbillonnantes de 1,50 m …',
       'mur de lames tourbillonnantes de 6 m de long/niveau, ou anneau de lames tourbillonnantes de 1,50 m de rayon/2 niveaux ; dans les deux cas, haut de 6 m'],
  [106, 'au moins 6 objets de taille I ou Min, tous situés à moins de 50 cm les uns des autres et dont le po…',
        'jusqu’à 6 objets de taille I ou Min, tous situés à moins de 50 cm les uns des autres et dont le poids total ne dépasse pas 12,5 kg'],
  [208, 'toutes les créatures douées de vision situées dans un rayonnement de 3 m centré sur le lanceur de s…',
        'toutes les créatures douées de vision situées dans un rayonnement de 3 m centré sur le lanceur de sorts'],
  [225, "tornade de 6 m de rayon, jusqu'à 1,50 m de haut/niveau de lanceur de sorts, centrée n'importe où da…",
        "tornade de 6 m de rayon, jusqu'à 1,50 m de haut/niveau de lanceur de sorts, centrée n'importe où dans les limites de portée"],
  [239, 'tous les alliés et ennemis situés dans un rayonnement de 18 m de rayon centré sur le lanceur de sor…',
        'tous les alliés et ennemis situés dans un rayonnement de 18 m de rayon centré sur le lanceur de sorts'],
  [303, "voile de ténèbres semi opaque de 12 m de long max. ou anneau de ténèbres d'un rayon de 4,50 m max. …",
        "voile de ténèbres semi opaque de 12 m de long max. ou anneau de ténèbres d'un rayon de 4,50 m max. ; dans les deux cas, haut de 6 m"],
  [423, 'une arme ou cinquante projectiles contondants, chacun devant être en contact avec un autre durant l…',
        'une arme ou cinquante projectiles contondants, chacun devant être en contact avec un autre durant l’incantation'],
]

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL non défini')
  const sql = neon(url)

  // 1. La colonne passe en text (idempotent : sans effet si déjà text)
  const col = await sql`
    SELECT data_type FROM information_schema.columns
    WHERE table_name = 'spells' AND column_name = 'zone_effet'
  `
  if (col[0].data_type !== 'text') {
    await sql`ALTER TABLE spells ALTER COLUMN zone_effet SET DATA TYPE text`
    console.log('zone_effet : varchar(100) -> text')
  } else {
    console.log('zone_effet : déjà en text')
  }

  // 2. Complétion des 10 valeurs tronquées (verrou optimiste sur la valeur exacte)
  let faits = 0, dejaFaits = 0, inattendus = 0
  for (const [id, actuel, nouveau] of COMPLETIONS) {
    const r = await sql`
      UPDATE spells SET zone_effet = ${nouveau}
      WHERE id = ${id} AND zone_effet = ${actuel}
      RETURNING id
    `
    if (r.length === 1) { faits++; continue }
    const etat = await sql`SELECT zone_effet FROM spells WHERE id = ${id}`
    if (etat[0]?.zone_effet === nouveau) { dejaFaits++ }
    else {
      inattendus++
      console.error(`⚠️ [${id}] valeur inattendue, non touchée : ${etat[0]?.zone_effet?.slice(0, 60)}…`)
    }
  }
  console.log(`complétées : ${faits} | déjà faites : ${dejaFaits} | inattendues (non touchées) : ${inattendus}`)

  // 3. Vérification : plus aucune zone d'effet ne se termine par « … »
  const restants = await sql`SELECT count(*)::int AS n FROM spells WHERE zone_effet LIKE '%…'`
  console.log(`zones se terminant encore par « … » : ${restants[0].n} (attendu : 0)`)
  if (restants[0].n > 0 || inattendus > 0) process.exit(1)
}

migrate().catch(e => { console.error(e); process.exit(1) })

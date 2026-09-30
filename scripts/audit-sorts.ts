import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  const [key, ...vals] = line.split('=')
  if (key?.trim() && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim()
}

async function audit() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL non défini')
  const sql = neon(url)

  // 1. Type actuel de la colonne zone_effet
  const col = await sql`
    SELECT data_type, character_maximum_length FROM information_schema.columns
    WHERE table_name = 'spells' AND column_name = 'zone_effet'
  `
  console.log('zone_effet:', JSON.stringify(col))

  // 2. Valeurs tronquées (au plafond du varchar)
  const tronques = await sql`
    SELECT id, nom, char_length(zone_effet) AS lg, zone_effet
    FROM spells WHERE char_length(zone_effet) >= 100 ORDER BY id
  `
  console.log(`\n--- Tronquées à 100 : ${tronques.length}`)
  for (const t of tronques) console.log(` [${t.id}] ${t.nom} (${t.lg}): ${t.zone_effet}`)

  // 3. Sorts sans définition
  const sansDef = await sql`
    SELECT id, nom FROM spells
    WHERE description IS NULL OR trim(description) = '' ORDER BY id
  `
  console.log(`\n--- Sans définition : ${sansDef.length}`)
  for (const s of sansDef) console.log(` [${s.id}] ${s.nom}`)

  // 4. Gemmaline
  const gemm = await sql`SELECT id, nom FROM characters WHERE nom ILIKE '%emmalin%'`
  console.log('\n--- Gemmaline :', JSON.stringify(gemm))
  if (gemm.length !== 1) return
  const gid = gemm[0].id

  const gclasses = await sql`
    SELECT cc.classe_id, c.nom, cc.niveau FROM character_classes cc
    JOIN classes c ON c.id = cc.classe_id WHERE cc.personnage_id = ${gid}
  `
  console.log('Classes de Gemmaline :', JSON.stringify(gclasses))

  // 5. Sorts du catalogue absents de chez elle
  const total = await sql`SELECT count(*)::int AS n FROM spells`
  const siens = await sql`
    SELECT count(DISTINCT sort_id)::int AS n FROM character_spells WHERE personnage_id = ${gid}
  `
  const absents = await sql`
    SELECT count(*)::int AS n FROM spells s
    WHERE NOT EXISTS (
      SELECT 1 FROM character_spells cs WHERE cs.personnage_id = ${gid} AND cs.sort_id = s.id
    )
  `
  console.log(`\nCatalogue: ${total[0].n} | Gemmaline: ${siens[0].n} | Absents: ${absents[0].n}`)

  // 6. Parmi les absents, combien ont un niveau de Magicien/Ensorceleur dans spell_class_levels?
  const classesRef = await sql`SELECT id, nom FROM classes ORDER BY id`
  console.log('\nClasses (référence) :', classesRef.map(c => `${c.id}=${c.nom}`).join(', '))

  const absentsParClasse = await sql`
    SELECT c.nom AS classe, count(DISTINCT s.id)::int AS n
    FROM spells s
    JOIN spell_class_levels scl ON scl.sort_id = s.id
    JOIN classes c ON c.id = scl.classe_id
    WHERE NOT EXISTS (
      SELECT 1 FROM character_spells cs WHERE cs.personnage_id = ${gid} AND cs.sort_id = s.id
    )
    GROUP BY c.nom ORDER BY n DESC
  `
  console.log('Absents ventilés par classe lanceuse :', JSON.stringify(absentsParClasse, null, 1))

  // Absents sans aucune entrée spell_class_levels
  const absentsSansClasse = await sql`
    SELECT count(*)::int AS n FROM spells s
    WHERE NOT EXISTS (SELECT 1 FROM character_spells cs WHERE cs.personnage_id = ${gid} AND cs.sort_id = s.id)
      AND NOT EXISTS (SELECT 1 FROM spell_class_levels scl WHERE scl.sort_id = s.id)
  `
  console.log('Absents sans aucune classe référencée :', absentsSansClasse[0].n)

  // 7. Répartition niveau/classe des sorts que Gemmaline possède déjà (pour comprendre la convention)
  const echantillon = await sql`
    SELECT cs.sort_id, s.nom, cs.niveau, cs.classe, cs.est_connu, cs.est_prepare
    FROM character_spells cs JOIN spells s ON s.id = cs.sort_id
    WHERE cs.personnage_id = ${gid} ORDER BY cs.niveau, s.nom LIMIT 15
  `
  console.log('\nÉchantillon des sorts actuels de Gemmaline :')
  for (const e of echantillon) console.log(` niv ${e.niveau} [classe=${e.classe ?? 'null'}] connu=${e.est_connu} prep=${e.est_prepare} — ${e.nom}`)
}

audit().catch(e => { console.error(e); process.exit(1) })

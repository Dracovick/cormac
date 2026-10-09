/**
 * SOINS IMPORTANTS / GRANDS SOINS = 3d8+5 — décision d'André (DM, 2026-10-09) :
 * « 5. Remets toutes les potions de soins importants ou de grands soins à 3d8+5 »
 *
 * Le Guide du Maître donne, pour la potion de soins importants (750 po), le
 * sort soins importants au niveau de lanceur minimal : 3d8 + 1 point par
 * niveau de lanceur, soit **3d8+5** à NLS 5. « Grands soins » est le nom de
 * 1re édition de la même potion.
 *
 * Trois écritures, trouvées par un balayage de TOUTES les mentions de
 * « soins importants » et « grands soins » dans potions, magic_items et spells :
 *
 *   1. potions[23].sort_effet — « 3d8+3 , 3 gorgée (1d8) » → « 3d8+5 , … »
 *      (saisie du MJ ; c'est l'arbitrage qu'il rend ici)
 *   2. potions[23].description — le ⚠ qui laissait l'arbitrage ouvert n'a plus
 *      d'objet : il est remplacé par la trace de la décision.
 *   3. magic_items[277].description — « (2d8+3 points de vie, 750 po) » :
 *      ⚠ CELLE-LÀ EST DE MOI, écrite le 2026-10-08. 2d8+3 est le dé de soins
 *      MODÉRÉS. Une fiche de règle fausse se lit à la table comme une règle.
 *
 * Chaque écriture est ANCRÉE : le script refuse d'agir s'il ne retrouve pas
 * exactement la chaîne à corriger, et ne fait rien si elle est déjà corrigée.
 *
 * Usage : npx tsx menage-references/p15-soins-importants.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

const ANCIEN_PARA = "⚠ Le champ *effet* de cette fiche porte « 3d8+3 », saisi à la main. Le livre donne 3d8+5 au niveau de lanceur minimal. Je n'ai pas touché à la saisie : l'arbitrage est au MJ."
const NOUVEAU_PARA = "Le champ *effet* portait « 3d8+3 », saisi à la main. André a tranché pour le livre le 2026-10-09 : c'est 3d8+5."

type Corr = {
  table: 'potions' | 'magic_items'
  id: number
  nomAttendu: string
  champ: 'sort_effet' | 'description'
  avant: string
  apres: string
  motif: string
}

const CORRECTIONS: Corr[] = [
  {
    table: 'potions', id: 23, nomAttendu: 'Potion de soins importants', champ: 'sort_effet',
    avant: '3d8+3', apres: '3d8+5',
    motif: "saisie du MJ ; l'arbitrage du 2026-10-09 la porte au dé du livre. Le reste du champ (« , 3 gorgée (1d8) ») est conservé mot pour mot.",
  },
  {
    table: 'potions', id: 23, nomAttendu: 'Potion de soins importants', champ: 'description',
    avant: ANCIEN_PARA, apres: NOUVEAU_PARA,
    motif: "le ⚠ qui laissait l'arbitrage ouvert n'a plus d'objet.",
  },
  {
    table: 'magic_items', id: 277, nomAttendu: 'Potion de grands soins', champ: 'description',
    avant: '(2d8+3 points de vie, 750 po)', apres: '(3d8+5 points de vie, 750 po)',
    motif: '⚠ MA FAUTE du 2026-10-08 : 2d8+3 est le dé de soins MODÉRÉS.',
  },
]

let faites = 0, deja = 0
for (const c of CORRECTIONS) {
  const r = (await sql.query(`SELECT id, nom, ${c.champ} AS valeur FROM ${c.table} WHERE id = $1`, [c.id])) as any[]
  const row = r[0]
  console.log(`\n=== ${c.table}[${c.id}].${c.champ}`)
  if (!row) throw new Error(`REFUS : ${c.table}[${c.id}] est absente.`)
  if (row.nom !== c.nomAttendu) throw new Error(`REFUS : ${c.table}[${c.id}] se nomme « ${row.nom} », pas « ${c.nomAttendu} ».`)
  const valeur: string = row.valeur ?? ''

  if (valeur.includes(c.apres) && !valeur.includes(c.avant)) {
    console.log('   ✅ déjà corrigé — rien à faire.')
    deja++
    continue
  }
  if (!valeur.includes(c.avant)) {
    throw new Error(`REFUS : la chaîne à corriger est introuvable dans ${c.table}[${c.id}].${c.champ}.\n  cherché : ${JSON.stringify(c.avant)}\n  trouvé  : ${JSON.stringify(valeur.slice(0, 400))}`)
  }
  const occurrences = valeur.split(c.avant).length - 1
  if (occurrences !== 1) throw new Error(`REFUS : ${occurrences} occurrences de la chaîne — un remplacement ne peut pas être ancré.`)

  const neuf = valeur.split(c.avant).join(c.apres)   // split/join : jamais replace() — « $' » serait interprété
  console.log(`   motif : ${c.motif}`)
  console.log(`   avant : …${JSON.stringify(c.avant)}…`)
  console.log(`   après : …${JSON.stringify(c.apres)}…`)
  if (!ECRIRE) { console.log('   (lecture seule — rien écrit)'); faites++; continue }
  await sql.query(`UPDATE ${c.table} SET ${c.champ} = $1 WHERE id = $2`, [neuf, c.id])
  console.log('   ✍  écrit.')
  faites++
}

// --- Balayage de contrôle : plus aucun dé faux à côté du nom ---------------
// Motif VOLONTAIREMENT PLUS LARGE que ce que je corrige : tout dé qui n'est pas
// 3d8+5 dans la même phrase qu'un « soins importants » / « grands soins ».
console.log('\n==================== BALAYAGE DE CONTRÔLE ====================')
const SUSPECT = /(soins? importants?|grands? soins?)[^.;\n]{0,120}?(\d+d\d+(?:\+\d+)?)|(\d+d\d+(?:\+\d+)?)[^.;\n]{0,120}?(soins? importants?|grands? soins?)/gi
let suspects = 0
for (const [table, champs] of [['potions', ['nom', 'sort_effet', 'description']], ['magic_items', ['nom', 'description']]] as const) {
  const rows = (await sql.query(`SELECT id, ${champs.join(',')} FROM ${table}`)) as any[]
  for (const row of rows) {
    for (const champ of champs) {
      const txt: string = row[champ] ?? ''
      SUSPECT.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = SUSPECT.exec(txt))) {
        const de = m[2] ?? m[3]
        if (de === '3d8+5' || de === '1d8') continue   // 1d8 = la gorgée, pas le dé du sort
        suspects++
        console.log(`   ⚠ ${table}[${row.id}] « ${row.nom} ».${champ} → dé « ${de} » : …${txt.slice(Math.max(0, m.index - 60), m.index + 120).replace(/\n/g, ' ⏎ ')}…`)
      }
    }
  }
}
console.log(suspects === 0 ? '   ✅ aucun dé autre que 3d8+5 à côté de « soins importants » / « grands soins ».' : `   ${suspects} mention(s) à regarder (certaines sont légitimes : les trois modèles comparés dans une même phrase).`)

const etat = (await sql`SELECT id, nom, sort_effet FROM potions WHERE id = 23`)[0] as any
console.log(`\npotions[23] « ${etat.nom} » effet = « ${etat.sort_effet} »`)
console.log(ECRIRE ? `\n→ ${faites} écriture(s), ${deja} déjà bonne(s).` : `\n→ ${faites} écriture(s) prête(s), ${deja} déjà bonne(s). Relancer avec --ecrire.`)

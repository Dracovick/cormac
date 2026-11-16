/**
 * Ce que coûterait de porter les huit cercles de DracoVick [4] en VRAIS niveaux
 * de classe de prestige — mesuré sur sa fiche, sans rien changer.
 *
 *   node scripts/mesure-dracovick-niveaux.mjs
 *
 * La conversion 3.5 d'Aleksei Andrievski (pandius.com/sevnpres.html), celle que
 * sa fiche suit cercle par cercle, dit deux choses qui décident de tout :
 *   - le dracologiste a « exactly the same base attack and save bonuses as
 *     wizards » et n'apporte AUCUNE progression de sorts;
 *   - le cercle pair 8 exige un niveau de magicien de 14 au minimum.
 * Donc ses huit cercles s'AJOUTENT à ses seize niveaux de magicien.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()
  .replace(/\r/g, '')
  .replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

const [fiche] = await sql`SELECT id, nom, xp FROM characters WHERE id = 4`
console.log(`[${fiche.id}] ${fiche.nom} — XP = ${fiche.xp}`)

const classes = await sql`
  SELECT cl.nom, cc.niveau FROM character_classes cc
  JOIN classes cl ON cl.id = cc.classe_id WHERE cc.personnage_id = 4 ORDER BY cc.id`
console.log('classes portées :', classes.map(c => `${c.nom} ${c.niveau}`).join(' / '))
/* ⛔ Il n'y a pas de colonne `niveau_total` : le niveau se DÉRIVE de la somme
   des lignes de classe. Le lire ailleurs serait lire un chiffre qui n'existe pas. */
const niveauTotal = classes.reduce((s, c) => s + Number(c.niveau), 0)
console.log('niveau total (somme des lignes de classe) =', niveauTotal)

const [combat] = await sql`
  SELECT pv_max, bba_corps_a_corps, ca_base, ca_arme, ca_naturelle, ca_deflexion, ca_divers
  FROM character_combat_stats WHERE personnage_id = 4`
console.log('PV max =', combat.pv_max, '· BBA corps à corps =', combat.bba_corps_a_corps)

const [comp] = await sql`
  SELECT count(*)::int AS lignes, max(rangs_investis)::int AS rangs_max
  FROM character_skills WHERE personnage_id = 4`
console.log(`compétences : ${comp.lignes} lignes, le plus haut degré de maîtrise = ${comp.rangs_max}`)

/* Le prérequis de la conversion, cercle pair par cercle pair. */
const PREREQUIS = { 4: 7, 6: 10, 8: 14, 10: 18 }
const niveauMagicien = Number(classes.find(c => c.nom === 'Magicien')?.niveau ?? 0)
console.log('\n=== le prérequis de la conversion, vérifié sur sa fiche ===')
for (const [cercle, mini] of Object.entries(PREREQUIS)) {
  const ok = niveauMagicien >= mini
  console.log(`  cercle ${cercle} exige magicien ${mini} — il en a ${niveauMagicien} : ${ok ? 'QUALIFIE' : 'non'}`)
}

console.log('\n=== ce que 8 niveaux de dracologiste ajouteraient (conversion Andrievski) ===')
console.log(`  niveau total : ${niveauTotal} -> ${niveauTotal + 8}`)
console.log('  dé de vie : d4 comme le magicien -> 8d4, soit +8 à +32 PV (moyenne +20)')
console.log('  emplacements de sorts : AUCUN gain — la table ne donne pas de niveau de lanceur')
console.log(`  degré de maîtrise maximal : niveau+3 = ${niveauTotal + 3} -> ${niveauTotal + 11}`)

/**
 * Corrige quatre valeurs de règle du catalogue d'armes, sur GO d'André
 * (DM du 2026-10-08 : « Go corrections et rattachement »).
 *
 * Ces quatre lignes ont été ADOPTÉES par le semis p7 (nom identique, dégâts
 * compatibles) : le semis ne remplit que le vide, il n'écrase jamais une valeur
 * saisie. Elles portaient donc encore la valeur de FileMaker, fausse au livre.
 *
 * Chaque valeur est attestée par DEUX sources indépendantes :
 *   - le relevé à l'image du Manuel des Joueurs VF, table 7-5 (p. 114-121);
 *   - le SRD OGL (d20srd.org/srd/equipment/weapons.htm), en anglais/pieds.
 * La conversion VF du Manuel est de 10 pieds → 3 m.
 *
 * Usage : npx tsx menage-references/p8-corrections-regle.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

type Corr = { id: number; nom: string; champ: 'critique_min' | 'portee'; avant: number; apres: number; source: string }

const corrections: Corr[] = [
  { id: 14,  nom: 'Arbalète Légère',    champ: 'critique_min', avant: 20, apres: 19, source: 'table 7-5 : 19-20/×2 · SRD Crossbow, light 19-20/×2' },
  { id: 11,  nom: 'Épée courte',        champ: 'critique_min', avant: 20, apres: 19, source: 'table 7-5 : 19-20/×2 · SRD Sword, short 19-20/×2' },
  { id: 2,   nom: 'Arc long composite', champ: 'portee',       avant: 30, apres: 33, source: 'table 7-5 : 33 m · SRD Longbow, composite 110 ft' },
  { id: 162, nom: 'Arc court composite',champ: 'portee',       avant: 18, apres: 21, source: 'table 7-5 : 21 m · SRD Shortbow, composite 70 ft' },
]

// Garde-fou : on refuse d'écrire si la ligne n'est pas dans l'état attendu
// (nom, drapeau catalogue, valeur AVANT). Une ligne déjà corrigée ou renommée
// entre-temps ne doit pas être touchée à l'aveugle.
let appliquees = 0, refusees = 0
for (const c of corrections) {
  const [w] = await sql`
    SELECT id, nom, est_catalogue, critique_min, portee,
      (SELECT count(*)::int FROM character_weapons cw WHERE cw.arme_id = weapons.id) porteurs
    FROM weapons WHERE id = ${c.id}` as any[]

  if (!w) { console.log(`✗ [${c.id}] introuvable`); refusees++; continue }
  if (!w.est_catalogue) { console.log(`✗ [${c.id}] « ${w.nom} » n'est pas au catalogue — refus`); refusees++; continue }
  const actuelle = w[c.champ] as number
  if (actuelle === c.apres) { console.log(`= [${c.id}] « ${w.nom} » ${c.champ} déjà à ${c.apres}`); continue }
  if (actuelle !== c.avant) {
    console.log(`✗ [${c.id}] « ${w.nom} » ${c.champ} vaut ${actuelle}, attendu ${c.avant} — refus`); refusees++; continue
  }

  console.log(`${ECRIRE ? '✓' : '·'} [${c.id}] « ${w.nom} » (${w.porteurs} porteur·s) ${c.champ} : ${c.avant} → ${c.apres}`)
  console.log(`     ${c.source}`)
  if (ECRIRE) {
    if (c.champ === 'critique_min') await sql`UPDATE weapons SET critique_min = ${c.apres} WHERE id = ${c.id}`
    else await sql`UPDATE weapons SET portee = ${c.apres} WHERE id = ${c.id}`
  }
  appliquees++
}
console.log(`\n${ECRIRE ? 'appliquées' : 'à appliquer'} : ${appliquees}   refusées : ${refusees}`)
if (!ECRIRE) console.log('Essai à blanc — relancer avec --ecrire.')

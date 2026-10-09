/**
 * La fiche [5] « Gantelets de dextérité +2 » décrit un défaut qui n'existe plus.
 *
 * Je l'ai écrite hier, le 2026-10-09, au moment de la fusion des doublons :
 *
 *   « Le Grimoire, lui, ajoute le +2 de cette ligne directement à la CA.
 *     À vérifier avec le MJ sur les fiches qui portent ces gants. »
 *
 * C'était vrai hier. C'est faux depuis le correctif de la classe d'armure : le
 * `bonus_type` de cette ligne est NULL, donc son +2 n'entre plus dans la CA.
 * Une fiche de règle est lue à la table COMME une règle : laisser cette phrase
 * ferait chercher au MJ un défaut déjà réparé.
 *
 * ⚠ La leçon, celle que je paie pour la deuxième fois en deux jours : corriger
 * une donnée périme la prose qui décrivait le problème, et on ne la trouve
 * qu'en cherchant L'ANCIEN cas, jamais en relisant le nouveau. Balayage fait
 * sur 7 motifs, dans `magic_items`, `potions` et `spells` : cette fiche est la
 * seule atteinte.
 *
 * La phrase de remplacement dit ce qui est vrai maintenant, et nomme ce que le
 * MJ doit faire pour que le bonus compte : saisir la Dextérité magique.
 *
 * Usage : npx tsx menage-references/p16-corriger-note-gantelets.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

const ANCIEN = "⚠ Un bonus de Dextérité n'est pas un bonus de CA : +2 de Dextérité vaut +1 à la CA, +1 à l'initiative et +1 aux jets de Réflexes. Le Grimoire, lui, ajoute le +2 de cette ligne directement à la CA. À vérifier avec le MJ sur les fiches qui portent ces gants."

const NOUVEAU = "⚠ Un bonus de Dextérité n'est pas un bonus de CA : +2 de Dextérité vaut +1 à la CA, +1 à l'initiative et +1 aux jets de Réflexes. Le Grimoire ne compte donc PAS ce +2 dans la classe d'armure (champ « Bonus de » laissé sur « pas de CA »). Pour que les gants agissent, il faut saisir **Dextérité magique +2** dans l'onglet Caractéristiques de la fiche : tout le reste en découle alors tout seul — CA, initiative, Réflexes et attaques à distance."

const [avant] = await sql`SELECT id, nom, description FROM magic_items WHERE id = 5` as { id: number; nom: string; description: string }[]
if (!avant) { console.error('⛔ la ligne [5] n\'existe plus.'); process.exit(1) }

if (!avant.description.includes(ANCIEN)) {
  if (avant.description.includes(NOUVEAU)) {
    console.log('✓ La note est déjà corrigée — rien à écrire, le script est rejouable.')
    process.exit(0)
  }
  console.error('⛔ ARRÊT — la phrase à corriger est introuvable dans la fiche [5].')
  console.error('   La description a changé depuis mon relevé : ne rien écrire à l\'aveugle.')
  process.exit(1)
}

console.log(`[5] ${avant.nom}\n`)
console.log('  AVANT : ' + ANCIEN + '\n')
console.log('  APRÈS : ' + NOUVEAU + '\n')

if (!ECRIRE) { console.log('(simulation — relancer avec --ecrire)'); process.exit(0) }

fs.writeFileSync('X:/Claude-Tools/cormac/menage-references/p16-note-gantelets-avant.txt', avant.description, 'utf8')
// split/join plutôt que replace : un texte de remplacement est interprété, et
// un « $' » y recopierait la fin de la chaîne (leçon du 2026-10-07).
await sql`UPDATE magic_items SET description = ${avant.description.split(ANCIEN).join(NOUVEAU)} WHERE id = 5`

const [apres] = await sql`SELECT description FROM magic_items WHERE id = 5` as { description: string }[]
const ok = apres.description.includes(NOUVEAU) && !apres.description.includes('ajoute le +2 de cette ligne directement à la CA')
console.log(ok ? '✓ Note corrigée en base.' : '✗ ÉCART — vérifier à la main.')
process.exit(ok ? 0 : 1)

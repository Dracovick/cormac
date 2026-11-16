/* Contrôles du repli de statut des spécialités de compétence.
 *
 *   npx tsx scripts/controle-specialites-competences.mts
 *
 * Ce que le repli doit faire : « Profession (joueur) » hérite du statut de
 * « Profession » (compétence de classe, formation requise), et « Artisanat
 * (tissage) » de celui de ses sœurs de la table 4–2 quand elles sont unanimes.
 *
 * ⛔ Ce qu'il ne doit SURTOUT pas faire : toucher à la caractéristique. Les
 * contrôles 20 à 23 sont là pour ça — une caractéristique qui changerait ferait
 * bouger un total déjà imprimé sur une feuille de personnage.
 */
import {
  getCompetenceRef,
  caracteristiqueDe,
  estCompetenceDeClasse,
  formationRequiseDe,
  COMPETENCES_DND35,
} from '../src/lib/dnd35/skills'

let n = 0
let echecs = 0
const verifier = (titre: string, obtenu: unknown, attendu: unknown) => {
  n++
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (!ok) { echecs++; console.log(`  ❌ ${n}. ${titre} — obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`) }
  else console.log(`  ✅ ${n}. ${titre}`)
}

console.log('— Voie exacte : rien ne change pour les noms déjà connus de la table')
verifier('Profession / Roublard', estCompetenceDeClasse('Profession', ['Roublard']), true)
verifier('Profession / Guerrier (absent de la table 4-2)', estCompetenceDeClasse('Profession', ['Guerrier']), false)
verifier('Crochetage / Roublard', estCompetenceDeClasse('Crochetage', ['Roublard']), true)
verifier('Crochetage / Magicien', estCompetenceDeClasse('Crochetage', ['Magicien']), false)

console.log('\n— Repli 1 : la compétence générique de même base')
verifier('Profession (joueur) / Roublard', estCompetenceDeClasse('Profession (joueur)', ['Roublard']), true)
verifier('Profession (joueur) / Bretteur', estCompetenceDeClasse('Profession (joueur)', ['Bretteur']), true)
verifier('Profession (joueur) / Roublard+Bretteur (Duncan)', estCompetenceDeClasse('Profession (joueur)', ['Roublard', 'Bretteur']), true)
verifier('Profession (joueur) / Guerrier', estCompetenceDeClasse('Profession (joueur)', ['Guerrier']), false)
verifier('Profession (apothicaire) / Magicien', estCompetenceDeClasse('Profession (apothicaire)', ['Magicien']), true)
verifier('Représentation (danse) / Roublard', estCompetenceDeClasse('Représentation (danse)', ['Roublard']), true)
verifier('Représentation (flûte) / Druide', estCompetenceDeClasse('Représentation (flûte)', ['Druide']), false)

console.log('\n— Repli 2 : les sœurs de la table, à l’unanimité seulement')
verifier('Artisanat (tissage) / Guerrier', estCompetenceDeClasse('Artisanat (tissage)', ['Guerrier']), true)
verifier('Artisanat (serrurerie) / Moine', estCompetenceDeClasse('Artisanat (serrurerie)', ['Moine']), true)
verifier('Connaissances (dragons) / Magicien — les 10 sœurs l’ont', estCompetenceDeClasse('Connaissances (dragons)', ['Magicien']), true)
verifier('Connaissances (dragons) / Druide — pas unanime', estCompetenceDeClasse('Connaissances (dragons)', ['Druide']), false)
verifier('Connaissances (dragons) / Prêtre — pas unanime', estCompetenceDeClasse('Connaissances (dragons)', ['Prêtre']), false)

console.log('\n— Les noms maison restent hors-classe, comme avant')
verifier('Magie divine / Prêtre (aucune parenthèse)', estCompetenceDeClasse('Magie divine', ['Prêtre']), false)
verifier('Alchimie / Magicien', estCompetenceDeClasse('Alchimie', ['Magicien']), false)
verifier('Heal (2 pv x jour x niv.) / Prêtre — base inconnue', estCompetenceDeClasse('Heal (2 pv x jour x niv.)', ['Prêtre']), false)
verifier('⛔ garde du tableau vide : Zzz (xxx) / Magicien', estCompetenceDeClasse('Zzz (xxx)', ['Magicien']), false)
verifier('personnage sans classe : Profession (joueur) / []', estCompetenceDeClasse('Profession (joueur)', []), false)

console.log('\n— ⛔ La caractéristique ne bouge pour PERSONNE')
verifier('Profession (charpentier) saisi DEX reste DEX', caracteristiqueDe('Profession (charpentier)', 'DEX'), 'DEX')
verifier('Profession (poterie) saisi INT reste INT', caracteristiqueDe('Profession (poterie)', 'INT'), 'INT')
verifier('Représentation (flûte) saisi SAG reste SAG', caracteristiqueDe('Représentation (flûte)', 'SAG'), 'SAG')
verifier('Profession (joueur) saisi SAG reste SAG', caracteristiqueDe('Profession (joueur)', 'SAG'), 'SAG')
verifier('Psychologie saisi CHA est corrigé en SAG (table 4-2, inchangé)', caracteristiqueDe('Psychologie', 'CHA'), 'SAG')

console.log('\n— getCompetenceRef garde son contrat : nom exact, rien d’autre')
verifier('getCompetenceRef(Profession (joueur)) = undefined', getCompetenceRef('Profession (joueur)'), undefined)
verifier('getCompetenceRef(Profession) trouvé', getCompetenceRef('Profession')?.nom, 'Profession')

console.log('\n— Formation requise, même repli, même garde')
verifier('Profession (joueur) exige une formation', formationRequiseDe('Profession (joueur)'), true)
verifier('Artisanat (tissage) n’en exige pas', formationRequiseDe('Artisanat (tissage)'), false)
verifier('Magie divine (nom maison)', formationRequiseDe('Magie divine'), false)

console.log('\n— Témoins de cohérence de la table elle-même')
verifier('la table 4-2 porte bien 47 entrées', COMPETENCES_DND35.length, 47)
verifier('« Profession » générique y est', COMPETENCES_DND35.some(c => c.nom === 'Profession'), true)
verifier('« Artisanat » générique n’y est PAS (d’où le repli 2)', COMPETENCES_DND35.some(c => c.nom === 'Artisanat'), false)

console.log(`\n${n} contrôles, ${echecs} échec(s).`)
if (echecs > 0) process.exit(1)

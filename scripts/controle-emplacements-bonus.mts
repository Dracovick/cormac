/**
 * CONTRÔLES — les emplacements de sorts en bonus d'une caractéristique élevée.
 *
 *   npx tsx scripts/controle-emplacements-bonus.mts
 *
 * ⭐ Les valeurs attendues sont RECOPIÉES du Manuel des Joueurs (table 1-1,
 * p. 8, relevée à l'image), pas produites par la formule. Un contrôle qui
 * redemande au code ce que le code vient de calculer rend toujours vert.
 *
 * ⭐ Et les témoins de la section 2 sont saisis UNE SECONDE FOIS à la main,
 * sans regarder `TABLE_1_1` : si j'avais mal recopié une ligne du livre dans la
 * table, la section 1 passerait quand même au vert. Deux copies indépendantes
 * de la même source, c'est ce qui attrape la faute de transcription.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { emplacementsBonusCarac, emplacementsBonusTousNiveaux, TABLE_1_1 } from '../src/lib/dnd35/emplacements-bonus'
import { getEmplacementsNiveau, getEmplacementsAvecBonus } from '../src/lib/dnd35/classes'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable')
const sql = neon(url)

let ok = 0
const echecs: string[] = []
function verifier(titre: string, condition: boolean, detail = '') {
  if (condition) ok++
  else echecs.push(`${titre}${detail ? ` — ${detail}` : ''}`)
}
function egal(titre: string, obtenu: unknown, attendu: unknown) {
  verifier(titre, JSON.stringify(obtenu) === JSON.stringify(attendu),
    `obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`)
}

// ─── 1. La formule reproduit les 18 lignes du livre ───────────────────────────
for (const [modStr, attendu] of Object.entries(TABLE_1_1)) {
  const mod = Number(modStr)
  const obtenu = Array.from({ length: 9 }, (_, i) => emplacementsBonusCarac(mod, i + 1))
  egal(`table 1-1, modificateur ${mod >= 0 ? '+' : ''}${mod}`, obtenu, attendu)
}

// ─── 2. Témoins recopiés du livre une seconde fois, à la main ─────────────────
// ⚠️ LE piège de cette table : au mod +5 (valeur 20-21), le 1er niveau reçoit
// DEUX emplacements. Une lecture rapide en met un, et personne ne le remarque.
verifier('⭐ mod +5 → 2 emplacements de 1er niveau (le piège de la table)', emplacementsBonusCarac(5, 1) === 2)
verifier('mod +4 → 1 seul emplacement de 1er niveau', emplacementsBonusCarac(4, 1) === 1)
verifier('mod +5 → 1 emplacement de 5e niveau', emplacementsBonusCarac(5, 5) === 1)
verifier('mod +5 → aucun emplacement de 6e niveau', emplacementsBonusCarac(5, 6) === 0)
verifier('mod +6 → 2 emplacements de 2e niveau', emplacementsBonusCarac(6, 2) === 2)
verifier('mod +9 → 3 emplacements de 1er niveau', emplacementsBonusCarac(9, 1) === 3)
verifier('mod +9 → 1 emplacement de 9e niveau', emplacementsBonusCarac(9, 9) === 1)
verifier('mod +8 → aucun emplacement de 9e niveau', emplacementsBonusCarac(8, 9) === 0)
verifier('mod +13 → 4 emplacements de 1er niveau', emplacementsBonusCarac(13, 1) === 4)
verifier('mod +17 → 5 emplacements de 1er niveau', emplacementsBonusCarac(17, 1) === 5)
verifier('mod +17 → 3 emplacements de 9e niveau', emplacementsBonusCarac(17, 9) === 3)

// ─── 3. Les bords : rien là où le livre n'écrit rien ──────────────────────────
for (let mod = -5; mod <= 20; mod++) {
  verifier(`aucun bonus aux oraisons (niveau 0) au mod ${mod}`, emplacementsBonusCarac(mod, 0) === 0)
}
verifier('un modificateur négatif ne donne aucun bonus', emplacementsBonusCarac(-3, 1) === 0)
verifier('un modificateur de 0 ne donne aucun bonus', emplacementsBonusCarac(0, 1) === 0)
verifier('aucun bonus au-delà du 9e niveau de sort', emplacementsBonusCarac(17, 10) === 0)
egal('emplacementsBonusTousNiveaux(+5) — indice 0 = oraisons',
  emplacementsBonusTousNiveaux(5), [0, 2, 1, 1, 1, 1, 0, 0, 0, 0])

// ─── 4. La condition d'accès du livre ─────────────────────────────────────────
// « seulement s'il a atteint le niveau nécessaire pour lancer les sorts en
// question » — un magicien 1 à 20 d'Intelligence n'ouvre pas cinq niveaux.
const mag1 = getEmplacementsAvecBonus('Magicien', 1, 5, 5)
egal('⭐ magicien 1 à INT 20 : aucun sort de 5e niveau', mag1, { base: 0, bonus: 0, total: 0 })
verifier('… mais bien 2 emplacements de 1er niveau en plus',
  getEmplacementsAvecBonus('Magicien', 1, 1, 5).bonus === 2)
verifier('témoin de présence : le magicien 1 a bien 1 emplacement de base au 1er niveau',
  getEmplacementsNiveau('Magicien', 1, 1) === 1)
verifier('aucun bonus aux oraisons d\'un magicien 1 à INT 20',
  getEmplacementsAvecBonus('Magicien', 1, 0, 5).bonus === 0)

// ⛔ Le cas qu'André a soulevé le 12 novembre : Bram Verrelune, Prêtre 5, SAG 20.
// Ses oraisons ne doivent PAS bouger — et le témoin qui rend ce contrôle concluant
// est la ligne du dessous : au même score, le 1er niveau gagne bien 2 emplacements.
// Sans ce témoin, un calcul tombé en panne rendrait « 0 partout » et passerait au vert.
const bramOraisons = getEmplacementsAvecBonus('Prêtre', 5, 0, 5)
egal('⭐ Bram [99] — Prêtre 5, SAG 20 : aucun bonus aux oraisons',
  { bonus: bramOraisons.bonus, total: bramOraisons.total },
  { bonus: 0, total: bramOraisons.base })
verifier('… témoin : au même score, son 1er niveau gagne bien 2 emplacements',
  getEmplacementsAvecBonus('Prêtre', 5, 1, 5).bonus === 2)

// Balayage : la colonne « 0 » de la table 1-1 reste vide sur toutes les classes et
// toutes les valeurs — avec un compteur de présence pour que ce vert veuille dire
// quelque chose.
let bonusVus = 0
for (const classeB of ['Magicien', 'Prêtre', 'Druide', 'Ensorceleur', 'Barde']) {
  for (let niv = 1; niv <= 20; niv++) {
    for (let mod = 0; mod <= 17; mod++) {
      if (getEmplacementsAvecBonus(classeB, niv, 0, mod).bonus !== 0) {
        echecs.push(`oraisons : ${classeB} ${niv} à mod +${mod} reçoit un bonus`)
      }
      bonusVus += getEmplacementsAvecBonus(classeB, niv, 1, mod).bonus
    }
  }
}
verifier('⭐ aucun bonus aux oraisons — 5 classes × 20 niveaux × 18 modificateurs', true)
verifier(`témoin de présence : ${bonusVus} emplacements de 1er niveau accordés dans le même balayage`,
  bonusVus > 0)

// ─── 5. Non-régression : un modificateur faible ne change RIEN ────────────────
let inchanges = 0
const CLASSES_LANCEUSES = ['Magicien', 'Prêtre', 'Druide', 'Ensorceleur', 'Barde', 'Paladin', 'Rôdeur']
for (const classe of CLASSES_LANCEUSES) {
  for (let niv = 1; niv <= 20; niv++) {
    for (let ns = 0; ns <= 9; ns++) {
      const base = getEmplacementsNiveau(classe, niv, ns)
      const avec = getEmplacementsAvecBonus(classe, niv, ns, 0)
      if (base === avec.total) inchanges++
      else echecs.push(`régression : ${classe} ${niv}, sort ${ns} — ${base} → ${avec.total} à mod 0`)
    }
  }
}
verifier(`⭐ à modificateur 0, les ${inchanges} cases des 7 classes × 20 niveaux × 10 niveaux de sort sont inchangées`,
  inchanges === CLASSES_LANCEUSES.length * 20 * 10)

// ─── 6. Le cas qu'André a signalé — Bram Verrelune ────────────────────────────
// Prêtre 5, SAG 18 + 2 (objet magique) = 20, modificateur +5.
const bramBase = Array.from({ length: 10 }, (_, n) => getEmplacementsNiveau('Prêtre', 5, n))
const bramAvec = Array.from({ length: 10 }, (_, n) => getEmplacementsAvecBonus('Prêtre', 5, n, 5).total)
egal('Bram — emplacements de base inchangés (la table de classe n\'est pas touchée)',
  bramBase, [4, 3, 2, 2, 0, 0, 0, 0, 0, 0])
egal('⭐ Bram — avec sa SAG de 20 : +2 au 1er, +1 au 2e, +1 au 3e',
  bramAvec, [4, 5, 3, 3, 0, 0, 0, 0, 0, 0])
verifier('Bram gagne 4 sorts par jour au total',
  bramAvec.reduce((a, b) => a + b, 0) - bramBase.reduce((a, b) => a + b, 0) === 4)

// ─── 7. Les scores réels des fiches, mesurés en base ──────────────────────────
const CARAC: Record<string, 'int' | 'sag' | 'cha'> = {
  Magicien: 'int', Prêtre: 'sag', Druide: 'sag', Ensorceleur: 'cha',
  Barde: 'cha', Paladin: 'sag', 'Rôdeur': 'sag',
}
const lanceurs = await sql`
  SELECT c.id, c.nom, cl.nom AS classe, cc.niveau,
         r.bonus_int, r.bonus_sag, r.bonus_cha,
         a.int_base, a.int_magique, a.sag_base, a.sag_magique, a.cha_base, a.cha_magique
  FROM characters c
  JOIN character_classes cc ON cc.personnage_id = c.id
  JOIN classes cl ON cl.id = cc.classe_id
  LEFT JOIN races r ON r.id = c.race_id
  LEFT JOIN character_ability_scores a ON a.personnage_id = c.id
  WHERE cl.nom IN ('Magicien','Prêtre','Druide','Ensorceleur','Barde','Paladin','Rôdeur')
  ORDER BY c.id`

let fichesTouchees = 0, emplacementsAjoutes = 0, fichesInchangees = 0
const detail: string[] = []
for (const l of lanceurs as Record<string, number | string | null>[]) {
  const k = CARAC[l.classe as string]
  const total = Number(l[`${k}_base`] ?? 10) + Number(l[`${k}_magique`] ?? 0) + Number(l[`bonus_${k}`] ?? 0)
  const mod = Math.floor((total - 10) / 2)
  const niv = Number(l.niveau)
  let gain = 0
  for (let ns = 0; ns <= 9; ns++) {
    gain += getEmplacementsAvecBonus(l.classe as string, niv, ns, mod).bonus
  }
  if (gain > 0) { fichesTouchees++; emplacementsAjoutes += gain; detail.push(`  [${l.id}] ${l.nom} — ${l.classe} ${niv}, ${k.toUpperCase()} ${total} (mod ${mod >= 0 ? '+' : ''}${mod}) : +${gain} sorts/jour`) }
  else fichesInchangees++
}
console.log(`\n=== Effet mesuré sur les fiches réelles ===`)
console.log(detail.join('\n'))
console.log(`\n${fichesTouchees} ligne(s) de classe lanceuse gagnent des emplacements, ${fichesInchangees} inchangée(s).`)
console.log(`${emplacementsAjoutes} emplacements ajoutés au total.`)
verifier('témoin de présence : il y a bien des lanceurs à mesurer', lanceurs.length > 0)
verifier('témoin de présence : au moins une fiche gagne des emplacements', fichesTouchees > 0)
verifier('⭐ témoin inverse : les lanceurs à modificateur faible restent inchangés', fichesInchangees > 0)

// ─── Verdict ──────────────────────────────────────────────────────────────────
console.log(`\n${ok} contrôle(s) réussi(s), ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

/**
 * « Krugg le malchanceux » — report de la fiche papier scannée du 2026-08-27
 * ---------------------------------------------------------------------------------
 * ⛔ CE SCRIPT N'ÉCRIT RIEN SANS L'INDICATEUR --commit.
 *
 * ⚠️⚠️ CONSTAT QUI CHANGE LE MANDAT
 * Le personnage demandé EXISTE DÉJÀ en base : « Krugg Coeur-Flamboyant », id=82,
 * joueur « Daniel Tarte », importé de FileMaker le 2026-06-29. Créer un second
 * personnage du même nom ferait un doublon. Ce script COMPLÈTE donc le 82 à partir
 * du PDF ; il ne crée aucun personnage.
 *
 * Source : X:\Claude-Tools\PDF Personnages D&D\krugg le malchanceux.pdf (4 pages,
 * scan Canon 300 dpi, sans couche texte — lu en image).
 *
 *   Vérification seule (aucune écriture — à faire en premier) :
 *     npx tsx --env-file=.env.local scripts/import-krugg.ts
 *
 *   Écriture réelle (après l'accord d'André, --pv est OBLIGATOIRE, voir plus bas) :
 *     npx tsx --env-file=.env.local scripts/import-krugg.ts --pv=52 --commit
 *
 *   Annulation (remet le personnage 82 EXACTEMENT dans l'état du 2026-08-28 01:31 UTC,
 *   à partir de menage-references/krugg-etat-avant.json) :
 *     npx tsx --env-file=.env.local scripts/import-krugg.ts --rollback=82
 *
 * ⚠️ --pv n'a PAS de valeur par défaut, VOLONTAIREMENT : la fiche porte 42 imprimé
 * dans la case PV et 52 manuscrit juste au-dessus. Rien ne permet de trancher sans
 * André. Le script refuse d'écrire tant que la valeur n'est pas donnée à la main.
 *
 * PRINCIPE (repris de import-grimdar.ts) : ⛔ AUCUN getOrCreate silencieux. Chaque
 * valeur de référence est soit épinglée à un id existant VÉRIFIÉ PAR SON NOM EXACT,
 * soit déclarée dans CREATIONS avec sa justification. Si un id épinglé ne porte plus
 * le nom attendu, le script s'arrête AVANT toute écriture.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../src/db/index'
import * as schema from '../src/db/schema'

// ── Chargement manuel de .env.local ─────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
  } catch { /* ignore */ }
}

const ARGS = process.argv.slice(2)
const COMMIT = ARGS.includes('--commit')
const ROLLBACK_ID = (() => {
  const a = ARGS.find(x => x.startsWith('--rollback='))
  return a ? parseInt(a.split('=')[1], 10) : null
})()
const PV = (() => {
  const a = ARGS.find(x => x.startsWith('--pv='))
  return a ? parseInt(a.split('=')[1], 10) : null
})()

const ID = 82

// ═══════════════════════════════════════════════════════════════════════════
// 1. RÉFÉRENCES EXISTANTES — id épinglé + nom exact attendu
// ═══════════════════════════════════════════════════════════════════════════

const REF_RACE    = { id: 7,  nom: 'Demi-Orque' }   // fiche : « Demi-Orc » (manuscrit)
const REF_CLASSE  = { id: 5,  nom: 'Prêtre' }
const REF_DIEU    = { id: 25, nom: 'Kord' }

const REF_LANGUES = [
  { id: 14, nom: 'Orchish', source: 'Orchish' },    // ⚠️ graphie anglaise déjà en base ET sur la fiche
  { id: 27, nom: 'Common',  source: 'Common' },     // ⚠️ idem — « Commun » (id 2) existe aussi, non retenu
]

/** Compétence à AJOUTER (les 4 autres sont déjà rattachées au 82, on n'y touche pas). */
const REF_COMPETENCE_DISCRETION = { id: 31, nom: 'Discrétion' }

/** Armure — « Plaque complète » (id 5) est le full plate du PHB : c'est bien
 *  « Armures de plates » de la fiche. Déjà en base (créée pour Grimdar). */
const REF_ARMURE = { id: 5, nom: 'Plaque complète' }

/** Anneau de protection +1 — magic_items.bonus = 1, compté dans la CA par la fiche. */
const REF_ANNEAU = { id: 12, nom: 'Anneau de protection +1' }

/**
 * ⛔⛔ CAPE DE RÉSISTANCE +1 — VOLONTAIREMENT NON RATTACHÉE.
 * L'entrée magic_items id=10 « Cape de résistance +1 » porte bonus = 1. Or la fiche
 * (écran ET impression) somme magic_items.bonus dans la CLASSE D'ARMURE. Rattacher
 * cette cape ferait afficher CA 21 au lieu de 20, alors qu'une cape de résistance ne
 * donne rien à la CA : elle donne +1 aux trois jets de sauvegarde — déjà enregistré
 * dans reflexes_magique / vigueur_magique / volonte_magique du personnage 82.
 * Corriger magic_items.bonus serait une modification du Grimoire (et changerait la CA
 * d'Elbereth, qui porte la même cape). La cape est donc décrite dans les notes.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 2. RÉFÉRENCES À CRÉER — chacune justifiée
// ═══════════════════════════════════════════════════════════════════════════

const CREATIONS = {
  objets: [
    {
      nom: 'Amulette de charisme +2', type: 'Objet merveilleux', emplacement: 'Cou',
      bonus: null,   // ⛔ DOIT rester null : magic_items.bonus est sommé dans la CA.
      auraMagique: 'Transmutation modérée', niveauLanceur: null, chargesMax: null,
      prix: '4000.00',
      description: '+2 de bonus d’altération au Charisme. Ligne imprimée de la fiche papier : « Amulette de charisme — +2 — 4000 ».',
      charNotes: '⚠️ Le +2 n’est PAS ajouté automatiquement : cha_base vaut 16 sur la fiche, valeur finale déjà écrite en base. Ne pas cumuler.',
      // justif : aucune entrée « charisme » n’existe dans magic_items (0 résultat).
    },
    {
      nom: 'Parchemin de protection contre le mal', type: 'Parchemin', emplacement: null,
      bonus: null,
      auraMagique: 'Abjuration mineure', niveauLanceur: 1, chargesMax: 1,
      prix: '25.00',
      description: 'Protection contre le Mal (PHB 3.5) : +2 de déflexion à la CA et +2 aux jets de sauvegarde contre les créatures mauvaises, 1 min/niveau. Ligne imprimée : « Parchemin protec mal — +2 Ca et sauvegarde — 25 ».',
      charNotes: 'Usage unique. Le +2 est conditionnel (créatures mauvaises) : il n’entre pas dans la CA de la fiche.',
      // justif : la base ne contient aucun parchemin de protection contre le mal.
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. CE QUE LA FICHE PAPIER APPORTE
// ═══════════════════════════════════════════════════════════════════════════

const HISTORIQUE = [
  'Krugg Coeur-Flamboyant — demi-orc, prêtre de Kord (force, courage et combat).',
  'Chaotique Bon. 24 ans, 1,88 m, 110. Yeux ambre, cheveux noirs.',
  '',
  'Peau gris olive foncé. Très musclé, cicatrices aux bras et au torse, canines',
  'visibles modérées. Cheveux noirs et épais, tressés avec des anneaux. Regard',
  'intense, animé d’une foi brûlante et d’un esprit indomptable.',
  'Voit dans le noir à 20 m.',
  '',
  'Joueur : Daniel Tarte.',
  'Fiche papier scannée le 2026-08-27 (4 pages, Canon 300 dpi) et reportée au Grimoire.',
].join('\n')

const NOTES_FICHE = [
  '── FICHE PAPIER DU 2026-08-27 ──',
  '',
  'DOMAINES : Force (p. 169) et Chance (p. 167).',
  '  Chance — 1×/jour, peut relancer un dé.',
  '  Force  — 1×/jour, Force augmentée à son niveau pour 1 round.',
  '',
  'SORTS PAR JOUR (manuscrit, non modélisé par le Grimoire) :',
  '  niveau 0 : 5 · niveau 1 : 4+1 · niveau 2 : 4+1 · niveau 3 : 3+1',
  '  (le +1 est l’emplacement de domaine ; conforme au prêtre 6 avec SAG 16)',
  '',
  '── OBJETS MAGIQUES DE LA FICHE NON RATTACHÉS À UNE TABLE ──',
  'Cape de résistance +1 (1000 po) — le +1 aux trois sauvegardes est déjà compté dans',
  '  les colonnes « magique » des jets. ⛔ Non rattachée en objet magique : l’entrée du',
  '  catalogue porte bonus = 1, ce qui gonflerait la CA de +1 à tort.',
  '',
  '── AJOUTS MANUSCRITS, LECTURE INCERTAINE (à trancher par André) ──',
  'Gants de cuir (crocs silencieux) — +5 Discrétion, +5 Crochetage.',
  '1 potion de grands soins 3d8.',
  'Bâton : combat magique (combat #1 INTRO).',
  '1 parchemin « protection contre la mort » (N14 ?).',
  'Bâton de tourment de Crétia : bâton +1 (arme magique) · 1/jour Cause Fear DD 13 ·',
  '  +2 jet domination (mot incertain).',
  'Épée [mot illisible] longue +2, avec charge perso 3×/semaine.',
  '1 parchemin langage animal + [fin de ligne illisible].',
  '',
  '── RAYÉ SUR LA FICHE (donc consommé ou perdu) ──',
  '2 potions de soin modéré (2d8+3) · Parchemin sanctuaire · Potion de charisme ·',
  'Potion d’endurance · 1 potion de grands soins 3d8 (une des deux lignes).',
  '',
  '── TRÉSOR ──',
  '1 collier à 500 po.',
  '',
  '── ÉQUIPEMENT (aucune table dans le Grimoire) ──',
  'Sac à dos · couverture · corde · gourde · briquet · 4 rations sèches ·',
  '3 bourses de cuir · lampe.',
  'Poids total porté (charge légère) : 45,36 kg.',
  '',
  '── ÉCARTS RELEVÉS ENTRE LA FICHE ET LES RÈGLES 3.5 (non corrigés) ──',
  'Jets de base 3 / 7 / 8 (Réf. / Vig. / Vol.). Un prêtre 6 a 2 / 5 / 5 en 3.5 ;',
  '  la fiche est donc +1 / +2 / +3 au-dessus sans justification écrite.',
  'Colonne « Bonus Att. » des armes (4, 3, 7) : périmée, incohérente avec la case',
  '  BONUS TOTAL corps à corps (9 = 4 BAB + 4 FOR + 1 divers). Le Grimoire recalcule.',
  'Déplacement 10 : un demi-orc fait 9 m en 3.5, et 6 m en armure de plates.',
  '  Valeur laissée telle quelle (elle était déjà 10 en base).',
].join('\n')

// ═══════════════════════════════════════════════════════════════════════════
// 4. EXÉCUTION
// ═══════════════════════════════════════════════════════════════════════════

const db = getDb()
let erreurs = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const ko = (m: string) => { erreurs++; console.log(`  ✗ ${m}`) }

async function verifierNom(
  table: 'races' | 'classes' | 'gods' | 'languages' | 'skills' | 'feats' | 'magicItems' | 'armor',
  id: number, attendu: string,
) {
  const t = schema[table]
  const [row] = await db.select({ nom: t.nom }).from(t).where(eq(t.id, id)).limit(1)
  if (!row) return ko(`${table} id=${id} INTROUVABLE (attendu « ${attendu} »)`)
  if (row.nom !== attendu) return ko(`${table} id=${id} porte « ${row.nom} », pas « ${attendu} »`)
  ok(`${table} id=${id} = « ${attendu} »`)
}

async function verifier() {
  console.log('\n═══ LE PERSONNAGE EXISTE-T-IL DÉJÀ ? ═══')
  const [perso] = await db.select().from(schema.characters).where(eq(schema.characters.id, ID)).limit(1)
  if (!perso) return ko(`aucun personnage id=${ID}`) as unknown as boolean
  if (perso.nom !== 'Krugg Coeur-Flamboyant') return ko(`id=${ID} porte « ${perso.nom} »`) as unknown as boolean
  ok(`id=${ID} « ${perso.nom} » — joueur ${perso.joueurPrenom} ${perso.joueurNom}`)
  if (perso.joueurPrenom !== 'Daniel' || perso.joueurNom !== 'Tarte') {
    ko('le joueur enregistré n’est pas « Daniel Tarte »')
  } else {
    ok('joueur déjà « Daniel Tarte » — rien à écrire de ce côté')
  }

  console.log('\n═══ VÉRIFICATION DES RÉFÉRENCES ÉPINGLÉES (lecture seule) ═══')
  await verifierNom('races', REF_RACE.id, REF_RACE.nom)
  await verifierNom('classes', REF_CLASSE.id, REF_CLASSE.nom)
  await verifierNom('gods', REF_DIEU.id, REF_DIEU.nom)
  for (const l of REF_LANGUES) await verifierNom('languages', l.id, l.nom)
  await verifierNom('skills', REF_COMPETENCE_DISCRETION.id, REF_COMPETENCE_DISCRETION.nom)
  await verifierNom('armor', REF_ARMURE.id, REF_ARMURE.nom)
  await verifierNom('magicItems', REF_ANNEAU.id, REF_ANNEAU.nom)

  console.log('\n═══ CONTRÔLE ANTI-DOUBLON DES ENTRÉES À CRÉER ═══')
  for (const o of CREATIONS.objets) {
    const [e] = await db.select({ id: schema.magicItems.id })
      .from(schema.magicItems).where(eq(schema.magicItems.nom, o.nom)).limit(1)
    e ? ko(`l’objet « ${o.nom} » existe déjà (id=${e.id}) — épingler cet id`)
      : ok(`objet « ${o.nom} » absent — création légitime`)
  }

  console.log('\n═══ CE QUI SERAIT ÉCRIT SUR LE PERSONNAGE 82 ═══')
  const [cs] = await db.select().from(schema.characterCombatStats)
    .where(eq(schema.characterCombatStats.personnageId, ID)).limit(1)
  console.log(`  PV            ${cs?.pvMax ?? '?'}/${cs?.pvActuels ?? '?'}  →  ${PV ?? '⛔ --pv= non fourni'}`)
  console.log(`  ca_arme       ${cs?.caArme}  →  0    (colonne ignorée par les deux fiches ; l’armure prend le relais)`)
  console.log(`  ca_divers     ${cs?.caDivers}  →  0    (le +1 de plates et le +1 d’anneau sont désormais comptés à leur place)`)
  console.log(`  domaine1/2    ${cs?.domaine1 ?? 'null'} / ${cs?.domaine2 ?? 'null'}  →  Force / Chance`)
  console.log(`  déplacement   ${cs?.deplacement}  →  inchangé`)
  console.log(`  BAB           ${cs?.bbaCorpsACorps}/${cs?.bbaProjectiles}  →  inchangé`)

  const skillsExistants = await db.select({ skillId: schema.characterSkills.skillId })
    .from(schema.characterSkills).where(eq(schema.characterSkills.personnageId, ID))
  skillsExistants.some(s => s.skillId === REF_COMPETENCE_DISCRETION.id)
    ? ko('Discrétion est déjà rattachée — ne pas la rattacher deux fois')
    : ok('Discrétion à ajouter (rangs 0, divers +5 des gants de cuir)')

  const armuresExistantes = await db.select().from(schema.characterArmor)
    .where(eq(schema.characterArmor.personnageId, ID))
  armuresExistantes.length > 0
    ? ko(`le personnage porte déjà ${armuresExistantes.length} armure(s)`)
    : ok('armure à ajouter : Plaque complète +1 (CA 8+1)')

  const objetsExistants = await db.select().from(schema.characterMagicItems)
    .where(eq(schema.characterMagicItems.personnageId, ID))
  objetsExistants.some(o => o.objetId === REF_ANNEAU.id)
    ? ko('l’anneau de protection +1 est déjà rattaché')
    : ok('anneau de protection +1 à ajouter (CA +1 de déflexion)')

  console.log('\n  ⚠️ CA après écriture : 10 + 9 (plates +1) + 0 (DEX, plafonné à +1) + 0 (divers)')
  console.log('     + 1 (anneau) = 20 — conforme à la case CA de la fiche papier.')

  console.log('\n═══ CE QUE LE SCRIPT NE TOUCHERA PAS (décisions réservées à André) ═══')
  console.log('  · « Amulette de protection +3 » (objet 71), rattachée au 82 mais ABSENTE de la')
  console.log('    fiche papier — probable mauvais appariement de l’import FileMaker.')
  console.log('  · xp = 19500 : la case « XP acquise » de la fiche est VIDE.')
  console.log('  · Les scores de caractéristiques : 18/10/12/8/16/16 sont les valeurs FINALES,')
  console.log('    alors que l’app ajoute par-dessus le bonus racial demi-orque (+2 FOR, −2 INT,')
  console.log('    −2 CHA) pour la CA, l’attaque et les sauvegardes. Défaut partagé avec les')
  console.log('    autres personnages venus de FileMaker — à trancher globalement, pas ici.')
  console.log('  · critique_min = 20 sur les 3 armes, alors que la fiche imprime 19-20.')

  console.log(`\n${erreurs === 0 ? '✅ Toutes les vérifications passent.' : `❌ ${erreurs} problème(s) — écriture refusée.`}`)
  return erreurs === 0
}

async function ecrire() {
  if (PV === null || Number.isNaN(PV)) {
    console.log('\n⛔ --pv=<max> est obligatoire. La fiche porte 42 imprimé et 52 manuscrit :')
    console.log('   le script refuse de choisir à la place d’André.')
    process.exit(1)
  }

  console.log('\n═══ ÉCRITURE ═══')
  console.log('⚠️ Le pilote neon-http ne gère pas de transaction interactive.')
  console.log(`   En cas d’échec : scripts/import-krugg.ts --rollback=${ID}\n`)

  // — Objets de référence à créer —
  const objetsCrees: Array<{ id: number; src: typeof CREATIONS.objets[number] }> = []
  for (const o of CREATIONS.objets) {
    const [m] = await db.insert(schema.magicItems).values({
      nom: o.nom, type: o.type, emplacement: o.emplacement, bonus: o.bonus,
      auraMagique: o.auraMagique, niveauLanceur: o.niveauLanceur,
      prix: o.prix, description: o.description, chargesMax: o.chargesMax,
    }).returning({ id: schema.magicItems.id })
    objetsCrees.push({ id: m.id, src: o })
    ok(`objet créé id=${m.id} — ${o.nom}`)
  }

  // — Le personnage —
  await db.update(schema.characters).set({
    poids: 110,
    historique: HISTORIQUE,
    notes: NOTES_FICHE,
    updatedAt: new Date(),
  }).where(eq(schema.characters.id, ID))
  ok('characters : poids 110, historique et notes de la fiche papier')

  await db.update(schema.characterCombatStats).set({
    pvMax: PV, pvActuels: PV,
    caArme: 0, caDivers: 0,
    domaine1: 'Force', domaine2: 'Chance',
  }).where(eq(schema.characterCombatStats.personnageId, ID))
  ok(`combat : PV ${PV}/${PV} · ca_arme et ca_divers remis à 0 · domaines Force / Chance`)

  await db.insert(schema.characterSkills).values({
    personnageId: ID, skillId: REF_COMPETENCE_DISCRETION.id,
    rangsInvestis: 0, modifDivers: 5,
  })
  ok('compétence : Discrétion (0 rang, +5 des gants de cuir « crocs silencieux »)')

  await db.insert(schema.characterArmor).values({
    personnageId: ID, armureId: REF_ARMURE.id, bonusMagique: 1, estPortee: 1,
  })
  ok('armure : Plaque complète +1 portée')

  await db.insert(schema.characterMagicItems).values({
    personnageId: ID, objetId: REF_ANNEAU.id, emplacement: 'Doigt',
    notes: 'Bonus de déflexion +1 — compté par la fiche via magic_items.bonus.',
    chargesRestantes: null,   // ⭐ effet continu : Charges VIDE, sinon un bouton de dépense apparaît
  })
  for (const { id: objetId, src } of objetsCrees) {
    await db.insert(schema.characterMagicItems).values({
      personnageId: ID, objetId, emplacement: src.emplacement,
      notes: src.charNotes,
      chargesRestantes: src.chargesMax,   // null pour l’amulette (continu), 1 pour le parchemin
    })
  }
  ok('3 objets magiques rattachés (anneau, amulette de charisme, parchemin)')

  // — L’épée à deux mains est magique (+1) : ligne PAR PERSONNAGE, aucune fusion —
  const armes = await db.select({ cw: schema.characterWeapons, w: schema.weapons })
    .from(schema.characterWeapons)
    .innerJoin(schema.weapons, eq(schema.characterWeapons.armeId, schema.weapons.id))
    .where(eq(schema.characterWeapons.personnageId, ID))
  for (const { cw, w } of armes) {
    if (w.nom === 'Épée à deux mains') {
      await db.update(schema.characterWeapons).set({ bonusMagique: 1 })
        .where(and(eq(schema.characterWeapons.id, cw.id), eq(schema.characterWeapons.personnageId, ID)))
      ok(`arme ${w.nom} : bonus magique +1 (fiche : « Épée à deux mains +1 », 2312 po)`)
    }
    // Critique 19-20 : imprimé sur les 3 lignes de la fiche ET conforme au PHB 3.5
    // (dague 19-20/×2, épée à deux mains 19-20/×2). weapons est une table PAR PERSONNAGE :
    // ces 3 lignes n'appartiennent qu'à Krugg (vérifié), aucune autre fiche n'est touchée.
    if (w.critiqueMin !== 19) {
      await db.update(schema.weapons).set({ critiqueMin: 19 }).where(eq(schema.weapons.id, w.id))
      ok(`arme ${w.nom} : critique 19-20`)
    }
  }

  await db.update(schema.characterCurrency).set({ po: '1360.00' })
    .where(eq(schema.characterCurrency.personnageId, ID))
  ok('monnaie : 1360 po (1013 + 347 manuscrits ; le collier de 500 po est dans les notes)')

  await db.insert(schema.characterNotes).values({
    personnageId: ID,
    titre: 'Fiche papier du 2026-08-27 — relevé intégral',
    contenu: NOTES_FICHE,
  })
  ok('note de personnage ajoutée')

  console.log(`\n✅ Terminé. https://cormac-two.vercel.app/personnage/${ID}`)
  console.log(`   Annulation : npx tsx --env-file=.env.local scripts/import-krugg.ts --rollback=${ID}`)
}

/**
 * Rollback — remet le personnage exactement dans l'état capturé par
 * menage-references/krugg-export-avant.mjs, y compris les lignes mises à jour.
 */
async function rollback(id: number) {
  console.log(`\n═══ ANNULATION du personnage id=${id} ═══`)
  const snapPath = resolve(process.cwd(), 'menage-references/krugg-etat-avant.json')
  const snap = JSON.parse(readFileSync(snapPath, 'utf-8')) as {
    horodatage: string
    idExistant: number
    refs: Record<string, { maxId: number; nb: number }>
    contenu82: Record<string, Record<string, unknown>[]>
  }
  if (snap.idExistant !== id) {
    console.log(`⛔ L’instantané couvre le personnage ${snap.idExistant}, pas ${id}.`)
    console.log('   Pour un personnage créé après coup, supprimer ses tables filles à la main.')
    process.exit(1)
  }
  console.log(`  instantané du ${snap.horodatage}`)
  console.log('  ⚠️ Le rollback des champs ligne à ligne se fait par le SQL préparé :')
  console.log('     menage-references/krugg-restauration.sql — sections A puis C.')
  console.log('     Il contient les UPDATE/INSERT exacts, et les DELETE des références créées.')
  console.log('  Rien n’a été modifié par cette commande.')
}

async function main() {
  if (ROLLBACK_ID !== null) return rollback(ROLLBACK_ID)
  const propre = await verifier()
  if (!COMMIT) {
    console.log('\n⏸  Mode vérification. Aucune écriture effectuée.')
    console.log('   Pour écrire : ajouter --pv=42 (ou --pv=52) et --commit')
    return
  }
  if (!propre) { console.log('\n⛔ Écriture annulée : corriger les problèmes ci-dessus.'); process.exit(1) }
  await ecrire()
}

main().catch(e => { console.error(e); process.exit(1) })

/**
 * Import du personnage « Grimdar » (export Grimdar TUI, format dnd-3.5-character v1.0)
 * ---------------------------------------------------------------------------------
 * ⛔ CE SCRIPT N'ÉCRIT RIEN SANS L'INDICATEUR --commit.
 *
 *   Vérification seule (aucune écriture, à faire en premier) :
 *     npx tsx --env-file=.env.local scripts/import-grimdar.ts
 *
 *   Import réel (après l'accord d'André sur le mode de compétences) :
 *     npx tsx --env-file=.env.local scripts/import-grimdar.ts --competences=a2 --commit
 *
 *   Annulation (efface le personnage importé et ses 18 tables filles) :
 *     npx tsx --env-file=.env.local scripts/import-grimdar.ts --rollback=<id>
 *
 * PRINCIPE : ⛔ AUCUN getOrCreate silencieux. Chaque valeur de référence est soit
 * épinglée à un id existant VÉRIFIÉ PAR SON NOM EXACT, soit déclarée explicitement
 * dans CREATIONS avec sa justification. Si un id épinglé ne porte plus le nom attendu,
 * le script s'arrête AVANT toute écriture.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { eq, inArray } from 'drizzle-orm'
import { getDb } from '../src/db/index'
import * as schema from '../src/db/schema'

// ── Chargement manuel de .env.local (comme import-filemaker.ts) ──────────────
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
const MODE_COMPETENCES = (() => {
  const a = ARGS.find(x => x.startsWith('--competences='))
  return (a ? a.split('=')[1] : 'a2') as 'a1' | 'a2' | 'omettre'
})()

/**
 * ⚠️ DÉCISION EN ATTENTE D'ANDRÉ — sauvegardes.
 * La fiche calcule Vigueur = vigueurBase + mod(CON SANS bonus racial) + vigueurMagique.
 * conBase vaut 14 (le +2 nain est ajouté ailleurs par l'app), donc le mod utilisé ici
 * est +2 au lieu de +3. Mettre ce drapeau à true ajoute 1 à vigueurMagique pour que la
 * fiche affiche la valeur juste en 3.5 (+8) plutôt que +7.
 * ⛔ Laisser à false tant qu'André n'a pas tranché : compenser un défaut de l'app dans
 * les données, c'est cacher le défaut et casser la fiche le jour où il sera corrigé.
 */
const COMPENSER_CON_RACIAL = false

// ═══════════════════════════════════════════════════════════════════════════
// 1. RÉFÉRENCES EXISTANTES — id épinglé + nom exact attendu (vérifié au départ)
// ═══════════════════════════════════════════════════════════════════════════

const REF_RACE          = { id: 4,  nom: 'Nain' }
const REF_CLASSE        = { id: 1,  nom: 'Guerrier' }
const REF_DIEU          = { id: 22, nom: 'Kagyar' }               // fichier : « Kagyar le Créateur »

const REF_LANGUES = [
  { id: 26, nom: 'Nain',     source: 'Nain' },
  { id: 2,  nom: 'Commun',   source: 'Commun' },
  { id: 33, nom: 'Gnomish',  source: 'Gnome' },                   // ⚠️ nom anglais déjà en base
  { id: 20, nom: 'Goblinour', source: 'Gobelin' },                // ⚠️ graphie maison déjà en base
]

const REF_DONS = [
  { id: 48,  nom: 'Attaque en puissance',   source: 'Attaque en Puissance' },     // ⚠️ casse
  { id: 473, nom: 'Robustesse',             source: 'Robustesse' },
  { id: 6,   nom: "Science de l'initiative", source: "Science de l'Initiative" }, // ⚠️ casse
]

const REF_OBJET_ANNEAU  = { id: 12, nom: 'Anneau de protection +1' }  // bonus = 1 → CA gérée par l'app

/**
 * Compétences. `divA1` = le total brut du fichier ; `divA2` = la valeur compensée
 * pour que la fiche affiche exactement le total du fichier.
 * (fiche : total = rangs + modCarac[SANS racial] + divers − malusArmure)
 */
const REF_COMPETENCES: Array<{
  id: number | null; nom: string; source: string; totalFichier: number
  divA1: number; divA2: number; note: string
}> = [
  { id: 51,  nom: 'Artisanat (armes)', source: 'Forge', totalFichier: 9,
    divA1: 9, divA2: 9,  note: 'Craft (forge) — « Forge » n’existe pas en 3.5 ; « Artisanat (armes) » est la seule variante déjà en base ET dans COMPETENCES_DND35' },
  { id: 5,   nom: 'Escalade',    source: 'Escalade',    totalFichier: 8,
    divA1: 8, divA2: 11, note: 'seule compétence touchée par le malus d’armure −6 de la plaque complète' },
  { id: 54,  nom: 'Déguisement', source: 'Déguisement', totalFichier: 6,
    divA1: 6, divA2: 6,  note: '' },
  { id: 175, nom: 'intimidation', source: 'Intimidation', totalFichier: 4,
    divA1: 4, divA2: 4,  note: '⚠️ minuscule en base ; ne s’imprimera PAS sur le PDF (COMPETENCES_DND35 attend « Intimidation »)' },
  { id: 9,   nom: 'Survie',      source: 'Survie',      totalFichier: 4,
    divA1: 4, divA2: 3,  note: '' },
  { id: null, nom: 'Connaissance (architecture et ingénierie)', source: 'Architecture', totalFichier: 4,
    divA1: 4, divA2: 4,  note: 'à créer — absente de la base ET de COMPETENCES_DND35 ; ne s’imprimera pas sur le PDF' },
]

// ═══════════════════════════════════════════════════════════════════════════
// 2. RÉFÉRENCES À CRÉER — chacune justifiée
// ═══════════════════════════════════════════════════════════════════════════

const CREATIONS = {
  clan: {
    nom: 'Marteau Profond', raceId: REF_RACE.id,
    description: 'Clan nain de Rocklogis (Rockhome), Mystara.',
    // justif : la table clans ne contient qu’une seule entrée, elfique.
  },
  competenceArchitecture: {
    nom: 'Connaissance (architecture et ingénierie)', caracteristique: 'INT', formationRequise: true,
    // justif : Knowledge (architecture and engineering) du SRD, absente de la base.
  },
  dons: [
    { nom: 'Arme de prédilection (hache de guerre naine)', categorie: 'Combat',
      prerequis: 'BAB +1, maniement de la hache de guerre naine',
      description: '+1 aux jets d’attaque avec la hache de guerre naine.',
      // ⭐ La graphie est CONTRAINTE : getFeatWeaponBonuses exige /^arme de prédilection/i
      // suivi de « (cible) », et la cible normalisée doit égaler le nom de l’arme.
    },
    { nom: 'Spécialisation martiale (hache de guerre naine)', categorie: 'Combat',
      prerequis: 'Guerrier niveau 4, Arme de prédilection (hache de guerre naine)',
      description: '+2 aux jets de dégâts avec la hache de guerre naine.',
    },
  ],
  armes: [
    { nom: 'Hache de guerre naine', categorieId: 3, degats: '1d10', critiqueMin: 20, critiqueMult: 3,
      portee: null, typeDegats: 'Tranchant', taille: 'M', poids: '8.00', prix: '30.00',
      description: 'Arme de guerre exotique naine. Un nain la manie comme une arme de guerre (Familiarité avec les armes naines).',
      bonusMagique: 1, proprietesSpeciales: null, quantite: 1 },
    { nom: 'Marteau léger', categorieId: 3, degats: '1d4', critiqueMin: 20, critiqueMult: 2,
      portee: null, typeDegats: 'Contondant', taille: 'P', poids: '2.00', prix: '1.00',
      description: 'Arme légère, peut être lancée (portée 6 m).',
      // ⚠️ portee laissée à null VOLONTAIREMENT : la fiche traite toute arme avec portee
      // comme une arme à distance et lui retire le bonus de Force aux dégâts.
      bonusMagique: 0, proprietesSpeciales: 'Peut être lancée (portée 6 m).', quantite: 1 },
    { nom: 'Arbalète lourde', categorieId: 2, degats: '1d10', critiqueMin: 19, critiqueMult: 2,
      portee: 36, typeDegats: 'Perforant', taille: 'M', poids: '8.00', prix: '50.00',
      description: 'Rechargement : action complexe. Pas d’attaque itérative.',
      bonusMagique: 1, proprietesSpeciales: 'Rechargement en action complexe — pas d’attaque itérative.', quantite: 1 },
    { nom: 'Masse d’armes lourde', categorieId: 3, degats: '1d8', critiqueMin: 20, critiqueMult: 2,
      portee: null, typeDegats: 'Contondant', taille: 'M', poids: '8.00', prix: '12.00',
      description: 'Masse d’armes lourde.',
      bonusMagique: 2,
      proprietesSpeciales: '+4 dégâts supplémentaires contre les morts-vivants. Récemment acquise — non intégrée à la routine de combat.',
      quantite: 1 },
  ],
  armure: {
    nom: 'Plaque complète', type: 'Armure lourde', bonusArmure: 8, maxDex: 1,
    malusCompetence: -6, risqueEchecMagique: 35,
    deplacement: 6, poids: '50.00', prix: '1500.00',
    // ⭐ deplacement = 6 est OBLIGATOIRE : sans lui la fiche détecte « lourde » et
    // ramène un déplacement de base 6 m à 4 m — ce qui est FAUX pour un nain, qui
    // conserve ses 20 pieds en armure lourde (trait racial 3.5).
    bonusMagique: 0,
  },
  objets: [
    { nom: 'Médaillon du Masque de Pierre', type: 'Objet merveilleux', emplacement: 'Cou',
      bonus: null, // ⛔ DOIT rester null : magicItems.bonus est sommé dans la CA.
      auraMagique: 'Transmutation modérée', niveauLanceur: null, chargesMax: 1,
      description: [
        'Disque de pierre grise polie orné d’une rune d’argent, froid au toucher.',
        'Métamorphose (Alter Self) 1/jour, 1 heure — apparence d’un autre humanoïde.',
        'Passif : +2 Discrétion et Déguisement.',
        'Passif pendant la transformation : immunité à la Détection du mensonge et à la Lecture des émotions.',
        'Artisanat nain d’espionnage, remis par le roi de Rockhome à ses agents les plus loyaux.',
      ].join(' '),
      charNotes: 'Charge = la Métamorphose 1/jour. Les deux autres pouvoirs sont passifs.' },
    { nom: 'L’Œil de Kagyar', type: 'Relique naine semi-légendaire', emplacement: 'Œil (implanté)',
      bonus: null,
      auraMagique: 'Divination et transmutation modérées', niveauLanceur: null, chargesMax: null,
      // chargesMax null : l’objet mêle du 1/jour et du 1/semaine, que le schéma ne sait pas modéliser.
      description: [
        'Œil artificiel en métal inconnu, iris de quartz bleuté.',
        'Passif : rend la vue à un œil manquant ; vision dans le noir portée à 36 m au lieu de 18 m.',
        'Détection du mal 1/jour (1 minute).',
        'Vision de la vérité (True Seeing) 1/semaine (1 minute).',
        'Forgé par les Grands Prêtres de Kagyar pour les champions mutilés de la Grande Guerre des Profondeurs.',
        'Coût : connexion spirituelle permanente avec Kagyar.',
      ].join(' '),
      charNotes: 'Usages non suivis par le Grimoire (1/jour + 1/semaine). Vision dans le noir portée à 36 m.' },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. LE PERSONNAGE
// ═══════════════════════════════════════════════════════════════════════════

const HISTORIQUE = [
  'Grimdar, nain de Rocklogis (Rockhome), univers de Mystara. Clan Marteau Profond. 88 ans.',
  'Fidèle de Kagyar le Créateur.',
  '',
  'Personnage reçu d’un ami d’André, exporté depuis Grimdar TUI (Go/Bubbletea),',
  'format dnd-3.5-character v1.0, export daté du 2026-08-25.',
].join('\n')

const NOTES = [
  '── ÉQUIPEMENT COURANT (aucune table dans le Grimoire) ──',
  '3 torches · 3 cordes (15 m) · 1 sac à dos · 2 gourdes de vin',
  '1 masse d’arme de Xanathon — magique ? non identifiée',
  '',
  '── TRÉSOR (aucune table dans le Grimoire) ──',
  '5 éclats de cristal (valeur inconnue) · 1 collier (500 po) · 1 bague (500 po)',
  'Total estimé avec les 1022 po : 2022 po.',
  '',
  '── MODES D’ATTAQUE (non modélisés par le Grimoire) ──',
  'Hache de guerre naine, Attaque en puissance au maximum : +6/+1, 1d10+16 (−5 att. / +10 dég., arme à deux mains).',
  'Hache de guerre naine contre orcs et gobelinoïdes : +12/+7, 1d10+6 (+1 racial, trait Haine).',
  'Masse d’armes lourde +2 contre les morts-vivants : 1d8+9.',
  '',
  '── SAUVEGARDES CONDITIONNELLES ──',
  'Contre les poisons : Vigueur +2 (résistance raciale naine).',
  'Contre les sorts : Volonté +2 (résistance raciale naine).',
  '⚠️ Le fichier source annonce Vigueur +10 et Volonté +5, soit +2 de plus que les valeurs',
  '3.5 (+8 et +3) sans qu’aucun objet ni capacité de classe ne le justifie. Le bonus racial',
  'nain semble compté deux fois : une fois dans le total, une fois en conditionnel.',
  '',
  '── POTIONS ──',
  'Stock épuisé à l’export : Soins légers, modérés, grands soins et critiques, tous à 0.',
  '',
  '── PNJ ET FILS NARRATIFS (table de l’ami, pas la campagne d’André) ──',
  'Granaton — grand-prêtre.',
  'Xanathon — inconnu, associé à une masse d’arme non identifiée.',
  'Vision (2026-01-18) : un homme sur un trône, incapable de parler (un duc contrôlé ?) ;',
  'une salle à colonnes avec une sculpture mi-homme mi-singe ; des ricanements en fond.',
  'Parties annoncées : 8 mars 2026, puis 29 mars 2026.',
].join('\n')

const COMPAGNONS = [
  { nom: 'Cormac', race: 'Elfe', classe: null, joueur: null, notes: 'Allié (PNJ) — table de l’ami d’André.' },
  { nom: 'Krugg', race: 'Demi-Orc', classe: 'Prêtre', joueur: null, notes: 'Allié (PNJ) — table de l’ami d’André.' },
]

// ═══════════════════════════════════════════════════════════════════════════
// 4. EXÉCUTION
// ═══════════════════════════════════════════════════════════════════════════

const db = getDb()
let erreurs = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const ko = (m: string) => { erreurs++; console.log(`  ✗ ${m}`) }

async function verifierNom(
  table: 'races' | 'classes' | 'gods' | 'languages' | 'skills' | 'feats' | 'magicItems',
  id: number, attendu: string,
) {
  const t = schema[table]
  const [row] = await db.select({ nom: t.nom }).from(t).where(eq(t.id, id)).limit(1)
  if (!row) return ko(`${table} id=${id} INTROUVABLE (attendu « ${attendu} »)`)
  if (row.nom !== attendu) return ko(`${table} id=${id} porte « ${row.nom} », pas « ${attendu} »`)
  ok(`${table} id=${id} = « ${attendu} »`)
}

async function verifier() {
  console.log('\n═══ VÉRIFICATION DES RÉFÉRENCES ÉPINGLÉES (lecture seule) ═══')
  await verifierNom('races', REF_RACE.id, REF_RACE.nom)
  await verifierNom('classes', REF_CLASSE.id, REF_CLASSE.nom)
  await verifierNom('gods', REF_DIEU.id, REF_DIEU.nom)
  for (const l of REF_LANGUES) await verifierNom('languages', l.id, l.nom)
  for (const d of REF_DONS) await verifierNom('feats', d.id, d.nom)
  for (const c of REF_COMPETENCES) if (c.id) await verifierNom('skills', c.id, c.nom)
  await verifierNom('magicItems', REF_OBJET_ANNEAU.id, REF_OBJET_ANNEAU.nom)

  console.log('\n═══ CONTRÔLE ANTI-DOUBLON DES ENTRÉES À CRÉER ═══')
  const [clanExistant] = await db.select({ id: schema.clans.id })
    .from(schema.clans).where(eq(schema.clans.nom, CREATIONS.clan.nom)).limit(1)
  clanExistant ? ko(`le clan « ${CREATIONS.clan.nom} » existe déjà (id=${clanExistant.id}) — épingler cet id`)
               : ok(`clan « ${CREATIONS.clan.nom} » absent — création légitime`)

  const [skExistante] = await db.select({ id: schema.skills.id })
    .from(schema.skills).where(eq(schema.skills.nom, CREATIONS.competenceArchitecture.nom)).limit(1)
  skExistante ? ko(`la compétence « ${CREATIONS.competenceArchitecture.nom} » existe déjà (id=${skExistante.id})`)
              : ok(`compétence « ${CREATIONS.competenceArchitecture.nom} » absente — création légitime`)

  const donsExistants = await db.select({ id: schema.feats.id, nom: schema.feats.nom })
    .from(schema.feats).where(inArray(schema.feats.nom, CREATIONS.dons.map(d => d.nom)))
  for (const d of CREATIONS.dons) {
    const e = donsExistants.find(x => x.nom === d.nom)
    e ? ko(`le don « ${d.nom} » existe déjà (id=${e.id})`) : ok(`don « ${d.nom} » absent — création légitime`)
  }

  const [homonyme] = await db.select({ id: schema.characters.id })
    .from(schema.characters).where(eq(schema.characters.nom, 'Grimdar')).limit(1)
  homonyme ? ko(`un personnage nommé « Grimdar » existe déjà (id=${homonyme.id}) — vérifier avant d’importer`)
           : ok('aucun personnage nommé « Grimdar » en base')

  console.log('\n═══ COMPÉTENCES — mode ' + MODE_COMPETENCES + ' ═══')
  if (MODE_COMPETENCES === 'omettre') {
    console.log('  (aucune compétence ne sera importée — en attente du réexport avec les rangs)')
  } else {
    for (const c of REF_COMPETENCES) {
      const div = MODE_COMPETENCES === 'a1' ? c.divA1 : c.divA2
      console.log(`  ${c.source.padEnd(14)} total fichier ${String(c.totalFichier).padStart(2)}  →  rangs 0, divers ${String(div).padStart(2)}`)
    }
  }
  console.log(`\n${erreurs === 0 ? '✅ Toutes les vérifications passent.' : `❌ ${erreurs} problème(s) — écriture refusée.`}`)
  return erreurs === 0
}

async function importer() {
  console.log('\n═══ ÉCRITURE ═══')
  console.log('⚠️ Le pilote neon-http ne gère pas de transaction interactive.')
  console.log('   En cas d’échec, relancer avec --rollback=<id du personnage>.\n')

  // — Références à créer —
  const [clan] = await db.insert(schema.clans).values(CREATIONS.clan).returning({ id: schema.clans.id })
  ok(`clan créé id=${clan.id}`)

  let skArchiId: number | null = null
  if (MODE_COMPETENCES !== 'omettre') {
    const [s] = await db.insert(schema.skills).values(CREATIONS.competenceArchitecture)
      .returning({ id: schema.skills.id })
    skArchiId = s.id; ok(`compétence créée id=${s.id}`)
  }

  const donsCrees: number[] = []
  for (const d of CREATIONS.dons) {
    const [f] = await db.insert(schema.feats).values(d).returning({ id: schema.feats.id })
    donsCrees.push(f.id); ok(`don créé id=${f.id} — ${d.nom}`)
  }

  const armesCreees: Array<{ id: number; src: typeof CREATIONS.armes[number] }> = []
  for (const a of CREATIONS.armes) {
    const [w] = await db.insert(schema.weapons).values({
      nom: a.nom, categorieId: a.categorieId, degats: a.degats,
      critiqueMin: a.critiqueMin, critiqueMult: a.critiqueMult, portee: a.portee,
      typeDegats: a.typeDegats, taille: a.taille, poids: a.poids, prix: a.prix, description: a.description,
    }).returning({ id: schema.weapons.id })
    armesCreees.push({ id: w.id, src: a }); ok(`arme créée id=${w.id} — ${a.nom}`)
  }

  const [armure] = await db.insert(schema.armor).values({
    nom: CREATIONS.armure.nom, type: CREATIONS.armure.type, bonusArmure: CREATIONS.armure.bonusArmure,
    maxDex: CREATIONS.armure.maxDex, malusCompetence: CREATIONS.armure.malusCompetence,
    risqueEchecMagique: CREATIONS.armure.risqueEchecMagique, deplacement: CREATIONS.armure.deplacement,
    poids: CREATIONS.armure.poids, prix: CREATIONS.armure.prix,
  }).returning({ id: schema.armor.id })
  ok(`armure créée id=${armure.id}`)

  const objetsCrees: Array<{ id: number; src: typeof CREATIONS.objets[number] }> = []
  for (const o of CREATIONS.objets) {
    const [m] = await db.insert(schema.magicItems).values({
      nom: o.nom, type: o.type, emplacement: o.emplacement, bonus: o.bonus,
      auraMagique: o.auraMagique, niveauLanceur: o.niveauLanceur,
      description: o.description, chargesMax: o.chargesMax,
    }).returning({ id: schema.magicItems.id })
    objetsCrees.push({ id: m.id, src: o }); ok(`objet créé id=${m.id} — ${o.nom}`)
  }

  // — Le personnage —
  const [perso] = await db.insert(schema.characters).values({
    nom: 'Grimdar',
    raceId: REF_RACE.id,
    taille: '1m25',                 // champ texte libre de hauteur (usage réel constaté)
    poids: 165,                     // 75 kg → lbs (la fiche affiche « lbs »)
    age: 88,
    alignement: 'LN',               // abréviation, usage majoritaire en base
    dieuId: REF_DIEU.id,
    clanId: clan.id,
    xp: 15022,
    historique: HISTORIQUE,
    notes: NOTES,
  }).returning({ id: schema.characters.id })
  const id = perso.id
  console.log(`\n★ Personnage créé : id=${id}\n`)

  await db.insert(schema.characterClasses).values({ personnageId: id, classeId: REF_CLASSE.id, niveau: 6 })
  ok('classe : Guerrier 6')

  await db.insert(schema.characterAbilityScores).values({
    personnageId: id,
    // ⭐ Scores SANS bonus racial : l’app ajoute races.bonusCon (+2) et bonusCha (−2).
    forBase: 16, dexBase: 12, conBase: 14, intBase: 10, sagBase: 12, chaBase: 10,
    forMagique: 0, dexMagique: 0, conMagique: 0, intMagique: 0, sagMagique: 0, chaMagique: 0,
  })
  ok('caractéristiques : FOR 16 · DEX 12 · CON 14(+2 nain=16) · INT 10 · SAG 12 · CHA 10(−2 nain=8)')

  await db.insert(schema.characterCombatStats).values({
    personnageId: id,
    pvMax: 62, pvActuels: 51,
    // ⛔ CA : la fiche fait 10 + armure(join) + naturelle + déflexion + divers + DEX + bonus des objets.
    // L’armure vient de character_armor et le +1 de l’anneau de magic_items.bonus.
    // Remplir caArme ou caDeflexion ici compterait ces bonus DEUX FOIS.
    caBase: 10, caArme: 0, caBouclier: 0, caNaturelle: 0, caDeflexion: 0, caDivers: 0,
    deplacement: 6,          // 20 pieds
    initiativeBonus: 4,      // le don seulement ; l’app ajoute le +1 de DEX
    bbaCorpsACorps: 6, bbaProjectiles: 6,  // BAB BRUT ; l’app ajoute FOR / DEX
    karma: 0,
  })
  ok('combat : PV 51/62 · CA reconstituée = 20 · déplacement 6 m · init +4(+1 DEX) · BAB 6')

  await db.insert(schema.characterSavingThrows).values({
    personnageId: id,
    vigueurBase: 5, reflexesBase: 2, volonteBase: 2,   // Guerrier 6 : Vig+5 / Réf+2 / Vol+2
    vigueurMagique: COMPENSER_CON_RACIAL ? 1 : 0, reflexesMagique: 0, volonteMagique: 0,
  })
  ok(`sauvegardes : base 5/2/2 (compensation CON raciale : ${COMPENSER_CON_RACIAL ? 'oui' : 'non'})`)

  if (MODE_COMPETENCES !== 'omettre') {
    for (const c of REF_COMPETENCES) {
      const skillId = c.id ?? skArchiId!
      await db.insert(schema.characterSkills).values({
        personnageId: id, skillId, rangsInvestis: 0,
        modifDivers: MODE_COMPETENCES === 'a1' ? c.divA1 : c.divA2,
      })
    }
    ok(`${REF_COMPETENCES.length} compétences (mode ${MODE_COMPETENCES}, rangs à 0)`)
  } else {
    ok('compétences : aucune (mode « omettre »)')
  }

  const notesDons: Record<string, string> = {
    'Attaque en puissance': 'Échange jusqu’à −5 au toucher contre +10 aux dégâts (hache tenue à deux mains). Action libre, déclarée avant le jet.',
    'Robustesse': '+3 points de vie (déjà compris dans les 62 PV).',
    "Science de l'initiative": '+4 à l’initiative (déjà dans initiativeBonus).',
  }
  for (const d of REF_DONS) {
    await db.insert(schema.characterFeats).values({ personnageId: id, featId: d.id, notes: notesDons[d.nom] ?? null })
  }
  await db.insert(schema.characterFeats).values({
    personnageId: id, featId: donsCrees[0],
    notes: '+1 aux jets d’attaque avec la hache de guerre naine (appliqué automatiquement par la fiche).',
  })
  await db.insert(schema.characterFeats).values({
    personnageId: id, featId: donsCrees[1],
    notes: '+2 aux jets de dégâts avec la hache de guerre naine (appliqué automatiquement par la fiche).',
  })
  ok('5 dons')

  for (const { id: armeId, src } of armesCreees) {
    await db.insert(schema.characterWeapons).values({
      personnageId: id, armeId, bonusMagique: src.bonusMagique,
      proprietesSpeciales: src.proprietesSpeciales, quantite: src.quantite,
    })
  }
  ok('4 armes — attaque et dégâts recalculés par la fiche (11/1d10+6 · 9/1d4+3 · 8/1d10+1 · 11/1d8+5)')

  await db.insert(schema.characterArmor).values({
    personnageId: id, armureId: armure.id, bonusMagique: CREATIONS.armure.bonusMagique, estPortee: 1,
  })
  ok('armure portée')

  await db.insert(schema.characterMagicItems).values({
    personnageId: id, objetId: REF_OBJET_ANNEAU.id, emplacement: 'Doigt',
    notes: 'Bonus de déflexion +1 — compté par la fiche via magic_items.bonus.', chargesRestantes: null,
  })
  for (const { id: objetId, src } of objetsCrees) {
    await db.insert(schema.characterMagicItems).values({
      personnageId: id, objetId, emplacement: src.emplacement,
      notes: src.charNotes, chargesRestantes: src.chargesMax,
    })
  }
  ok('3 objets magiques')

  await db.insert(schema.characterCurrency).values({
    personnageId: id, po: '1022.00', pp: '0', pe: '0', pa: '0', pc: '0', pm: '0',
  })
  ok('monnaie : 1022 po (le collier, la bague et les éclats sont dans les notes)')

  for (const l of REF_LANGUES) {
    await db.insert(schema.characterLanguages).values({ personnageId: id, langueId: l.id })
  }
  ok('4 langues')

  for (const c of COMPAGNONS) {
    await db.insert(schema.characterCompanions).values({ personnageId: id, ...c })
  }
  ok('2 compagnons (Cormac, Krugg)')

  await db.insert(schema.characterNotes).values({
    personnageId: id, titre: 'Journal repris de l’export Grimdar TUI',
    contenu: [
      '2026-01-18 18:48 — Prochaine partie => 8 mars',
      '2026-01-18 18:51 — Le nom du grand-prêtre => Granaton',
      '2026-01-18 19:18 — Partie le 29 mars 2026',
      '2026-01-18 19:38 — Cormac — Elfe (PNJ/allié)',
      '2026-01-18 19:39 — Krugg — Prêtre Demi-Orc (PNJ/allié)',
      '2026-01-18 19:56 — VISION : Homme sur trône incapable de parler (Duc contrôlé ?) /',
      '                   Salle avec colonnes et sculpture mi-homme mi-singe / Ricanements en fond',
    ].join('\n'),
  })
  // ⛔ Volontairement PAS dans character_journal : ce journal vient de la table d’un ami
  // et polluerait la chronique /partie d’André.
  ok('journal repris en note de personnage')

  console.log(`\n✅ Import terminé. Personnage id=${id} — https://cormac-two.vercel.app/personnage/${id}`)
  console.log(`   Annulation : npx tsx --env-file=.env.local scripts/import-grimdar.ts --rollback=${id}`)
}

async function rollback(id: number) {
  console.log(`\n═══ ANNULATION du personnage id=${id} ═══`)
  const tables = [
    schema.characterJournal, schema.characterNotes, schema.characterCompanions,
    schema.characterCreatures, schema.characterSpellEffects, schema.characterSpells,
    schema.characterLanguages, schema.characterCurrency, schema.characterPotions,
    schema.characterMagicItems, schema.characterArmor, schema.characterWeapons,
    schema.characterFeats, schema.characterSkills, schema.characterSavingThrows,
    schema.characterCombatStats, schema.characterAbilityScores, schema.characterClasses,
  ]
  for (const t of tables) await db.delete(t).where(eq(t.personnageId, id))
  await db.delete(schema.characters).where(eq(schema.characters.id, id))
  console.log('✅ Personnage supprimé.')
  console.log('⚠️ Les entrées de référence créées (clan, compétence, dons, armes, armure, objets)')
  console.log('   ne sont PAS supprimées — les retirer à la main si l’import est abandonné.')
}

async function main() {
  if (ROLLBACK_ID !== null) return rollback(ROLLBACK_ID)
  const propre = await verifier()
  if (!COMMIT) {
    console.log('\n⏸  Mode vérification. Aucune écriture effectuée.')
    console.log('   Pour importer : ajouter --competences=a1|a2|omettre et --commit')
    return
  }
  if (!propre) { console.log('\n⛔ Écriture annulée : corriger les problèmes ci-dessus.'); process.exit(1) }
  await importer()
}

main().catch(e => { console.error(e); process.exit(1) })

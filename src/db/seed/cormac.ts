import { getDb } from '../index'
import * as schema from '../schema'

const db = getDb()

async function seed() {
  console.log('🗡️  Seeding Cormac...')

  // ── 1. RACE : ELFE ───────────────────────────────────────────────────────
  const [elfe] = await db.insert(schema.races).values({
    nom: 'Elfe',
    bonusDex: 2,
    bonusCon: -2,
    taille: 'Moyenne',
    deplacementBase: 9,
    visionNocturne: true,
    description: 'Vision nocturne (lumière faible x2), immunité sommeil magique, +2 aux JS contre magie, +2 Détection/Recherche/Perception auditive.',
  }).returning()
  console.log('✓ Race Elfe créée')

  await db.insert(schema.racialFeatures).values([
    { raceId: elfe.id, nom: 'Vision nocturne', description: 'Voit 2x plus loin en lumière faible. PAS de vision dans le noir total.' },
    { raceId: elfe.id, nom: 'Immunité au sommeil magique', description: 'Immunisé aux effets magiques de sommeil.' },
    { raceId: elfe.id, nom: '+2 aux jets de sauvegarde contre la magie', description: 'Bonus de +2 aux JS contre les sorts et effets magiques.' },
    { raceId: elfe.id, nom: 'Sens aiguisés', description: '+2 en Détection, Recherche et Perception auditive.' },
    { raceId: elfe.id, nom: 'Détection des portes secrètes', description: 'Test automatique de Recherche pour les portes secrètes à moins de 1,5 m.' },
    { raceId: elfe.id, nom: 'Langues raciales', description: 'Parle Elfique et Commun. Langues bonus : Elfe (cumasti), Gnome, Orque, Sylvain, Aérien, Aquatique.' },
  ])

  // ── 2. CLASSE : GUERRIER ─────────────────────────────────────────────────
  const [guerrier] = await db.insert(schema.classes).values({
    nom: 'Guerrier',
    deVie: 'd12',
    bbaProgression: 'Plein',
    vigueurProgression: 'Bon',
    reflexesProgression: 'Mauvais',
    volonteProgression: 'Mauvais',
    competencesParNiveau: 2,
    description: 'Maître du combat, le guerrier excelle dans toutes les formes de combat armé.',
  }).returning()
  console.log('✓ Classe Guerrier créée')

  // ── 3. CLAN ───────────────────────────────────────────────────────────────
  const [clan] = await db.insert(schema.clans).values({
    nom: "Le clan de l'Arbre sombre",
    raceId: elfe.id,
    description: "Clan elfique associé à l'Arbre sombre.",
  }).returning()
  console.log('✓ Clan créé')

  // ── 4. LANGUES ────────────────────────────────────────────────────────────
  const [langElfe] = await db.insert(schema.languages).values({ nom: 'Elfique', script: 'Elfe' }).returning()
  const [langCommun] = await db.insert(schema.languages).values({ nom: 'Commun', script: 'Commun' }).returning()
  const [langCumasti] = await db.insert(schema.languages).values({ nom: 'Elfe (cumasti)', script: 'Elfe' }).returning()
  console.log('✓ Langues créées')

  // ── 5. COMPÉTENCES ────────────────────────────────────────────────────────
  const [skConnaissanceNains] = await db.insert(schema.skills).values({ nom: 'Connaissance des nains', nomEn: 'Knowledge (Dwarves)', caracteristique: 'INT', formationRequise: false }).returning()
  const [skDetection] = await db.insert(schema.skills).values({ nom: 'Détection', nomEn: 'Spot', caracteristique: 'SAG', formationRequise: false }).returning()
  const [skDiplomatie] = await db.insert(schema.skills).values({ nom: 'Diplomatie', nomEn: 'Diplomacy', caracteristique: 'CHA', formationRequise: false }).returning()
  const [skEquitation] = await db.insert(schema.skills).values({ nom: 'Équitation', nomEn: 'Ride', caracteristique: 'DEX', formationRequise: false }).returning()
  const [skEscalade] = await db.insert(schema.skills).values({ nom: 'Escalade', nomEn: 'Climb', caracteristique: 'FOR', formationRequise: false }).returning()
  const [skPerceptionAuditive] = await db.insert(schema.skills).values({ nom: 'Perception auditive', nomEn: 'Listen', caracteristique: 'SAG', formationRequise: false }).returning()
  const [skRecherche] = await db.insert(schema.skills).values({ nom: 'Recherche', nomEn: 'Search', caracteristique: 'INT', formationRequise: false }).returning()
  const [skSaut] = await db.insert(schema.skills).values({ nom: 'Saut', nomEn: 'Jump', caracteristique: 'FOR', formationRequise: false }).returning()
  const [skSurvie] = await db.insert(schema.skills).values({ nom: 'Survie', nomEn: 'Survival', caracteristique: 'SAG', formationRequise: false }).returning()
  console.log('✓ Compétences créées')

  // ── 6. DONS ───────────────────────────────────────────────────────────────
  const [featTirBoutPortant] = await db.insert(schema.feats).values({
    nom: 'Tir à bout portant',
    categorie: 'Combat',
    prerequis: null,
    description: '+1 aux jets d\'attaque et aux dégâts avec des armes à distance à moins de 9 mètres.',
    effetMecanique: '+1 attaque et dégâts à portée courte (≤ 9m)',
  }).returning()

  const [featTirRapide] = await db.insert(schema.feats).values({
    nom: 'Tir rapide',
    categorie: 'Combat',
    prerequis: 'Tir à bout portant, DEX 13',
    description: 'Une attaque supplémentaire à -2 avec une arme à distance par round.',
    effetMecanique: 'Attaque supplémentaire à -2 en tir',
  }).returning()

  const [featTirPrecision] = await db.insert(schema.feats).values({
    nom: 'Tir de précision',
    categorie: 'Combat',
    prerequis: 'Tir à bout portant',
    description: 'Permet de tirer ou lancer des projectiles en mêlée sans malus.',
    effetMecanique: 'Pas de malus en mêlée pour les attaques à distance',
  }).returning()

  const [featSpecMartiale] = await db.insert(schema.feats).values({
    nom: 'Spécialisation martiale (arc long)',
    categorie: 'Combat',
    prerequis: 'Arme de prédilection (arc long), Guerrier niv. 4',
    description: '+2 aux dégâts avec l\'arc long.',
    effetMecanique: '+2 dégâts avec arc long',
  }).returning()

  const [featArmePred] = await db.insert(schema.feats).values({
    nom: 'Arme de prédilection (arc long)',
    categorie: 'Combat',
    prerequis: 'BBA +1',
    description: '+1 aux jets d\'attaque avec l\'arc long.',
    effetMecanique: '+1 attaque avec arc long',
  }).returning()

  const [featScienceInit] = await db.insert(schema.feats).values({
    nom: "Science de l'initiative",
    categorie: 'Général',
    prerequis: null,
    description: '+4 à l\'initiative.',
    effetMecanique: '+4 initiative',
  }).returning()
  console.log('✓ Dons créés')

  // ── 7. CATÉGORIES D'ARMES ─────────────────────────────────────────────────
  const [catGuerre] = await db.insert(schema.weaponCategories).values({ nom: 'Arme de guerre' }).returning()
  const [catDistance] = await db.insert(schema.weaponCategories).values({ nom: 'Arme à distance' }).returning()
  const [catContact] = await db.insert(schema.weaponCategories).values({ nom: 'Corps à corps' }).returning()
  console.log('✓ Catégories d\'armes créées')

  // ── 8. ARMES ──────────────────────────────────────────────────────────────
  const [epeeLongue] = await db.insert(schema.weapons).values({
    nom: 'Épée longue',
    categorieId: catGuerre.id,
    degats: '1d8',
    critiqueMin: 19,
    critiqueMult: 2,
    typeDegats: 'Tranchant',
    taille: 'Moyenne',
    poids: '1.5',
    prix: '15',
    description: 'Arme de guerre polyvalente, de prédilection des guerriers.',
  }).returning()

  const [arcLong] = await db.insert(schema.weapons).values({
    nom: 'Arc long composite',
    categorieId: catDistance.id,
    degats: '1d8',
    critiqueMin: 20,
    critiqueMult: 3,
    portee: 30,
    typeDegats: 'Perçant',
    taille: 'Grande',
    poids: '1.5',
    prix: '100',
    description: 'Arc long composite, tire des flèches à longue portée.',
  }).returning()
  console.log('✓ Armes créées')

  // ── 9. ARMURES ────────────────────────────────────────────────────────────
  const [mithralShirt] = await db.insert(schema.armor).values({
    nom: 'Chemise de mailles',
    type: 'Armure légère',
    bonusArmure: 5,
    maxDex: 6,
    malusCompetence: 0,
    risqueEchecMagique: 10,
    deplacement: 9,
    poids: '5',
    prix: '100',
  }).returning()
  console.log('✓ Armures créées')

  // ── 10. OBJETS MAGIQUES ───────────────────────────────────────────────────
  const [capeProtection] = await db.insert(schema.magicItems).values({
    nom: 'Cape de protection +1',
    type: 'Cape',
    emplacement: 'Épaules',
    bonus: 1,
    auraMagique: 'Abjuration (faible)',
    niveauLanceur: 1,
    description: 'Confère un bonus de déviation de +1 à la CA et aux jets de sauvegarde.',
  }).returning()

  const [anneauProtection] = await db.insert(schema.magicItems).values({
    nom: 'Anneau de protection +2',
    type: 'Anneau',
    emplacement: 'Doigt',
    bonus: 2,
    auraMagique: 'Abjuration (faible)',
    niveauLanceur: 3,
    description: 'Confère un bonus de déviation de +2 à la CA.',
  }).returning()

  const [heaume] = await db.insert(schema.magicItems).values({
    nom: 'Heaume des Vents Runique',
    type: 'Heaume',
    emplacement: 'Tête',
    bonus: null,
    auraMagique: 'Inconnue',
    description: '+6 à la CA (bonus additionnel), +1 à l\'initiative. Effets magiques complets non documentés.',
  }).returning()

  const [carquois] = await db.insert(schema.magicItems).values({
    nom: 'Carquois de flèches +1',
    type: 'Carquois',
    emplacement: 'Dos',
    bonus: 1,
    description: 'Flèches magiques +1.',
  }).returning()

  const [gantelets] = await db.insert(schema.magicItems).values({
    nom: 'Gantelets de dextérité +2',
    type: 'Gantelets',
    emplacement: 'Mains',
    bonus: 2,
    auraMagique: 'Transmutation (faible)',
    niveauLanceur: 8,
    description: 'Augmente la DEX de +2.',
  }).returning()

  const [anneauOreille] = await db.insert(schema.magicItems).values({
    nom: 'Anneau d\'oreille en argent',
    type: 'Bijou',
    emplacement: 'Oreille',
    bonus: null,
    description: 'Non magique. Valeur : 100 po.',
  }).returning()

  const [fibule] = await db.insert(schema.magicItems).values({
    nom: 'Attache à cape / Fibule',
    type: 'Bijou',
    emplacement: 'Cape',
    bonus: null,
    description: 'Non magique. Valeur : 500 po.',
  }).returning()
  console.log('✓ Objets magiques créés')

  // ── 11. POTIONS ───────────────────────────────────────────────────────────
  const [potionXenaton] = await db.insert(schema.potions).values({
    nom: 'Potion Xenaton (verte)',
    sortEffet: 'Inconnu',
    description: 'Potion identifiée code 46B-Xenaton. Couleur verte.',
  }).returning()

  const [potionRouge] = await db.insert(schema.potions).values({
    nom: 'Potion Xenaton (rouge)',
    sortEffet: 'Inconnu',
    description: 'Potion identifiée code 46B-Xenaton. Couleur rouge.',
  }).returning()

  const [potionGrise] = await db.insert(schema.potions).values({
    nom: 'Potion Xenaton (grise)',
    sortEffet: 'Poison possible',
    description: 'Potion identifiée code 46B-Xenaton. Couleur grise. Possible poison.',
  }).returning()

  const [potionJaune] = await db.insert(schema.potions).values({
    nom: 'Potion Xenaton (jaune)',
    sortEffet: 'Forme gazeuse / Héroïsme / Auto-métamorphose',
    description: 'Potion identifiée code 46B-Xenaton. Couleur jaune. Effets possibles : forme gazeuse, héroïsme (+2 JdA/Sauvegarde/Compétence), auto-métamorphose.',
  }).returning()

  const [potionSoin] = await db.insert(schema.potions).values({
    nom: 'Potion de Grand Soin',
    sortEffet: 'Guérison majeure',
    chargesMax: 3,
    description: 'Potion de soin puissante. 3 gorgées disponibles.',
  }).returning()
  console.log('✓ Potions créées')

  // ── 12. CRÉATURE : SYLPHAR (GRIFFON) ──────────────────────────────────────
  const [typeBete] = await db.insert(schema.creatureTypes).values({ nom: 'Bête magique' }).returning()

  const [sylphar] = await db.insert(schema.creatures).values({
    nom: 'Griffon',
    typeId: typeBete.id,
    taille: 'Grande',
    deVie: '7d10+21',
    ca: 17,
    deplacement: 9,
    for: 22,
    dex: 15,
    con: 16,
    int: 5,
    sag: 13,
    cha: 8,
    attaques: 'Griffe +11/+11 (1d4+6), Morsure +8 (2d6+3)',
    description: 'Griffon, monture de Cormac. Corps de lion, tête et ailes d\'aigle.',
  }).returning()
  console.log('✓ Créature Sylphar créée')

  // ── 13. PERSONNAGE : CORMAC ───────────────────────────────────────────────
  const [cormac] = await db.insert(schema.characters).values({
    nom: 'Cormac',
    surnom: 'Ilsundal',
    raceId: elfe.id,
    sexe: 'Masculin',
    taille: "5'09\"",
    poids: 155,
    yeux: 'Verts',
    cheveux: 'Châtain',
    age: 120,
    alignement: null,
    clanId: clan.id,
    xp: 15000,
    notes: "Elfe = Mage de base (note du joueur, signification à clarifier). Masse d'arme +2 à confirmer.",
  }).returning()
  console.log('✓ Personnage Cormac créé (id:', cormac.id, ')')

  // ── 14. CLASSE DU PERSONNAGE ──────────────────────────────────────────────
  await db.insert(schema.characterClasses).values({
    personnageId: cormac.id,
    classeId: guerrier.id,
    niveau: 6,
  })

  // ── 15. CARACTÉRISTIQUES ──────────────────────────────────────────────────
  await db.insert(schema.characterAbilityScores).values({
    personnageId: cormac.id,
    forBase: 16, forMagique: 0,    // FOR 16 (+3)
    dexBase: 16, dexMagique: 2,    // DEX 18 (+4) — gantelets +2
    conBase: 14, conMagique: 0,    // CON 14 (+2)
    intBase: 12, intMagique: 0,    // INT 12 (+1)
    sagBase: 10, sagMagique: 0,    // SAG 10 (+0)
    chaBase: 10, chaMagique: 0,    // CHA 10 (+0)
  })

  // ── 16. STATS DE COMBAT ───────────────────────────────────────────────────
  await db.insert(schema.characterCombatStats).values({
    personnageId: cormac.id,
    pvMax: 50,
    pvActuels: 50,
    caBase: 10,
    caArme: 6,          // chemise de mailles mithral +1
    caBouclier: 0,
    caNaturelle: 0,
    caDeflexion: 1,     // cape +1 (valeur qui donne CA total = 21)
    caDivers: 0,
    deplacement: 9,
    karma: 6,
    initiativeBonus: 1, // +1 heaume (DEX +4 et Science init +4 sont calculés)
    bbaCorpsACorps: 6,
    bbaProjectiles: 6,
  })

  // ── 17. JETS DE SAUVEGARDE ────────────────────────────────────────────────
  await db.insert(schema.characterSavingThrows).values({
    personnageId: cormac.id,
    reflexesBase: 2, reflexesMagique: 1,  // total +7 (2+4dex+1)
    vigueurBase: 5, vigueurMagique: 0,    // total +7 (5+2con)
    volonteBase: 2, volonteMagique: 0,    // total +2 (2+0sag)
  })

  // ── 18. COMPÉTENCES DU PERSONNAGE ─────────────────────────────────────────
  await db.insert(schema.characterSkills).values([
    { personnageId: cormac.id, skillId: skConnaissanceNains.id, rangsInvestis: 2, modifDivers: 0 },   // total 3 (2+1int)
    { personnageId: cormac.id, skillId: skDetection.id, rangsInvestis: 6, modifDivers: 2 },           // total 8 (6+0sag+2racial)
    { personnageId: cormac.id, skillId: skDiplomatie.id, rangsInvestis: 2, modifDivers: 0 },          // total 2 (2+0cha)
    { personnageId: cormac.id, skillId: skEquitation.id, rangsInvestis: 4, modifDivers: 0 },          // total 8 (4+4dex)
    { personnageId: cormac.id, skillId: skEscalade.id, rangsInvestis: 3, modifDivers: 0 },            // total 6 (3+3for)
    { personnageId: cormac.id, skillId: skPerceptionAuditive.id, rangsInvestis: 5, modifDivers: 2 },  // total 7 (5+0sag+2racial)
    { personnageId: cormac.id, skillId: skRecherche.id, rangsInvestis: 5, modifDivers: 2 },           // total 8 (5+1int+2racial)
    { personnageId: cormac.id, skillId: skSaut.id, rangsInvestis: 4, modifDivers: 0 },                // total 7 (4+3for)
    { personnageId: cormac.id, skillId: skSurvie.id, rangsInvestis: 3, modifDivers: 0 },              // total 3 (3+0sag)
  ])

  // ── 19. DONS DU PERSONNAGE ────────────────────────────────────────────────
  await db.insert(schema.characterFeats).values([
    { personnageId: cormac.id, featId: featTirBoutPortant.id },
    { personnageId: cormac.id, featId: featTirRapide.id },
    { personnageId: cormac.id, featId: featTirPrecision.id },
    { personnageId: cormac.id, featId: featSpecMartiale.id },
    { personnageId: cormac.id, featId: featArmePred.id },
    { personnageId: cormac.id, featId: featScienceInit.id },
  ])

  // ── 20. ARMES DU PERSONNAGE ───────────────────────────────────────────────
  await db.insert(schema.characterWeapons).values([
    {
      personnageId: cormac.id,
      armeId: epeeLongue.id,
      bonusMagique: 1,
      proprietesSpeciales: 'Détection de la magie permanente. Bonus attaque : +10/+5, Dégâts : 1d8+4, Critique : 19-20',
      quantite: 1,
    },
    {
      personnageId: cormac.id,
      armeId: arcLong.id,
      bonusMagique: 1,
      proprietesSpeciales: 'Bonus attaque : +11/+6, Dégâts : 1d8+3, Critique : 20 x3, Portée : 30m',
      quantite: 1,
    },
  ])

  // ── 21. ARMURE DU PERSONNAGE ──────────────────────────────────────────────
  await db.insert(schema.characterArmor).values({
    personnageId: cormac.id,
    armureId: mithralShirt.id,
    bonusMagique: 1,
    estPortee: 1,
  })

  // ── 22. OBJETS MAGIQUES DU PERSONNAGE ─────────────────────────────────────
  await db.insert(schema.characterMagicItems).values([
    { personnageId: cormac.id, objetId: capeProtection.id, emplacement: 'Épaules' },
    { personnageId: cormac.id, objetId: anneauProtection.id, emplacement: 'Doigt' },
    { personnageId: cormac.id, objetId: heaume.id, emplacement: 'Tête' },
    { personnageId: cormac.id, objetId: carquois.id, emplacement: 'Dos' },
    { personnageId: cormac.id, objetId: gantelets.id, emplacement: 'Mains' },
    { personnageId: cormac.id, objetId: anneauOreille.id, emplacement: 'Oreille', notes: 'Non magique, 100 po' },
    { personnageId: cormac.id, objetId: fibule.id, emplacement: 'Cape', notes: 'Non magique, 500 po' },
  ])

  // ── 23. POTIONS DU PERSONNAGE ─────────────────────────────────────────────
  await db.insert(schema.characterPotions).values([
    { personnageId: cormac.id, potionId: potionXenaton.id, chargesRestantes: 1 },
    { personnageId: cormac.id, potionId: potionRouge.id, chargesRestantes: 1 },
    { personnageId: cormac.id, potionId: potionGrise.id, chargesRestantes: 1, notes: 'Possible poison — à identifier' },
    { personnageId: cormac.id, potionId: potionJaune.id, chargesRestantes: 1 },
    { personnageId: cormac.id, potionId: potionSoin.id, chargesRestantes: 3 },
  ])

  // ── 24. MONNAIE ───────────────────────────────────────────────────────────
  await db.insert(schema.characterCurrency).values({
    personnageId: cormac.id,
    po: '1862',  // 1112 + 750
    pa: '0',
    pc: '0',
    pe: '0',
    pm: '0',
  })

  // ── 25. LANGUES ───────────────────────────────────────────────────────────
  await db.insert(schema.characterLanguages).values([
    { personnageId: cormac.id, langueId: langElfe.id },
    { personnageId: cormac.id, langueId: langCommun.id },
    { personnageId: cormac.id, langueId: langCumasti.id },
  ])

  // ── 26. MONTURE : SYLPHAR ────────────────────────────────────────────────
  await db.insert(schema.characterCreatures).values({
    personnageId: cormac.id,
    creatureId: sylphar.id,
    nomPersonnalise: 'Sylphar',
    role: 'Monture',
  })

  // ── 27. COMPAGNONS ────────────────────────────────────────────────────────
  await db.insert(schema.characterCompanions).values([
    { personnageId: cormac.id, nom: 'Grimdor', race: 'Sylvain/Nain', joueur: null, notes: 'Compagnon aventurier' },
    { personnageId: cormac.id, nom: 'Krugg', race: null, joueur: 'David', notes: 'Personnage joué par David' },
  ])

  console.log('✅ Seed terminé avec succès ! Cormac id:', cormac.id)
  return cormac.id
}

seed().catch((err) => { console.error('❌ Erreur seed:', err); process.exit(1) })

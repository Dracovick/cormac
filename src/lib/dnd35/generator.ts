import type { CharacterFormData } from '@/app/actions/character'
import { getRaceInfo } from './races'
import { getClasseInfo, getSortsSlotsParJour } from './classes'
import { getModifier, XP_PAR_NIVEAU } from './rules'
import { COMPETENCES_DND35 } from './skills'
import { SORTS_DND35, type ClasseSortKey } from './spells'

type StatKey = 'FOR' | 'DEX' | 'CON' | 'INT' | 'SAG' | 'CHA'

const STAT_PRIORITY: Record<string, StatKey[]> = {
  'Guerrier':    ['FOR', 'CON', 'DEX', 'SAG', 'CHA', 'INT'],
  'Barbare':     ['FOR', 'CON', 'DEX', 'SAG', 'CHA', 'INT'],
  'Paladin':     ['FOR', 'CHA', 'CON', 'SAG', 'DEX', 'INT'],
  'Rôdeur':      ['DEX', 'FOR', 'CON', 'SAG', 'INT', 'CHA'],
  'Magicien':    ['INT', 'CON', 'DEX', 'SAG', 'CHA', 'FOR'],
  'Ensorceleur': ['CHA', 'CON', 'DEX', 'SAG', 'INT', 'FOR'],
  'Prêtre':      ['SAG', 'CON', 'CHA', 'FOR', 'DEX', 'INT'],
  'Druide':      ['SAG', 'CON', 'DEX', 'FOR', 'INT', 'CHA'],
  'Barde':       ['CHA', 'DEX', 'CON', 'INT', 'SAG', 'FOR'],
  'Moine':       ['DEX', 'SAG', 'CON', 'FOR', 'INT', 'CHA'],
  'Roublard':    ['DEX', 'INT', 'CON', 'CHA', 'SAG', 'FOR'],
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

const DONS_PAR_CLASSE: Record<string, string[]> = {
  'Guerrier':    ['Attaque en puissance', 'Science de l\'initiative', 'Robustesse', 'Vigilance', 'Combat à deux armes', 'Frappe précise', 'Réflexes surhumains', 'Esquive', 'Tir à bout portant', 'Endurance'],
  'Barbare':     ['Attaque en puissance', 'Robustesse', 'Science de l\'initiative', 'Vigilance', 'Frappe précise', 'Esquive', 'Combat à deux armes', 'Réflexes surhumains', 'Endurance', 'Tir à bout portant'],
  'Paladin':     ['Robustesse', 'Science de l\'initiative', 'Vigilance', 'Attaque en puissance', 'Frappe précise', 'Combat monté', 'Esquive', 'Endurance', 'Réflexes surhumains', 'Tir à bout portant'],
  'Rôdeur':      ['Tir à bout portant', 'Esquive', 'Combat à deux armes', 'Frappe précise', 'Robustesse', 'Vigilance', 'Science de l\'initiative', 'Tir de précision', 'Endurance', 'Réflexes surhumains'],
  'Magicien':    ['Robustesse', 'Vigilance', 'Science de l\'initiative', 'Frappe précise', 'Esquive', 'Endurance', 'Réflexes surhumains', 'Résistance aux sorts', 'Maîtrise des sorts', 'Science des sorts'],
  'Ensorceleur': ['Robustesse', 'Vigilance', 'Science de l\'initiative', 'Frappe précise', 'Esquive', 'Réflexes surhumains', 'Endurance', 'Résistance aux sorts', 'Maîtrise des sorts', 'Science des sorts'],
  'Prêtre':      ['Robustesse', 'Vigilance', 'Science de l\'initiative', 'Frappe précise', 'Attaque en puissance', 'Esquive', 'Endurance', 'Réflexes surhumains', 'Science du renvoi', 'Combat en armure'],
  'Druide':      ['Robustesse', 'Vigilance', 'Esquive', 'Science de l\'initiative', 'Frappe précise', 'Endurance', 'Réflexes surhumains', 'Combat à deux armes', 'Tir à bout portant', 'Résistance aux sorts'],
  'Barde':       ['Robustesse', 'Vigilance', 'Esquive', 'Science de l\'initiative', 'Frappe précise', 'Endurance', 'Combat à deux armes', 'Réflexes surhumains', 'Tir à bout portant', 'Résistance aux sorts'],
  'Moine':       ['Robustesse', 'Vigilance', 'Expertise de combat', 'Esquive', 'Science de l\'initiative', 'Frappe précise', 'Réflexes surhumains', 'Endurance', 'Attaque en puissance', 'Combat défensif'],
  'Roublard':    ['Vigilance', 'Esquive', 'Frappe précise', 'Tir à bout portant', 'Science de l\'initiative', 'Combat à deux armes', 'Robustesse', 'Réflexes surhumains', 'Endurance', 'Tir de précision'],
}

const COMPETENCES_PRIORITAIRES: Record<string, string[]> = {
  'Guerrier':    ['Intimidation', 'Équitation', 'Natation', 'Saut', 'Escalade', 'Ouïe', 'Vue'],
  'Barbare':     ['Survie', 'Escalade', 'Natation', 'Intimidation', 'Ouïe', 'Vue', 'Saut'],
  'Paladin':     ['Diplomatie', 'Équitation', 'Premiers secours', 'Psychologie', 'Ouïe', 'Vue', 'Connaissance (religion)'],
  'Rôdeur':      ['Survie', 'Discrétion', 'Vue', 'Ouïe', 'Déplacement silencieux', 'Connaissance (nature)', 'Dressage'],
  'Magicien':    ['Connaissance (arcanes)', 'Magie divine', 'Concentration', 'Déchiffrage', 'Connaissance (histoire)', 'Connaissance (plans)', 'Fouille'],
  'Ensorceleur': ['Magie divine', 'Connaissance (arcanes)', 'Concentration', 'Bluff', 'Connaissance (religion)', 'Connaissance (plans)', 'Fouille'],
  'Prêtre':      ['Connaissance (religion)', 'Diplomatie', 'Premiers secours', 'Concentration', 'Psychologie', 'Ouïe', 'Vue'],
  'Druide':      ['Survie', 'Connaissance (nature)', 'Premiers secours', 'Concentration', 'Dressage', 'Ouïe', 'Vue'],
  'Barde':       ['Représentation', 'Diplomatie', 'Bluff', 'Connaissance (arcanes)', 'Ouïe', 'Vue', 'Magie divine'],
  'Moine':       ['Équilibre', 'Acrobaties', 'Concentration', 'Diplomatie', 'Psychologie', 'Ouïe', 'Vue'],
  'Roublard':    ['Discrétion', 'Déplacement silencieux', 'Fouille', 'Crochetage', 'Sabotage', 'Vue', 'Ouïe'],
}

// For Paladin/Rôdeur, index 0 = spell level 1 (no level 0 spells).
// For all others, index 0 = spell level 0.
const SORTS_RECOMMANDES: Partial<Record<ClasseSortKey, string[][]>> = {
  'Magicien': [
    ['Détection de la magie', 'Lecture de la magie', 'Lumière', 'Prestidigitation', 'Message', 'Réparation', 'Manipulation à distance'],
    ['Missile magique', 'Armure de mage', 'Bouclier', 'Charme-personne', 'Mains brûlantes', 'Sommeil', 'Identification', 'Compréhension des langages'],
    ['Invisibilité', 'Image miroir', 'Toile d\'araignée', 'Rayon ardent', 'Force de taureau', 'Grâce du chat', 'Endurance de l\'ours'],
    ['Boule de feu', 'Hâte', 'Vol', 'Dissipation de la magie', 'Éclair', 'Protection contre les énergies', 'Vision magique'],
    ['Peau de pierre', 'Dimension porte', 'Confusion', 'Métamorphose', 'Globe d\'invulnérabilité mineur', 'Invisibilité totale'],
    ['Téléportation', 'Cône de froid', 'Domination de personne', 'Mur de force', 'Télékinésie', 'Nuage mortel'],
    ['Désintégration', 'Globe d\'invulnérabilité', 'Métamorphose des autres', 'Suggestion de groupe', 'Image programmatique'],
    ['Cage de force', 'Doigt de mort', 'Téléportation parfaite', 'Paralysie de groupe', 'Simulacre'],
    ['Labyrinthe', 'Mot de pouvoir : Hébétement', 'Métamorphose universelle', 'Symbole de mort', 'Danse irrésistible'],
    ['Souhait', 'Arrêt du temps', 'Sphère prismatique', 'Tempête de météores', 'Mot de pouvoir : Mort', 'Porte'],
  ],
  'Ensorceleur': [
    ['Détection de la magie', 'Lecture de la magie', 'Lumière', 'Prestidigitation', 'Message', 'Réparation'],
    ['Missile magique', 'Armure de mage', 'Bouclier', 'Charme-personne', 'Mains brûlantes', 'Sommeil'],
    ['Invisibilité', 'Image miroir', 'Rayon ardent', 'Force de taureau', 'Toile d\'araignée'],
    ['Boule de feu', 'Hâte', 'Vol', 'Dissipation de la magie', 'Éclair'],
    ['Peau de pierre', 'Dimension porte', 'Confusion', 'Métamorphose', 'Invisibilité totale'],
    ['Téléportation', 'Cône de froid', 'Domination de personne', 'Mur de force', 'Télékinésie'],
    ['Désintégration', 'Globe d\'invulnérabilité', 'Suggestion de groupe'],
    ['Cage de force', 'Doigt de mort', 'Téléportation parfaite'],
    ['Labyrinthe', 'Mot de pouvoir : Hébétement', 'Symbole de mort'],
    ['Souhait', 'Arrêt du temps', 'Tempête de météores'],
  ],
  'Prêtre': [
    ['Détection de la magie', 'Soins mineurs', 'Guidage', 'Lumière', 'Résistance', 'Création d\'eau'],
    ['Soins légers', 'Bénédiction', 'Faveur divine', 'Protection contre le Mal', 'Commandement', 'Détection du Mal', 'Malédiction'],
    ['Soins modérés', 'Aide', 'Immobilisation de personne', 'Force de taureau', 'Résistance aux énergies'],
    ['Soins importants', 'Dissipation de la magie', 'Prière', 'Délivrance des malédictions'],
    ['Soins critiques', 'Immunité aux énergies', 'Liberté de mouvement'],
    ['Résurrection partielle', 'Aura mortelle', 'Fléau des insectes'],
    ['Guérison', 'Barrière de lames'],
    ['Résurrection vraie', 'Grande téléportation'],
    ['Symbole de mort'],
    ['Miracle', 'Porte'],
  ],
  'Druide': [
    ['Détection de la magie', 'Création d\'eau', 'Guidage', 'Résistance', 'Réparation', 'Détection du poison'],
    ['Soins légers', 'Enchevêtrement', 'Soin des animaux', 'Nappe de brouillard', 'Grâce du félin'],
    ['Lame de feu', 'Sens de la nature', 'Force de taureau', 'Endurance de l\'ours'],
    ['Soins modérés', 'Appel des foudres', 'Brume de corrosion', 'Respiration aquatique'],
    ['Métamorphose', 'Immunité aux énergies', 'Liberté de mouvement', 'Dissipation de la magie'],
    ['Soins critiques', 'Fléau des insectes', 'Mur de feu'],
    ['Peau de pierre'],
    ['Guérison'],
    ['Doigt de mort'],
    ['Œuvre de la nature', 'Vision du futur'],
  ],
  'Barde': [
    ['Détection de la magie', 'Lumière', 'Lecture de la magie', 'Prestidigitation', 'Message', 'Son imaginaire', 'Dissonance de chuchoteurs'],
    ['Soins légers', 'Charme-personne', 'Image silencieuse', 'Sommeil', 'Ventriloquie', 'Compréhension des langages', 'Frayeur'],
    ['Invisibilité', 'Image miroir', 'Suggestion', 'Détection des pensées', 'Grâce du félin', 'Fracassement'],
    ['Hâte', 'Ralentissement', 'Clairvoyance/Clairaudience', 'Image immatérielle', 'Invisibilité totale', 'Confusion', 'Charme-monstre', 'Scrutation'],
    ['Liberté de mouvement', 'Domination de personne', 'Dimension porte', 'Dissipation de la magie'],
    ['Suggestion de groupe'],
    ['Image programmatique', 'Danse irrésistible'],
  ],
  // Paladin: index 0 = spell level 1 (niveauMinSorts=1)
  'Paladin': [
    ['Soins légers', 'Bénédiction', 'Faveur divine', 'Détection du Mal', 'Appel d\'armes'],
    ['Résistance aux énergies', 'Force de taureau', 'Endurance de l\'ours'],
    ['Délivrance des malédictions', 'Prière'],
    ['Soins importants'],
  ],
  // Rôdeur: index 0 = spell level 1 (niveauMinSorts=1)
  'Rôdeur': [
    ['Soins légers', 'Alarme', 'Soin des animaux', 'Grâce du félin', 'Enchevêtrement', 'Résistance aux énergies'],
    ['Sens de la nature', 'Force de taureau', 'Protection contre les énergies'],
    ['Respiration aquatique', 'Vision dans le noir'],
    ['Liberté de mouvement', 'Scrutation'],
  ],
}

type ArmeGen = CharacterFormData['armes'][number]
type ArmureGen = CharacterFormData['armures'][number]

const ARMES_PAR_CLASSE: Record<string, ArmeGen[]> = {
  'Guerrier':    [{ nom: 'Épée longue', degats: '1d8', crit: '19-20/×2', typeDegats: 'T', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Arc court composite', degats: '1d6', crit: '20-20/×3', typeDegats: 'P', portee: '18 m', bonusMagique: 0, quantite: 1 }],
  'Barbare':     [{ nom: 'Grande hache', degats: '1d12', crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Javeline', degats: '1d6', crit: '20-20/×2', typeDegats: 'P', portee: '9 m', bonusMagique: 0, quantite: 3 }],
  'Paladin':     [{ nom: 'Épée longue', degats: '1d8', crit: '19-20/×2', typeDegats: 'T', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Lance de cavalerie', degats: '1d8', crit: '20-20/×3', typeDegats: 'P', portee: 'Contact', bonusMagique: 0, quantite: 1 }],
  'Rôdeur':      [{ nom: 'Épée longue', degats: '1d8', crit: '19-20/×2', typeDegats: 'T', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Arc long composite', degats: '1d8', crit: '20-20/×3', typeDegats: 'P', portee: '27 m', bonusMagique: 0, quantite: 1 }],
  'Magicien':    [{ nom: 'Bâton de combat', degats: '1d6', crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Dague', degats: '1d4', crit: '19-20/×2', typeDegats: 'P', portee: 'Contact', bonusMagique: 0, quantite: 1 }],
  'Ensorceleur': [{ nom: 'Bâton de combat', degats: '1d6', crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Dague', degats: '1d4', crit: '19-20/×2', typeDegats: 'P', portee: 'Contact', bonusMagique: 0, quantite: 1 }],
  'Prêtre':      [{ nom: 'Masse légère', degats: '1d6', crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', bonusMagique: 0, quantite: 1 }],
  'Druide':      [{ nom: 'Bâton de combat', degats: '1d6', crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Fronde', degats: '1d4', crit: '20-20/×2', typeDegats: 'C', portee: '15 m', bonusMagique: 0, quantite: 1 }],
  'Barde':       [{ nom: 'Rapière', degats: '1d6', crit: '18-20/×2', typeDegats: 'P', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Arc court', degats: '1d6', crit: '20-20/×3', typeDegats: 'P', portee: '18 m', bonusMagique: 0, quantite: 1 }],
  'Moine':       [{ nom: 'Bâton de combat', degats: '1d6', crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', bonusMagique: 0, quantite: 1 }],
  'Roublard':    [{ nom: 'Rapière', degats: '1d6', crit: '18-20/×2', typeDegats: 'P', portee: 'Contact', bonusMagique: 0, quantite: 1 }, { nom: 'Arc court', degats: '1d6', crit: '20-20/×3', typeDegats: 'P', portee: '18 m', bonusMagique: 0, quantite: 1 }, { nom: 'Dague', degats: '1d4', crit: '19-20/×2', typeDegats: 'P', portee: 'Contact', bonusMagique: 0, quantite: 1 }],
}

const ARMURES_PAR_CLASSE: Record<string, ArmureGen[]> = {
  'Guerrier':    [{ nom: 'Cotte de mailles', type: 'armure', bonusCA: 5, maxDex: 4, malusComp: -4, bonusMagique: 0 }, { nom: 'Bouclier en acier', type: 'bouclier', bonusCA: 2, maxDex: 99, malusComp: -1, bonusMagique: 0 }],
  'Barbare':     [{ nom: 'Cotte de mailles', type: 'armure', bonusCA: 5, maxDex: 4, malusComp: -4, bonusMagique: 0 }],
  'Paladin':     [{ nom: 'Armure complète', type: 'armure', bonusCA: 8, maxDex: 1, malusComp: -6, bonusMagique: 0 }, { nom: 'Bouclier en acier', type: 'bouclier', bonusCA: 2, maxDex: 99, malusComp: -1, bonusMagique: 0 }],
  'Rôdeur':      [{ nom: 'Armure de cuir cloutée', type: 'armure', bonusCA: 3, maxDex: 5, malusComp: -1, bonusMagique: 0 }],
  'Magicien':    [],
  'Ensorceleur': [],
  'Prêtre':      [{ nom: 'Armure de plaques', type: 'armure', bonusCA: 6, maxDex: 3, malusComp: -4, bonusMagique: 0 }, { nom: 'Bouclier en acier', type: 'bouclier', bonusCA: 2, maxDex: 99, malusComp: -1, bonusMagique: 0 }],
  'Druide':      [{ nom: 'Armure de cuir', type: 'armure', bonusCA: 2, maxDex: 6, malusComp: 0, bonusMagique: 0 }],
  'Barde':       [{ nom: 'Armure de cuir', type: 'armure', bonusCA: 2, maxDex: 6, malusComp: 0, bonusMagique: 0 }],
  'Moine':       [],
  'Roublard':    [{ nom: 'Armure de cuir', type: 'armure', bonusCA: 2, maxDex: 6, malusComp: 0, bonusMagique: 0 }],
}

const LANGUES_PAR_RACE: Record<string, string[]> = {
  'Humain':    ['Commun'],
  'Elfe':      ['Commun', 'Elfique'],
  'Nain':      ['Commun', 'Nain'],
  'Halfelin':  ['Commun', 'Halfelin'],
  'Gnome':     ['Commun', 'Gnome', 'Draconique'],
  'Demi-Elfe': ['Commun', 'Elfique'],
  'Demi-Orque':  ['Commun', 'Orc'],
}

const NOMS_PAR_RACE: Record<string, { masculin: string[]; feminin: string[] }> = {
  'Humain':    { masculin: ['Aldric', 'Brennan', 'Caius', 'Doran', 'Edric', 'Gareth', 'Ivan', 'Marcus', 'Roland', 'Tristan'], feminin: ['Aelinda', 'Brenna', 'Calla', 'Daria', 'Elara', 'Faye', 'Gwynn', 'Isadora', 'Jana', 'Lyra'] },
  'Elfe':      { masculin: ['Caladrel', 'Elroar', 'Galathiel', 'Larendar', 'Mirendol', 'Seldrel', 'Talandel'], feminin: ['Aerindel', 'Caelindra', 'Elara', 'Isindra', 'Lirindra', 'Sylindra', 'Talindra'] },
  'Nain':      { masculin: ['Balin', 'Dwalin', 'Farin', 'Gimdar', 'Hrundar', 'Kordak', 'Thorin'], feminin: ['Embla', 'Gunhild', 'Helga', 'Ingrid', 'Krata', 'Marta', 'Sigrid'] },
  'Halfelin':  { masculin: ['Andry', 'Cade', 'Eldon', 'Garret', 'Hob', 'Milo', 'Perrin'], feminin: ['Amaryllis', 'Dee', 'Euphemia', 'Glenda', 'Kithri', 'Lidda', 'Nissa'] },
  'Gnome':     { masculin: ['Alston', 'Boddynock', 'Dimble', 'Fonkin', 'Glix', 'Nim', 'Warryn'], feminin: ['Bimpnottin', 'Caramip', 'Duvamil', 'Ellyjobell', 'Lilli', 'Nissa', 'Roywyn'] },
  'Demi-Elfe': { masculin: ['Brandyl', 'Calib', 'Darian', 'Elvar', 'Faelan', 'Garyn', 'Ivar'], feminin: ['Aelira', 'Brenna', 'Calinda', 'Daria', 'Elaira', 'Gwyn', 'Irinna'] },
  'Demi-Orque':  { masculin: ['Argran', 'Braak', 'Crusk', 'Dench', 'Feng', 'Krusk', 'Mhurren'], feminin: ['Arha', 'Baggi', 'Emen', 'Engong', 'Kansif', 'Myev', 'Neega'] },
}

export interface GenParams {
  race: string
  classe: string
  niveau: number
  alignement: string
  sexe?: 'Masculin' | 'Féminin'
}

export function generateCharacter(params: GenParams): CharacterFormData {
  const { race, classe, niveau, alignement, sexe = 'Masculin' } = params

  const raceInfo = getRaceInfo(race)
  const classeInfo = getClasseInfo(classe)
  if (!raceInfo || !classeInfo) throw new Error('Race ou classe invalide')

  // ── Stats (tableau standard par priorité de classe) ─────────────────────────
  const priority = STAT_PRIORITY[classe] ?? ['FOR', 'CON', 'DEX', 'INT', 'SAG', 'CHA']
  const base: Record<StatKey, number> = { FOR: 10, DEX: 10, CON: 10, INT: 10, SAG: 10, CHA: 10 }
  STANDARD_ARRAY.forEach((val, i) => { base[priority[i]] = val })

  const conMod = getModifier(base.CON + raceInfo.bonusCon)
  const intMod = getModifier(base.INT + raceInfo.bonusInt)

  // ── PV (max au niv 1, moyenne aux suivants) ─────────────────────────────────
  const de = classeInfo.de
  const pvMax = Math.max(niveau, de + conMod + (niveau > 1 ? (Math.floor(de / 2) + 1 + conMod) * (niveau - 1) : 0))

  // ── Compétences ─────────────────────────────────────────────────────────────
  const bonusHumain = race === 'Humain' ? 1 : 0
  const pointsParNiv = Math.max(1, classeInfo.competencesParNiveau + intMod) + bonusHumain
  const totalPoints = pointsParNiv * (niveau + 3)
  const rangMax = niveau + 3

  const priorites = COMPETENCES_PRIORITAIRES[classe] ?? []
  const deClasse = COMPETENCES_DND35.filter(c => c.classesCompetence.includes(classe))
  const ordonnees = [
    ...priorites.map(nom => deClasse.find(c => c.nom === nom)).filter(Boolean) as typeof COMPETENCES_DND35,
    ...deClasse.filter(c => !priorites.includes(c.nom)),
  ]

  const rangsMap = new Map<string, number>()
  let pts = totalPoints
  for (const comp of ordonnees) {
    if (pts <= 0) break
    const r = Math.min(rangMax, pts)
    rangsMap.set(comp.nom, r)
    pts -= r
  }

  const competences = COMPETENCES_DND35.map(c => ({
    skillId: 0,
    nom: c.nom,
    caracteristique: c.caracteristique,
    rangs: rangsMap.get(c.nom) ?? 0,
    divers: 0,
  }))

  // ── Dons ────────────────────────────────────────────────────────────────────
  const donsNormaux = 1 + Math.floor(niveau / 3)
  const donsHumain = race === 'Humain' ? 1 : 0
  const GUERRIER_BONUS = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
  const donsGuerrier = classe === 'Guerrier' ? GUERRIER_BONUS.filter(l => l <= niveau).length : 0
  const dons = (DONS_PAR_CLASSE[classe] ?? []).slice(0, donsNormaux + donsHumain + donsGuerrier)

  // ── Sorts ───────────────────────────────────────────────────────────────────
  const sorts: CharacterFormData['sorts'] = []
  if (classeInfo.lanceurSorts) {
    const classeKey = classe as ClasseSortKey
    const slots = getSortsSlotsParJour(classe, niveau)
    const recommandes = SORTS_RECOMMANDES[classeKey]
    const niveauMin = (classe === 'Paladin' || classe === 'Rôdeur') ? 1 : 0

    if (recommandes) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === 0) continue
        const nivSort = niveauMin + i
        const listeNiv = recommandes[i] ?? []
        const nbSorts = Math.min(listeNiv.length, slots[i] + 2)
        for (let j = 0; j < nbSorts; j++) {
          const sortInfo = SORTS_DND35.find(s => s.nom === listeNiv[j] && (s.niveaux[classeKey] ?? -1) === nivSort)
          if (sortInfo) sorts.push({ nom: sortInfo.nom, niveau: nivSort, ecole: sortInfo.ecole, nombrePrepare: 0 })
        }
      }
    }
  }

  // ── Nom aléatoire ────────────────────────────────────────────────────────────
  const nomsList = NOMS_PAR_RACE[race] ?? NOMS_PAR_RACE['Humain']
  const listeNoms = sexe === 'Féminin' ? nomsList.feminin : nomsList.masculin
  const nom = listeNoms[Math.floor(Math.random() * listeNoms.length)]

  // ── CA (auto-calculé depuis armures) ────────────────────────────────────────
  const armures = ARMURES_PAR_CLASSE[classe] ?? []

  return {
    nom, surnom: '', sexe, age: '', taille: '', poids: '', yeux: '', cheveux: '',
    race, classe, niveau, alignement,
    classes: [{ classe, niveau }],
    divinite: '', clan: '', xp: XP_PAR_NIVEAU[niveau] ?? 0, photoUrl: '',

    forBase: base.FOR, forMagique: 0,
    dexBase: base.DEX, dexMagique: 0,
    conBase: base.CON, conMagique: 0,
    intBase: base.INT, intMagique: 0,
    sagBase: base.SAG, sagMagique: 0,
    chaBase: base.CHA, chaMagique: 0,

    pvMax, pvActuels: pvMax,
    caNaturelle: 0, caDeflexion: 0, caDivers: 0,
    initiativeBonus: 0,
    bbaCorpsOverride: null, bbaProjectilesOverride: null,
    deplacement: null, karma: 0,
    reflexesMagique: 0, vigueurMagique: 0, volonteMagique: 0,

    competences, dons,
    armes: ARMES_PAR_CLASSE[classe] ?? [],
    armures,
    objetsMagiques: [], potions: [],
    pp: 0, po: 0, pe: 0, pa: 0, pc: 0, pm: 0,
    langues: LANGUES_PAR_RACE[race] ?? ['Commun'],
    sorts,
    historique: '', notes: '', compagnons: [],
    joueurPrenom: '', joueurNom: '',
  }
}

export type FeatCategorie = 'Combat' | 'Tir' | 'Magie' | 'Métamagie' | 'Création d\'objets' | 'Divin' | 'Général'

export interface FeatDef {
  nom: string
  categorie: FeatCategorie
  needsWeapon?: boolean
  description: string
  prerequis?: string[]  // ex. ["Arme de prédilection", "BBA+4"]
  /**
   * Autres façons de chercher ce don : son nom anglais d'abord, puisque la
   * moitié des tables de 3.5 le connaissent sous ce nom-là, et l'ancien nom
   * maison quand il y en avait un. Le champ de recherche les interroge, mais
   * seul `nom` est écrit sur la fiche.
   */
  alias?: string[]
}

import { FEATS_SUPPLEMENTS } from './feats-supplements'

const FEATS_BASE: FeatDef[] = [
  // ── GÉNÉRAL ─────────────────────────────────────────────────────────────────
  { nom: 'Robustesse',               categorie: 'Général', description: '+3 points de vie' },
  { nom: 'Grande résistance',        categorie: 'Général', description: '+2 aux jets de Vigueur' },
  { nom: 'Volonté de fer',           categorie: 'Général', description: '+2 aux jets de Volonté' },
  { nom: 'Réflexes surhumains',      categorie: 'Général', description: '+2 aux jets de Réflexes' },
  { nom: 'Science de l\'initiative', categorie: 'Général', description: '+4 à l\'initiative' },
  { nom: 'Vigilance',                categorie: 'Général', description: '+2 aux tests de Psychologie et Détection' },
  { nom: 'Endurance',                categorie: 'Général', description: '+4 aux tests de Constitution prolongés' },
  { nom: 'Esquive',                  categorie: 'Général', description: '+1 à la CA contre un adversaire désigné' },
  { nom: 'Mobilité',                 categorie: 'Général', description: '+4 à la CA contre les attaques d\'opportunité en déplacement', prerequis: ['Esquive'] },
  { nom: 'Course',                   categorie: 'Général', description: 'Déplacement ×5 en course, pas de malus de DEX à la CA' },
  { nom: 'Réflexes de combat',       categorie: 'Général', description: 'Attaques d\'opportunité supplémentaires (mod. DEX par round)' },
  { nom: 'Expertise de combat',      categorie: 'Général', description: 'Échange jusqu\'à −5 en attaque contre +5 à la CA', prerequis: ['INT13'] },
  // Eschew Materials. Au Manuel c'est un don GÉNÉRAL, pas de métamagie : il ne
  // coûte aucun niveau d'emplacement. L'ancien « Sort discret » le classait à tort.
  { nom: 'Dispense de composantes matérielles', categorie: 'Général', alias: ['Eschew Materials', 'Sort discret'], description: 'Lancer sans les composantes matérielles coûtant 1 po ou moins' },
  // Weapon Finesse. Le sélecteur l'appelait « Acuité martiale » — une traduction
  // maison qu'aucun livre ne porte, alors que le catalogue de la Bibliothèque
  // avait déjà le nom du SRD. Et il ouvrait un sélecteur d'ARME : c'est la règle
  // de la 3.0. La 3.5 l'applique à toute arme légère, plus trois exceptions
  // nommées (rapière, fouet, chaîne cloutée) — aucun choix à faire.
  // Le Manuel le classe GÉNÉRAL ; un guerrier peut le prendre en don de bonus.
  { nom: 'Attaque en finesse',       categorie: 'Général', alias: ['Weapon Finesse', 'Acuité martiale'], prerequis: ['BBA+1'], description: 'Appliquer le modificateur de DEX au lieu de celui de FOR aux jets d\'attaque avec une arme légère, une rapière, un fouet ou une chaîne cloutée' },

  // ── COMBAT ──────────────────────────────────────────────────────────────────
  { nom: 'Arme de prédilection',              categorie: 'Combat', needsWeapon: true, description: '+1 aux jets d\'attaque avec l\'arme choisie' },
  { nom: 'Maîtrise martiale supérieure',      categorie: 'Combat', needsWeapon: true, description: '+1 attaque supplémentaire avec l\'arme choisie (Guerrier niv. 4)', prerequis: ['Arme de prédilection', 'BBA+4'] },
  { nom: 'Spécialisation martiale',           categorie: 'Combat', needsWeapon: true, description: '+2 aux dégâts avec l\'arme choisie (Guerrier niv. 4)', prerequis: ['Arme de prédilection', 'BBA+4'] },
  { nom: 'Spécialisation martiale supérieure',categorie: 'Combat', needsWeapon: true, description: '+2 dégâts supplémentaires avec l\'arme choisie (Guerrier niv. 8)', prerequis: ['Spécialisation martiale', 'BBA+8'] },
  { nom: 'Attaque en puissance',              categorie: 'Combat', description: 'Échange jusqu\'à −5 en attaque contre +5 aux dégâts (à 2 mains : +10)', prerequis: ['FOR13'] },
  { nom: 'Fendant',                           categorie: 'Combat', description: 'Attaque supplémentaire gratuite si l\'ennemi est mis hors de combat', prerequis: ['BBA+1'] },
  { nom: 'Grand fendant',                     categorie: 'Combat', description: 'Attaque supplémentaire après chaque ennemi mis hors de combat', prerequis: ['Fendant', 'BBA+4'] },
  { nom: 'Attaque en vol',                    categorie: 'Combat', description: 'Se déplacer, attaquer, puis finir le déplacement en une action', prerequis: ['Mobilité', 'BBA+4'] },
  { nom: 'Tourbillon',                        categorie: 'Combat', description: 'Attaquer toutes les créatures adjacentes en une action de round', prerequis: ['Combat défensif', 'Expertise de combat', 'Mobilité', 'Attaque en vol', 'BBA+4'] },
  { nom: 'Frappe précise',                    categorie: 'Combat', description: 'Ignore le bonus d\'armure et de bouclier d\'un adversaire (une attaque)', prerequis: ['Expertise de combat', 'BBA+8'] },
  { nom: 'Combat à deux armes',               categorie: 'Combat', description: 'Réduit les malus pour combattre avec une arme dans chaque main' },
  { nom: 'Combat à deux armes supérieur',     categorie: 'Combat', description: 'Deuxième attaque supplémentaire avec l\'arme secondaire', prerequis: ['Combat à deux armes', 'BBA+6'] },
  { nom: 'Combat à deux armes optimal',       categorie: 'Combat', description: 'Troisième attaque supplémentaire avec l\'arme secondaire', prerequis: ['Combat à deux armes supérieur', 'BBA+11'] },
  { nom: 'Défense à deux armes',              categorie: 'Combat', description: '+1 à la CA quand on tient une arme dans chaque main', prerequis: ['Combat à deux armes'] },
  { nom: 'Maîtrise du bouclier',              categorie: 'Combat', description: 'Utiliser un bouclier sans malus aux jets d\'attaque' },
  { nom: 'Combat monté',                      categorie: 'Combat', description: 'Annule jusqu\'à son mod. d\'Équitation en dégâts sur la monture', prerequis: ['BBA+1'] },
  { nom: 'Piétinement',                       categorie: 'Combat', description: 'Renverser un adversaire lors d\'un piétinement sans attaque d\'opportunité', prerequis: ['Combat monté'] },
  { nom: 'Tir depuis une monture',            categorie: 'Combat', description: 'Réduit le malus de tir à cheval de −4 à −2', prerequis: ['Combat monté'] },
  { nom: 'Coup étourdissant',                 categorie: 'Combat', description: 'Jet de Vigueur ou l\'adversaire est étourdi pendant 1 round', prerequis: ['BBA+8'] },
  { nom: 'Science de la bousculade',          categorie: 'Combat', description: 'Bousculer sans déclencher d\'attaque d\'opportunité, +4 au test' },
  { nom: 'Science du désarmement',            categorie: 'Combat', description: 'Désarmer sans déclencher d\'attaque d\'opportunité', prerequis: ['BBA+1'] },
  { nom: 'Science de la feinte',              categorie: 'Combat', description: 'Feinter en combat comme une action rapide' },
  { nom: 'Science du renversement',           categorie: 'Combat', description: 'Renverser sans déclencher d\'attaque d\'opportunité' },
  { nom: 'Science du croc-en-jambe',          categorie: 'Combat', description: 'Croc-en-jambe sans déclencher d\'attaque d\'opportunité' },
  { nom: 'Combat défensif',                   categorie: 'Combat', description: '+2 à la CA en échange de −4 aux attaques pour le round' },

  // ── TIR ─────────────────────────────────────────────────────────────────────
  { nom: 'Tir à bout portant',                categorie: 'Tir', description: '+1 aux attaques et dégâts à distance à portée ≤ 9 m' },
  { nom: 'Tir de précision',                  categorie: 'Tir', description: 'Attaque supplémentaire à −2 avec une arme à distance par round', prerequis: ['Tir à bout portant', 'BBA+1'] },
  { nom: 'Tir en mêlée',                      categorie: 'Tir', description: 'Tirer ou lancer en mêlée sans déclencher d\'attaque d\'opportunité', prerequis: ['Tir à bout portant'] },
  { nom: 'Tir rapide',                        categorie: 'Tir', description: 'Tirer jusqu\'à 5 flèches en une attaque de plein BBA (1d6 chacune)', prerequis: ['Tir à bout portant', 'BBA+6'] },
  { nom: 'Tir à la volée',                    categorie: 'Tir', description: 'Se déplacer et tirer à chaque tranche de déplacement', prerequis: ['Tir à bout portant', 'Tir de précision', 'BBA+4'] },
  { nom: 'Visée',                             categorie: 'Tir', description: '+1 aux attaques à distance si aucun déplacement ce round', prerequis: ['Tir à bout portant'] },
  { nom: 'Tir de loin',                       categorie: 'Tir', description: 'Augmente la portée des armes à distance de 50 %', prerequis: ['Tir à bout portant'] },

  // ── MAGIE ───────────────────────────────────────────────────────────────────
  { nom: 'Résistance aux sorts',              categorie: 'Magie', description: '+2 aux jets de sauvegarde contre les sorts et effets magiques' },
  { nom: 'Maîtrise des sorts',                categorie: 'Magie', description: 'Lancer un sort de niv. 0 ou 1 sans dépenser d\'emplacement (1/jour)' },
  { nom: 'Science des sorts (Abjuration)',    categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Abjuration' },
  { nom: 'Science des sorts (Divination)',    categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts de Divination' },
  { nom: 'Science des sorts (Enchantement)',  categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Enchantement' },
  { nom: 'Science des sorts (Évocation)',     categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Évocation' },
  { nom: 'Science des sorts (Illusion)',      categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Illusion' },
  { nom: 'Science des sorts (Invocation)',    categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Invocation' },
  { nom: 'Science des sorts (Nécromancie)',   categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts de Nécromancie' },
  { nom: 'Science des sorts (Transmutation)', categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts de Transmutation' },
  { nom: 'Maîtrise des sorts supérieure',     categorie: 'Magie', description: '+1 au DD pour une école choisie (prérequis : Science des sorts)' },
  { nom: 'Incantation en armure légère',      categorie: 'Magie', description: 'Lancer des sorts en armure légère sans risque d\'échec magique' },
  { nom: 'Incantation en armure intermédiaire', categorie: 'Magie', description: 'Lancer des sorts en armure intermédiaire sans risque d\'échec magique' },

  // ── MÉTAMAGIE ───────────────────────────────────────────────────────────────
  // Noms de la traduction officielle (SRD 3.5 VF, chapitre des dons). Les noms
  // maison d'avant — « Sort puissant », « Sort maximisé »… — ne correspondaient
  // à aucun livre et rendaient les dons introuvables : voir drizzle/0008 et la
  // table `feats` de la Bibliothèque, qui porte ces mêmes neuf noms.
  { nom: 'Augmentation d\'intensité',   categorie: 'Métamagie', alias: ['Heighten Spell', 'Sort intensifié'],  description: 'Le sort compte comme étant d\'un niveau supérieur, 9e maximum : DD et pénétration recalculés (emplacement du nouveau niveau)' },
  { nom: 'Extension d\'effet',          categorie: 'Métamagie', alias: ['Empower Spell', 'Sort puissant'],     description: 'Tous les effets numériques et aléatoires du sort augmentent de 50 % (+2 niveaux d\'emplacement)' },
  { nom: 'Extension de durée',          categorie: 'Métamagie', alias: ['Extend Spell', 'Sort étendu'],        description: 'Durée doublée ; sans effet sur les sorts permanents, instantanés ou à concentration (+1 niveau d\'emplacement)' },
  { nom: 'Extension de portée',         categorie: 'Métamagie', alias: ['Enlarge Spell'],                      description: 'Portée courte, moyenne ou longue doublée (+1 niveau d\'emplacement)' },
  { nom: 'Extension de zone d\'effet',  categorie: 'Métamagie', alias: ['Widen Spell'],                        description: 'Zone d\'effet +100 % — émanation, étendue, ligne ou rayonnement (+3 niveaux d\'emplacement)' },
  { nom: 'Incantation rapide',          categorie: 'Métamagie', alias: ['Quicken Spell', 'Sort rapide'],       description: 'Incantation en action libre, un seul sort par round, sans attaque d\'opportunité (+4 niveaux d\'emplacement)' },
  { nom: 'Incantation silencieuse',     categorie: 'Métamagie', alias: ['Silent Spell', 'Sort silencieux'],    description: 'Lancer sans composante verbale (+1 niveau d\'emplacement)' },
  { nom: 'Incantation statique',        categorie: 'Métamagie', alias: ['Still Spell', 'Sort stationnaire'],   description: 'Lancer sans composante gestuelle (+1 niveau d\'emplacement)' },
  { nom: 'Quintessence des sorts',      categorie: 'Métamagie', alias: ['Maximize Spell', 'Sort maximisé'],    description: 'Tous les effets variables prennent leur valeur maximale (+3 niveaux d\'emplacement)' },

  // ── CRÉATION D'OBJETS ───────────────────────────────────────────────────────
  // Le niveau de lanceur est écrit dans la description, pas dans `prerequis` :
  // verifierPrerequisDon() ne sait lire que des noms de dons, « BBA+N » et
  // « STATxx », et l'afficherait donc comme un prérequis éternellement manquant.
  { nom: 'Écriture de parchemins',               categorie: 'Création d\'objets', alias: ['Scribe Scroll'],              description: 'Rédiger un parchemin de tout sort connu — 25 po × NLS × niveau du sort (niveau 1 de lanceur)' },
  { nom: 'Préparation de potions',               categorie: 'Création d\'objets', alias: ['Brew Potion'],                description: 'Concocter une potion reproduisant un sort du 3e niveau au plus — 50 po × NLS × niveau du sort (niveau 3 de lanceur)' },
  { nom: 'Création d\'objets merveilleux',       categorie: 'Création d\'objets', alias: ['Craft Wondrous Item'],        description: 'Fabriquer n\'importe quel objet merveilleux (niveau 3 de lanceur)' },
  { nom: 'Création d\'armes et armures magiques',categorie: 'Création d\'objets', alias: ['Craft Magic Arms and Armor'], description: 'Enchanter armes, armures et boucliers de maître (niveau 5 de lanceur)' },
  { nom: 'Création de baguettes magiques',       categorie: 'Création d\'objets', alias: ['Craft Wand'],                 description: 'Fabriquer une baguette de 50 charges, sort du 4e niveau au plus — 750 po × NLS × niveau du sort (niveau 5 de lanceur)' },
  { nom: 'Création de sceptres magiques',        categorie: 'Création d\'objets', alias: ['Craft Rod'],                  description: 'Fabriquer n\'importe quel sceptre (niveau 9 de lanceur)' },
  { nom: 'Création de bâtons magiques',          categorie: 'Création d\'objets', alias: ['Craft Staff'],                description: 'Fabriquer un bâton de 50 charges (niveau 12 de lanceur)' },
  { nom: 'Création d\'anneaux magiques',         categorie: 'Création d\'objets', alias: ['Forge Ring'],                 description: 'Fabriquer n\'importe quel anneau magique (niveau 12 de lanceur)' },

  // ── DIVIN ───────────────────────────────────────────────────────────────────
  { nom: 'Science du renvoi',     categorie: 'Divin', description: '+2 aux jets de renvoi/commandement des morts-vivants' },
  { nom: 'Renvoi renforcé',       categorie: 'Divin', description: '+4 tentatives de renvoi ou commandement par jour' },
  { nom: 'Incantation spontanée', categorie: 'Divin', description: 'Convertir un sort préparé en sort de soins ou d\'affliction' },
]

// Catalogue complet : dons du Manuel des Joueurs + dons des suppléments
// (Codex Divin, Codex Profane, Maîtres de la Nature, Royaumes Oubliés)
export const FEATS_DND35: FeatDef[] = [...FEATS_BASE, ...FEATS_SUPPLEMENTS]

// Vérifie les prérequis d'un don. prerequis peut contenir des noms de dons, "BBA+N", "STATX" (FOR13, INT13...)
export function verifierPrerequisDon(
  feat: FeatDef,
  donsActifs: string[],  // noms des dons déjà pris
  bab: number,
  abilityScores?: { for: number; dex: number; con: number; int: number; sag: number; cha: number }
): string[] {
  const manquants: string[] = []
  for (const req of feat.prerequis ?? []) {
    if (/^BBA\+(\d+)$/.test(req)) {
      const min = parseInt(req.slice(4))
      if (bab < min) manquants.push(`BBA +${min}`)
    } else if (/^(FOR|DEX|CON|INT|SAG|CHA)(\d+)$/.test(req)) {
      const stat = req.slice(0, 3)
      const min = parseInt(req.slice(3))
      const map: Record<string, number | undefined> = {
        FOR: abilityScores?.for, DEX: abilityScores?.dex, CON: abilityScores?.con,
        INT: abilityScores?.int, SAG: abilityScores?.sag, CHA: abilityScores?.cha,
      }
      const val = map[stat]
      if (val == null || val < min) manquants.push(`${stat} ≥ ${min}`)
    } else {
      // Prérequis = nom d'un autre don (avec ou sans arme entre parenthèses — on ignore l'arme)
      const reqNom = req.replace(/\s*\(.*?\)$/, '').trim()
      const hasIt = donsActifs.some(d => d.replace(/\s*\(.*?\)$/, '').trim() === reqNom)
      if (!hasIt) manquants.push(req)
    }
  }
  return manquants
}

// Catégories pertinentes par classe (pour filtrer les onglets dans l'UI)
export const CATEGORIES_PAR_CLASSE: Record<string, FeatCategorie[]> = {
  'Guerrier':    ['Combat', 'Tir'],
  'Barbare':     ['Combat', 'Tir'],
  'Paladin':     ['Combat', 'Divin'],
  'Rôdeur':      ['Combat', 'Tir'],
  'Magicien':    ['Magie', 'Métamagie', 'Création d\'objets'],
  'Ensorceleur': ['Magie', 'Métamagie', 'Création d\'objets'],
  'Prêtre':      ['Combat', 'Magie', 'Métamagie', 'Création d\'objets', 'Divin'],
  'Druide':      ['Magie', 'Métamagie', 'Création d\'objets', 'Divin'],
  'Barde':       ['Combat', 'Magie', 'Métamagie', 'Création d\'objets'],
  'Bretteur':    ['Combat', 'Tir'],
  'Moine':       ['Combat'],
  'Roublard':    ['Combat', 'Tir'],
}

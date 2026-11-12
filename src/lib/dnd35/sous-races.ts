/**
 * LES SOUS-RACES DE D&D 3.5
 *
 * Une sous-race n'est pas une race de plus : c'est une race du Manuel dont
 * quelques traits changent. Le livre l'écrit toujours de la même façon —
 * « les X possèdent les traits suivants, EN PLUS de ceux des Y (sauf mention
 * contraire) » — et c'est exactement ce que ce module encode.
 *
 * ⚠ Le piège, qui a coûté une relecture complète : certains ajustements
 * S'AJOUTENT à ceux de la race (l'elfe gris est un haut-elfe PLUS +2 Int/−2 For)
 * et d'autres les REMPLACENT (l'elfe sauvage n'est pas +2 Dex ET +2 Dex). Le
 * livre le dit entre parenthèses : « (Ces ajustements remplacent ceux des elfes
 * hauts.) ». D'où le drapeau `remplaceAjustements`, qu'il ne faut jamais deviner.
 *
 * ── Comment une sous-race vit dans la base ────────────────────────────────
 * Elle n'a PAS de colonne à elle. Elle est une ligne de `races` — nom complet,
 * ajustements déjà fusionnés — et ses traits sont des lignes de `racial_features`,
 * la table que la fiche affiche déjà. Conséquence voulue : aucun calcul ne change,
 * puisque la page du personnage lit `races.bonus_*` et la feuille imprimée lit
 * `getRaceInfo()`. Les deux doivent rendre la MÊME chose — `fusionner()` est la
 * seule source, et `scripts/peupler-sous-races.mjs` écrit en base ce qu'elle rend.
 *
 * ⛔ Une fiche sans sous-race ne change pas d'un chiffre. C'est la condition de
 * livraison : 74 fiches relevées avant et après.
 *
 * Sources : SRD 3.5 français (chapitres Monstres) pour le Manuel des Monstres,
 * et le Cadre de campagne des Royaumes Oubliés (VF, p. 11-20) relevé à l'image
 * pour Faerûn. Les divergences entre les deux livres sont signalées là où elles
 * existent, jamais arbitrées en silence.
 */
import { RACES_DND35, getRaceInfo, type RaceInfo } from './races'

/** D'où vient la sous-race. Le joueur doit pouvoir retrouver la page. */
export type SourceSousRace = 'Manuel des Monstres' | 'Royaumes Oubliés' | 'Les deux'

/**
 * Ce que le Grimoire fait d'un trait, repris du vocabulaire des dons :
 *   ⚙ `calcul` — c'est déjà dans les totaux de la fiche;
 *   ✋ `main`   — un chiffre réel, mais que le Grimoire ne calcule pas : à appliquer soi-même;
 *   ℹ `info`   — une règle à connaître, sans chiffre à reporter.
 */
export type EffetTrait = 'calcul' | 'main' | 'info'

export interface TraitSousRace {
  nom: string
  description: string
  effet: EffetTrait
}

export interface SousRaceInfo {
  /** Nom complet, celui qui est écrit sur la fiche : « Halfelin vaillant ». */
  nom: string
  /** La race parente, telle qu'elle figure dans RACES_DND35. */
  race: string
  /** Ce qui s'affiche dans le menu déroulant, race sous-entendue : « Vaillant ». */
  etiquette: string
  source: SourceSousRace
  /** Autres noms du livre ou de la table — reconnus par getSousRaceInfo. */
  alias?: string[]
  /** Deux lignes de contexte, pour que le choix veuille dire quelque chose. */
  description: string
  /** Où on les rencontre. Vide quand le livre ne le dit pas. */
  regions?: string
  /** Ajustements de caractéristiques propres à la sous-race. */
  ajustements?: Partial<Record<'for' | 'dex' | 'con' | 'int' | 'sag' | 'cha', number>>
  /** true = les ajustements ci-dessus REMPLACENT ceux de la race parente. */
  remplaceAjustements?: boolean
  taille?: string
  deplacement?: number
  visionNocturne?: boolean
  /** Remplace la classe de prédilection de la race (elle fixe la pénalité d'XP). */
  classePreferee?: string
  /** Ajustement de niveau du livre. ⛔ Affiché, jamais appliqué aux calculs d'XP. */
  ajustementNiveau?: number
  traits: TraitSousRace[]
  /**
   * Noms EXACTS des traits de la race parente que cette sous-race contredit
   * frontalement, et qu'il ne faut donc pas afficher à côté des siens.
   * ⚠ « Chance halfeline » et « Pas de chance halfeline » sur la même fiche,
   * c'est une fiche qui ment. Les traits seulement NUANCÉS restent affichés :
   * c'est le trait de la sous-race qui dit ce qu'il remplace, comme le livre.
   */
  remplace?: string[]
  /** Ce que l'autre livre dit différemment. Affiché tel quel, pas arbitré. */
  divergence?: string
}

// ─── HALFELINS ────────────────────────────────────────────────────────────────
const HALFELINS: SousRaceInfo[] = [
  {
    nom: 'Halfelin pied-léger', race: 'Halfelin', etiquette: 'Pied-léger', source: 'Les deux',
    alias: ['Pied-léger', 'Pieds-légers', 'Lightfoot'],
    description: "Les halfelins les plus nombreux, et ceux que décrit le Manuel des Joueurs. Commerçants, artisans et bateleurs errants, ils cèdent volontiers aux charmes de l'aventure.",
    regions: 'Partout. Le royaume de Luiren est le foyer ancestral de la race.',
    traits: [],
  },
  {
    nom: 'Halfelin vaillant', race: 'Halfelin', etiquette: 'Vaillant', source: 'Royaumes Oubliés',
    alias: ['Vaillant', 'Cœurvaillant', 'Coeurvaillant', 'Strongheart'],
    description: "Là où les pieds-légers accordent de la valeur aux voyages, les vaillants sont organisés, ordonnés et travailleurs. Ils entretiennent une tradition martiale et n'ont pas peur de montrer leur confiance en leurs forces.",
    regions: "Luiren, dont ils constituent toute la population. Rares ailleurs.",
    remplace: ['Chance halfeline'],
    traits: [
      {
        nom: 'Don supplémentaire au niveau 1',
        description: "Un don de plus au niveau 1, car toute forme de compétition motive les vaillants et qu'ils ont de nombreuses occasions de mettre leurs talents en pratique. À choisir et à saisir comme les autres dons.",
        effet: 'main',
      },
      {
        nom: "Pas de chance halfeline",
        description: "Les vaillants ne bénéficient PAS du bonus racial de +1 à tous les jets de sauvegarde. Ils gardent en revanche le +2 de moral contre la terreur.",
        effet: 'main',
      },
      {
        nom: 'Langues',
        description: "D'office : commun, halfelin, langue de la région natale. Supplémentaires : gnoll, gobelin, halruaan, nain, shaaran.",
        effet: 'info',
      },
    ],
  },
  {
    nom: 'Halfelin sagespectre', race: 'Halfelin', etiquette: 'Sagespectre', source: 'Royaumes Oubliés',
    alias: ['Sagespectre', 'Ghostwise'],
    description: "Halfelins sauvages et quasi barbares des forêts profondes. Étranges et solitaires, ils s'appellent entre eux les hins et ne se sentent pas à l'aise en compagnie d'étrangers.",
    regions: "Bois de Chondal, Bois de Meth, Forêt d'Amtar.",
    classePreferee: 'Barbare',
    remplace: ['Chance halfeline'],
    traits: [
      {
        nom: 'Parler sans faire de bruit (Sur)',
        description: "Communique par télépathie avec toute créature située à 6 mètres ou moins, comme s'il lui adressait la parole. Une seule personne à la fois, et il faut partager une langue commune — sans quoi la communication échoue.",
        effet: 'info',
      },
      {
        nom: 'Pas de chance halfeline',
        description: "Les sagespectres ne bénéficient PAS du bonus racial de +1 à tous les jets de sauvegarde.",
        effet: 'main',
      },
      {
        nom: 'Langues',
        description: "D'office : commun, halfelin, langue de la région natale. Supplémentaires : chondathan, elfe, shaaran, sylvestre.",
        effet: 'info',
      },
    ],
  },
  {
    nom: 'Halfelin grand', race: 'Halfelin', etiquette: 'Grand (tallfellow)', source: 'Manuel des Monstres',
    alias: ['Grand', 'Grands', 'Tallfellow'],
    description: "Assez rares, et plus grands que leurs cousins — certains dépassent 1,20 mètre. Ils parlent souvent l'elfe en plus des langues habituelles des halfelins.",
    remplace: ['Sens aiguisés', "+2 aux tests d'Escalade, Saut et Discrétion"],
    traits: [
      {
        nom: 'Sens affûtés',
        description: "Bonus racial de +2 aux tests de Détection, Fouille et Perception auditive. Comme un elfe, un Grand passant à 1,50 mètre ou moins d'un passage secret a automatiquement droit à un test de Fouille. Remplace le +2 en Perception auditive des pieds-légers.",
        effet: 'main',
      },
      {
        nom: 'Moins athlétiques',
        description: "Les Grands ne bénéficient d'aucun bonus aux tests de Déplacement silencieux, d'Escalade ou de Saut.",
        effet: 'main',
      },
    ],
  },
  {
    nom: 'Halfelin des profondeurs', race: 'Halfelin', etiquette: 'Des profondeurs', source: 'Manuel des Monstres',
    alias: ['Deep halfling'],
    description: "Plus petits et plus trapus que les pieds-légers : environ 75 cm pour 16 kg. Ils vivent sous terre.",
    visionNocturne: true,
    remplace: ["+2 aux tests d'Escalade, Saut et Discrétion"],
    traits: [
      {
        nom: 'Vision dans le noir (18 m)',
        description: "Voit dans l'obscurité totale jusqu'à 18 mètres, en niveaux de gris.",
        effet: 'calcul',
      },
      {
        nom: 'Connaissance de la pierre',
        description: "Comme les nains : +2 à tous les tests de Fouille visant à remarquer que la roche a été travaillée, test automatique à 3 mètres ou moins, détection des pièges intégrés à la roche comme un roublard, et perception constante de la profondeur où il se trouve.",
        effet: 'main',
      },
      {
        nom: 'Artisanat de la pierre et du métal',
        description: "Bonus racial de +2 aux tests d'Artisanat et d'Estimation liés à la pierre ou aux métaux.",
        effet: 'main',
      },
      {
        nom: 'Moins athlétiques',
        description: "Ne bénéficient d'aucun bonus aux tests de Déplacement silencieux, d'Escalade ou de Saut.",
        effet: 'main',
      },
    ],
  },
]

// ─── NAINS ────────────────────────────────────────────────────────────────────
const NAINS: SousRaceInfo[] = [
  {
    nom: 'Nain des collines', race: 'Nain', etiquette: 'Des collines', source: 'Manuel des Monstres',
    alias: ['Hill dwarf'],
    description: "Les nains les plus nombreux, et ceux que décrit le Manuel des Joueurs.",
    traits: [],
  },
  {
    nom: 'Nain des montagnes', race: 'Nain', etiquette: 'Des montagnes', source: 'Manuel des Monstres',
    alias: ['Mountain dwarf'],
    description: "Ils vivent plus profond que les nains des collines, mesurent environ 1,35 mètre et ont la peau et les cheveux plus clairs. Ils prétendent être les premiers nains, ce qui nourrit leur isolationnisme.",
    traits: [
      {
        nom: 'Aucune différence de règles',
        description: "Le Manuel des Monstres ne leur donne AUCUN trait distinct des nains des collines : la différence est de culture et d'apparence. Ils servent en revanche de base aux nains des profondeurs.",
        effet: 'info',
      },
    ],
  },
  {
    nom: 'Nain des profondeurs', race: 'Nain', etiquette: 'Des profondeurs', source: 'Manuel des Monstres',
    alias: ['Deep dwarf'],
    description: "Très distants avec les autres races. Aussi grands que les autres nains mais plus minces, la peau rougeâtre et les yeux bleus ternes. Leurs traits s'ajoutent à ceux des nains des montagnes.",
    traits: [
      {
        nom: 'Sauvegardes renforcées',
        description: "Le bonus racial aux jets de sauvegarde contre les sorts et pouvoirs magiques passe de +2 à +3, et celui contre le poison passe de +2 à +3.",
        effet: 'main',
      },
      {
        nom: 'Vision dans le noir (27 m)',
        description: "Voit dans l'obscurité totale jusqu'à 27 mètres, au lieu de 18.",
        effet: 'info',
      },
      {
        nom: 'Sensibilité à la lumière (Ext)',
        description: "Ébloui en plein jour ou dans la zone d'effet du sort lumière du jour.",
        effet: 'info',
      },
    ],
  },
  {
    nom: 'Duergar', race: 'Nain', etiquette: 'Duergar (nain gris)', source: 'Les deux',
    alias: ['Nain gris', 'Nains gris', 'Gray dwarf'],
    description: "Les nains gris des Profondeurs. Presque tous chauves, vêtus de couleurs ternes, en guerre contre les autres nains et prêts à s'allier aux créatures des Profondeurs pour leur nuire.",
    regions: "L'Outreterre. Leurs forteresses s'y trouvent toutes.",
    ajustements: { cha: -2 },
    ajustementNiveau: 1,
    remplace: ['Familiarité avec les armes naines'],
    traits: [
      {
        nom: 'Charisme de −4',
        description: "L'ajustement de Charisme est de −4 au lieu de −2. Déjà compté dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
      {
        nom: 'Vision dans le noir (36 m)',
        description: "Voit dans l'obscurité totale jusqu'à 36 mètres.",
        effet: 'info',
      },
      {
        nom: 'Immunités',
        description: "Immunisé contre la paralysie, les fantasmes et les poisons. Remplace le bonus racial de +2 aux sauvegardes contre le poison des nains des collines.",
        effet: 'info',
      },
      {
        nom: 'Pouvoirs magiques',
        description: "Agrandissement et invisibilité, 1 fois par jour chacun, niveau de lanceur égal au double des niveaux de classe (3 au minimum). Ces pouvoirs n'affectent que le duergar et ce qu'il porte.",
        effet: 'info',
      },
      {
        nom: 'Sensibilité à la lumière (Ext)',
        description: "Ébloui en plein jour ou dans la zone d'effet du sort lumière du jour.",
        effet: 'info',
      },
      {
        nom: 'Discrétion et vigilance',
        description: "Bonus racial de +4 aux tests de Déplacement silencieux, et de +1 aux tests de Détection et de Perception auditive.",
        effet: 'main',
      },
      {
        nom: 'Pas de familiarité avec les armes naines',
        description: "Contrairement aux autres nains, le duergar n'est PAS familier de la hache de guerre naine ni de l'urgrosh nain.",
        effet: 'info',
      },
      {
        nom: 'Langues',
        description: "D'office : commun, commun des Profondeurs, nain. Supplémentaires : draconien, géant, gobelin, orque, terreux. Remplace les langues habituelles des nains des collines.",
        effet: 'info',
      },
    ],
    divergence: "Ajustement de niveau : le Manuel des Monstres dit +1, le Cadre de campagne des Royaumes Oubliés dit +2. Le Grimoire affiche celui du Manuel des Monstres.",
  },
  {
    nom: "Nain d'écu", race: 'Nain', etiquette: "D'écu", source: 'Royaumes Oubliés',
    alias: ['Shield dwarf'],
    description: "Les nains du Nord de Faerûn, dont les empires s'effondrèrent un à un. Ils se répartissent en « cachés », qui vivent dans le secret, et « nomades », à l'aise avec les autres races et portés sur l'exploration.",
    regions: "Damarie, Impiltur, le Nord, les Marches d'argent, la Vaasie, le Vaste, les Contrées du Mitan occidentales.",
    traits: [
      {
        nom: 'Langues',
        description: "D'office : commun, nain, langue de la région natale. Supplémentaires : chondathan, draconien, géant, gobelin, illuskan, orque. C'est leur seule différence de règles avec le nain du Manuel.",
        effet: 'info',
      },
    ],
  },
  {
    nom: "Nain d'or", race: 'Nain', etiquette: "D'or", source: 'Royaumes Oubliés',
    alias: ['Gold dwarf'],
    description: "Ils n'ont jamais connu de déclin et gardent leur royaume de la Grande faille. Confiants et à l'abri, ils sont réputés fiers et hautains — et généralement de bons guerriers autant que de sages négociants.",
    regions: "La Grande faille, les Montagnes fumantes d'Unther, les Montagnes du pas de géant.",
    ajustements: { con: 2, dex: -2 },
    remplaceAjustements: true,
    traits: [
      {
        nom: 'Ennemis des aberrations',
        description: "Bonus racial de +1 aux jets d'attaque contre les aberrations : les nains d'or se battent face aux créatures étranges de l'Outreterre. Remplace le bonus d'attaque habituel contre les kobolds et les gobelinoïdes.",
        effet: 'main',
      },
      {
        nom: 'Langues',
        description: "D'office : commun, nain, langue de la région natale. Supplémentaires : géant, gnome, gobelin, shaaran, terreux, unthéric.",
        effet: 'info',
      },
    ],
  },
]

// ─── ELFES ────────────────────────────────────────────────────────────────────
const ELFES: SousRaceInfo[] = [
  {
    nom: 'Haut-elfe', race: 'Elfe', etiquette: 'Haut-elfe', source: 'Manuel des Monstres',
    alias: ['High elf', 'Elfe haut'],
    description: "Les elfes les plus courants, et ceux que décrit le Manuel des Joueurs. Toutes les autres races d'elfes se décrivent par rapport à eux.",
    traits: [],
  },
  {
    nom: 'Elfe gris', race: 'Elfe', etiquette: 'Gris', source: 'Manuel des Monstres',
    alias: ['Gray elf', 'Grey elf'],
    description: "Un peu plus grands que la moyenne de leur race, réputés distants et arrogants même envers les autres elfes. Cheveux argentés et yeux ambrés, ou cheveux d'or clair et yeux violets.",
    ajustements: { int: 2, for: -2 },
    traits: [
      {
        nom: 'Esprit avant le corps',
        description: "+2 en Intelligence et −2 en Force, qui s'AJOUTENT aux ajustements du haut-elfe. Déjà comptés dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
    ],
  },
  {
    nom: 'Elfe des bois', race: 'Elfe', etiquette: 'Des bois', source: 'Les deux',
    alias: ['Wood elf', 'Elfe sylvestre'],
    description: "Cheveux blonds ou cuivrés, plus musclés que les autres elfes, vêtus de verts et de bruns pour se fondre dans leur habitat.",
    regions: "La Haute-Forêt, les forêts des Vaux, le Cormanthor, le Grand-Val, le Nord, Téthyr.",
    ajustements: { for: 2, int: -2 },
    classePreferee: 'Rôdeur',
    traits: [
      {
        nom: 'Forts mais frustes',
        description: "+2 en Force et −2 en Intelligence, qui s'AJOUTENT aux ajustements du haut-elfe. Déjà comptés dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
      {
        nom: 'Classe de prédilection : rôdeur',
        description: "Remplace le magicien du haut-elfe. Le Grimoire s'en sert pour la pénalité d'expérience du multiclassage.",
        effet: 'calcul',
      },
    ],
    divergence: "Le Cadre de campagne des Royaumes Oubliés leur donne EN PLUS −2 en Charisme (« +2 Force, +2 Dextérité, −2 Constitution, −2 Intelligence et −2 Charisme »). Le Grimoire applique le Manuel des Monstres, sans le −2 en Charisme.",
  },
  {
    nom: 'Elfe sauvage', race: 'Elfe', etiquette: 'Sauvage', source: 'Les deux',
    alias: ['Wild elf', 'Elfe des fées', 'Elfe de cuivre'],
    description: "Un système tribal moins avancé que les autres elfes. Cheveux du noir au châtain clair, mèches argentées avec l'âge, vêtements de peaux et de feuilles. Plus robustes que les autres elfes, ils préfèrent l'action à la résolution de problèmes.",
    regions: "Le Bois de Chondal, le Bois de Meth, la Forêt d'Amtar, le Val Brumeux, Chessenta, Chult, le Shaar.",
    ajustements: { dex: 2, int: -2 },
    remplaceAjustements: true,
    classePreferee: 'Ensorceleur',
    traits: [
      {
        nom: 'Vifs et instinctifs',
        description: "+2 en Dextérité et −2 en Intelligence. ⚠ Ces ajustements REMPLACENT ceux du haut-elfe : l'elfe sauvage n'a donc pas de −2 en Constitution. Déjà comptés dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
      {
        nom: 'Classe de prédilection : ensorceleur',
        description: "Remplace le magicien du haut-elfe. Le Grimoire s'en sert pour la pénalité d'expérience du multiclassage.",
        effet: 'calcul',
      },
    ],
  },
  {
    nom: 'Elfe aquatique', race: 'Elfe', etiquette: 'Aquatique (des mers)', source: 'Les deux',
    alias: ['Elfe des mers', 'Aquatic elf', 'Sea elf'],
    description: "Les cousins marins des elfes terrestres. Ils combattent sous l'eau à la lance, au trident et au filet.",
    ajustements: { dex: 2, int: -2 },
    remplaceAjustements: true,
    classePreferee: 'Guerrier',
    traits: [
      {
        nom: 'Taillés pour l\'eau',
        description: "+2 en Dextérité et −2 en Intelligence. ⚠ Ces ajustements REMPLACENT ceux du haut-elfe. Déjà comptés dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
      {
        nom: 'Sous-type aquatique',
        description: "L'elfe aquatique appartient au sous-type aquatique. Sa vitesse de nage est de 12 mètres.",
        effet: 'info',
      },
      {
        nom: 'Branchies',
        description: "Survit hors de l'eau 1 heure par point de Constitution. Au-delà, les règles de l'asphyxie s'appliquent.",
        effet: 'info',
      },
      {
        nom: 'Vision nocturne exceptionnelle',
        description: "Voit quatre fois plus loin qu'un humain en faible luminosité, et non deux. Remplace la vision nocturne du haut-elfe.",
        effet: 'info',
      },
      {
        nom: 'Classe de prédilection : guerrier',
        description: "Remplace le magicien du haut-elfe. Le Grimoire s'en sert pour la pénalité d'expérience du multiclassage.",
        effet: 'calcul',
      },
    ],
  },
  {
    nom: 'Drow', race: 'Elfe', etiquette: 'Drow (elfe noir)', source: 'Les deux',
    alias: ['Elfe noir', 'Elfes noirs', 'Dark elf'],
    description: "Descendants des elfes à la peau noire connus sous le nom d'Ilythiiri, maudits et contraints par les dieux elfes d'adopter leur apparence actuelle pour avoir emprunté la voie maléfique de Lolth. Peau noire, cheveux blancs ou jaune pâle, yeux très clairs.",
    regions: "L'Outreterre. Menzoberranzan, la cité natale de Drizzt Do'Urden, est le plus connu des royaumes drows.",
    ajustements: { int: 2, cha: 2 },
    visionNocturne: true,
    classePreferee: 'Magicien',
    ajustementNiveau: 2,
    remplace: ['Vision nocturne'],
    traits: [
      {
        nom: 'Vive intelligence, forte personnalité',
        description: "+2 en Intelligence et +2 en Charisme, qui s'AJOUTENT aux ajustements du haut-elfe. Déjà comptés dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
      {
        nom: 'Vision dans le noir (36 m)',
        description: "Voit dans l'obscurité totale jusqu'à 36 mètres. Remplace la vision nocturne du haut-elfe.",
        effet: 'calcul',
      },
      {
        nom: 'Résistance à la magie',
        description: "Résistance à la magie égale à 11 + niveaux de classe.",
        effet: 'main',
      },
      {
        nom: 'Volonté affermie',
        description: "Bonus racial de +2 aux jets de Volonté contre les sorts et les pouvoirs magiques.",
        effet: 'main',
      },
      {
        nom: 'Pouvoirs magiques',
        description: "Lueur féerique, lumières dansantes et ténèbres, 1 fois par jour chacun. Niveau de lanceur égal aux niveaux de classe.",
        effet: 'info',
      },
      {
        nom: 'Armes drows',
        description: "Formation automatique au maniement de l'arbalète de poing, de la rapière et de l'épée courte.",
        effet: 'info',
      },
      {
        nom: 'Vulnérabilité à la lumière (Ext)',
        description: "Une exposition brutale à une vive lumière (soleil, lumière du jour) l'aveugle 1 round. Ensuite, il reste ébloui tant qu'il est dans la zone illuminée.",
        effet: 'info',
      },
      {
        nom: 'Classe de prédilection : magicien (hommes) ou prêtre (femmes)',
        description: "Remplace celle du haut-elfe. ⚠ Le Grimoire retient magicien pour la pénalité d'expérience : règle-le à prêtre toi-même pour une drow.",
        effet: 'calcul',
      },
      {
        nom: 'Langues',
        description: "D'office : commun, commun des Profondeurs, elfe. Supplémentaires : abyssal, aquatique, draconien, gnome, gobelin, kuo-toa, langue des signes drow.",
        effet: 'info',
      },
    ],
  },
  {
    nom: 'Elfe de la lune', race: 'Elfe', etiquette: 'De la lune', source: 'Royaumes Oubliés',
    alias: ["Elfe d'argent", 'Moon elf', 'Teu-tel-quessir'],
    description: "L'espèce d'elfes la plus tolérante envers l'humanité, et celle dont descendent la plupart des demi-elfes. Peau blanche parfois teintée de bleu, cheveux blanc argenté, noirs ou bleus, yeux bleus ou verts mouchetés d'or.",
    regions: "Les Vaux, le Cormanthor, Éternelle-rencontre, la Haute-Forêt, le Nord, Lunargent, Evereska.",
    traits: [
      {
        nom: 'Langues',
        description: "D'office : commun, elfe, langue de la région natale. Supplémentaires : aérien, chondathan, gnoll, gnome, halfelin, illuskan, sylvestre. C'est leur seule différence de règles avec l'elfe du Manuel.",
        effet: 'info',
      },
    ],
  },
  {
    nom: 'Elfe du soleil', race: 'Elfe', etiquette: 'Du soleil', source: 'Royaumes Oubliés',
    alias: ["Elfe d'or", 'Sun elf', 'Ar-tel-quessir'],
    description: "Les plus rares et les plus altiers. Peau couleur bronze, cheveux blond doré, cuivrés ou noirs, yeux verts ou dorés. Ils accordent plus de valeur à l'étude et à la contemplation qu'aux exploits d'agilité.",
    regions: "Éternelle-rencontre surtout, puis les bois du Nord, Lunargent, les Contrées du Mitan occidentales.",
    ajustements: { int: 2, con: -2 },
    remplaceAjustements: true,
    traits: [
      {
        nom: "L'étude avant l'agilité",
        description: "+2 en Intelligence et −2 en Constitution. ⚠ Ces ajustements REMPLACENT ceux de l'elfe du Manuel : l'elfe du soleil n'a donc pas de +2 en Dextérité. Déjà comptés dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
      {
        nom: 'Langues',
        description: "D'office : commun, elfe, langue de la région natale. Supplémentaires : aérien, céleste, chondathan, gnome, halfelin, illuskan, sylvestre.",
        effet: 'info',
      },
    ],
  },
]

// ─── GNOMES ───────────────────────────────────────────────────────────────────
const GNOMES: SousRaceInfo[] = [
  {
    nom: 'Gnome des roches', race: 'Gnome', etiquette: 'Des roches', source: 'Les deux',
    alias: ['Rock gnome'],
    description: "Les gnomes les plus nombreux, et ceux que décrit le Manuel des Joueurs. Curieux, tenaces et parfois peu sincères, ils excellent dans les artisanats de précision : taille de gemmes, jouets, ingénierie mécanique. Les meilleurs armuriers de Faerûn.",
    regions: "L'île quasi mythique du Lantan, et des communautés d'une douzaine de familles un peu partout.",
    traits: [],
  },
  {
    nom: 'Gnome des forêts', race: 'Gnome', etiquette: 'Des forêts', source: 'Manuel des Monstres',
    alias: ['Forest gnome'],
    description: "Plus petits que les autres gnomes — entre 60 et 75 cm —, la peau gris-vert ou couleur d'écorce, les cheveux sombres. Ils vivent environ 500 ans.",
    traits: [
      {
        nom: 'Passage sans trace (Sur)',
        description: "Se déplace en forêt sans laisser de traces, comme le sort passage sans trace (sur lui seul, par une action libre, niveau de lanceur égal aux niveaux de classe).",
        effet: 'info',
      },
      {
        nom: 'Ennemis héréditaires',
        description: "Bonus racial de +1 aux jets d'attaque contre les kobolds, les gobelinoïdes, les orques et les humanoïdes reptiliens.",
        effet: 'main',
      },
      {
        nom: 'Discrétion sylvestre',
        description: "Bonus racial de +4 aux tests de Discrétion, qui passe à +8 en région boisée.",
        effet: 'main',
      },
      {
        nom: 'Langues',
        description: "D'office : gnome, elfe, sylvestre, et un langage simpliste permettant quelques concepts de base aux animaux de la forêt (remplace le pouvoir de communication avec les animaux du gnome des roches). Supplémentaires : commun, draconien, elfe, géant, gobelin, nain, orque.",
        effet: 'info',
      },
    ],
  },
  {
    nom: 'Svirfnebelin', race: 'Gnome', etiquette: 'Svirfnebelin (des profondeurs)', source: 'Les deux',
    alias: ['Gnome des profondeurs', 'Svirfneblin', 'Deep gnome'],
    description: "Les gnomes des profondeurs : solitaires, méfiants, sans goût pour l'humour ni pour l'ouverture d'esprit de leurs cousins de la surface. Le peuple le plus discret et le plus fuyant qui soit.",
    regions: "L'Outreterre, très loin de la surface. Blingdenpierre, et des exilés dans les Marches d'argent.",
    ajustements: { for: -2, dex: 2, sag: 2, cha: -4 },
    remplaceAjustements: true,
    classePreferee: 'Roublard',
    ajustementNiveau: 3,
    remplace: ['+2 aux jets de sauvegarde contre les illusions', 'Esquive contre les géants', 'Sorts mineurs de gnome'],
    traits: [
      {
        nom: 'Méfiants et attentifs',
        description: "−2 en Force, +2 en Dextérité, +2 en Sagesse, −4 en Charisme. ⚠ Ces ajustements REMPLACENT ceux du gnome des roches. Déjà comptés dans les caractéristiques de la fiche.",
        effet: 'calcul',
      },
      {
        nom: 'Vision dans le noir (36 m)',
        description: "Voit dans l'obscurité totale jusqu'à 36 mètres, et garde la vision nocturne.",
        effet: 'calcul',
      },
      {
        nom: 'Connaissance de la pierre',
        description: "+2 à tous les tests de Fouille visant à remarquer que la roche a été travaillée, test automatique à 3 mètres, détection des pièges intégrés à la roche comme un roublard, perception constante de la profondeur.",
        effet: 'main',
      },
      {
        nom: 'Résistance à la magie',
        description: "Résistance à la magie égale à 11 + niveaux de classe.",
        effet: 'main',
      },
      {
        nom: 'Sauvegardes renforcées',
        description: "Bonus racial de +2 à TOUS les jets de sauvegarde. Remplace le bonus du gnome des roches contre les illusions.",
        effet: 'main',
      },
      {
        nom: "Bonus d'esquive de +4",
        description: "Bonus d'esquive de +4 à la classe d'armure contre toutes les créatures. Remplace le bonus d'esquive du gnome des roches contre les géants.",
        effet: 'main',
      },
      {
        nom: 'Antidétection (Sur)',
        description: "Protégé en permanence par l'équivalent du sort antidétection, niveau de lanceur égal aux niveaux de classe.",
        effet: 'info',
      },
      {
        nom: 'Pouvoirs magiques',
        description: "Cécité/surdité (DD 13 en général), déguisement et flou, 1 fois par jour chacun. DD liés au Charisme, avec un bonus racial de +4. Remplace les pouvoirs du gnome des roches.",
        effet: 'info',
      },
      {
        nom: 'Discrétion souterraine',
        description: "Bonus racial de +2 aux tests de Discrétion, qui passe à +4 sous terre.",
        effet: 'main',
      },
      {
        nom: 'Langues',
        description: "D'office : commun, commun des Profondeurs, gnome. Supplémentaires : draconien, elfe, géant, gobelin, nain, orque, terreux.",
        effet: 'info',
      },
    ],
    divergence: "Le Cadre de campagne des Royaumes Oubliés donne des pouvoirs magiques un peu différents (cécité, changement d'apparence et flou, plus lumières dansantes, son imaginaire et prestidigitation). Le Grimoire applique le Manuel des Monstres.",
  },
]

export const SOUS_RACES_DND35: SousRaceInfo[] = [...HALFELINS, ...NAINS, ...ELFES, ...GNOMES]

/**
 * Les sous-races d'une race donnée, dans l'ordre du module.
 * ⚠ Le nom passé peut être un ALIAS de la race : les 3 fiches « Petite-gens »
 * d'André doivent se voir proposer les sous-races d'« Halfelin », sans quoi le
 * menu reste vide sur une fiche parfaitement valide.
 */
export function sousRacesDe(race: string | null | undefined): SousRaceInfo[] {
  if (!race) return []
  const canonique = getRaceInfo(race)?.nom ?? getSousRaceInfo(race)?.race ?? race
  return SOUS_RACES_DND35.filter(s => s.race === canonique)
}

const normalise = (s: string) => s.trim().toLowerCase()

// ─── LES DEUX APPELLATIONS D'UNE MÊME RACE ────────────────────────────────────
//
// ⚠ Décision d'André, 2026-11-12 : « On garde Petite-gens et Halfelin...
// Plusieurs joueurs préfèrent le nom anglais! Tant que tout fonctionne avec les
// deux! » — donc pas de fusion, mais une ÉQUIVALENCE qui traverse toute la
// chaîne : menus, ajustements, traits raciaux, générateur de noms, papier.
//
// Le mécanisme ne connaît aucun nom en dur : il lit `RACES_DND35[].alias`. Le
// jour où une autre race prend un second nom de table, elle marche du même coup.

/**
 * Toutes les appellations d'une race : son nom du Manuel d'abord, puis les noms
 * de table. Un nom inconnu ressort seul — on n'invente pas de synonyme.
 */
export function appellationsDe(race: string | null | undefined): string[] {
  if (!race) return []
  const base = getRaceInfo(race)
  return base ? [base.nom, ...(base.alias ?? [])] : [race]
}

const commencePar = (nom: string, prefixe: string) => normalise(nom).startsWith(normalise(prefixe))

/**
 * Le nom à ENREGISTRER pour une sous-race, sous l'appellation que la fiche porte
 * déjà : « Petite-gens » + le vaillant donne « Petite-gens vaillant », et la
 * fiche de Daniel ne devient pas un halfelin dans son dos.
 *
 * ⛔ Une sous-race dont le nom ne reprend PAS celui de la race parente — le
 * drow, le duergar, le svirfnebelin, le haut-elfe — n'est jamais réécrite :
 * « Elfe noir drow » n'existe dans aucun livre. Et une appellation inconnue ne
 * compose rien : mieux vaut le nom canonique qu'un nom inventé.
 */
export function nomSousRaceSelon(appellation: string | null | undefined, sousRace: SousRaceInfo): string {
  if (!appellation) return sousRace.nom
  const app = appellation.trim()
  const base = RACES_DND35.find(r => r.nom === sousRace.race)
  if (!base || !appellationsDe(base.nom).some(a => normalise(a) === normalise(app))) return sousRace.nom
  if (!commencePar(sousRace.nom, base.nom)) return sousRace.nom
  return app + sousRace.nom.slice(base.nom.length)
}

/**
 * Ce que devient la race d'une fiche quand on change le menu Race.
 *
 * ⭐ Changer l'APPELLATION ne change pas la race : passer de « Petite-gens » à
 * « Halfelin » garde la sous-race choisie et la réécrit (« Halfelin
 * sagespectre »). Changer de RACE, en revanche, l'abandonne — un sagespectre
 * elfe n'existe pas.
 */
export function changerRace(nouvelleRace: string, sousRaceCourante: string | null | undefined): string {
  const sr = getSousRaceInfo(sousRaceCourante)
  if (!sr) return nouvelleRace
  if (getRaceInfo(nouvelleRace)?.nom !== sr.race) return nouvelleRace
  return nomSousRaceSelon(nouvelleRace, sr)
}

/** Les noms sous lesquels une sous-race peut être écrite, appellations comprises. */
function variantesDe(sousRace: SousRaceInfo): string[] {
  const noms = [sousRace.nom, ...(sousRace.alias ?? [])]
  for (const app of appellationsDe(sousRace.race)) {
    const compose = nomSousRaceSelon(app, sousRace)
    if (!noms.some(n => normalise(n) === normalise(compose))) noms.push(compose)
  }
  return noms
}

/**
 * L'appellation de la race parente que ce nom porte réellement : « Petite-gens
 * vaillant » dit Petite-gens, « cœurvaillant » ne dit rien et retombe sur le
 * nom du Manuel.
 */
function appellationPortee(nom: string, sousRace: SousRaceInfo): string {
  const candidates = appellationsDe(sousRace.race)
  return candidates.find(a => commencePar(nom.trim(), a)) ?? sousRace.race
}

/**
 * Retrouve une sous-race par son nom complet, l'un de ses alias, ou le même nom
 * écrit sous l'autre appellation de sa race (« Petite-gens vaillant »).
 */
export function getSousRaceInfo(nom: string | null | undefined): SousRaceInfo | undefined {
  if (!nom) return undefined
  const n = normalise(nom)
  return SOUS_RACES_DND35.find(s => normalise(s.nom) === n)
    ?? SOUS_RACES_DND35.find(s => s.alias?.some(a => normalise(a) === n))
    ?? SOUS_RACES_DND35.find(s => variantesDe(s).some(v => normalise(v) === n))
}

/**
 * Sépare « Halfelin vaillant » en { race: 'Halfelin', sousRace: 'Halfelin vaillant' }.
 * Un nom qui n'est pas une sous-race connue ressort tel quel, sous-race nulle —
 * c'est le cas de toutes les fiches existantes, et c'est ce qui garantit qu'elles
 * ne bougent pas.
 *
 * ⭐ L'appellation portée est RENDUE TELLE QUELLE : « Petite-gens vaillant »
 * donne { race: 'Petite-gens', … }, pour que le menu Race affiche le nom que le
 * joueur a choisi. ⚠ Les tables indexées par race du Manuel (noms, langues)
 * doivent donc canoniser par `getRaceInfo()` avant de s'en servir.
 */
export function decomposerRace(nom: string | null | undefined): { race: string; sousRace: string | null } {
  const sr = getSousRaceInfo(nom)
  if (!sr) return { race: nom ?? '', sousRace: null }
  const app = appellationPortee(nom ?? '', sr)
  return { race: app, sousRace: nomSousRaceSelon(app, sr) }
}

/**
 * Le profil effectif d'une sous-race : la race parente, modifiée par ce que le
 * livre change. ⭐ C'est la SEULE fonction qui fusionne — la feuille imprimée la
 * lit par `getRaceInfo()`, et le script de peuplement écrit son résultat dans
 * `races`. Deux lecteurs, une source.
 */
export function fusionner(sousRace: SousRaceInfo): RaceInfo | undefined {
  const base = RACES_DND35.find(r => r.nom === sousRace.race)
  if (!base) return undefined
  const a = sousRace.ajustements ?? {}
  const depart = sousRace.remplaceAjustements
    ? { for: 0, dex: 0, con: 0, int: 0, sag: 0, cha: 0 }
    : { for: base.bonusFor, dex: base.bonusDex, con: base.bonusCon, int: base.bonusInt, sag: base.bonusSag, cha: base.bonusCha }
  return {
    nom: sousRace.nom,
    bonusFor: depart.for + (a.for ?? 0),
    bonusDex: depart.dex + (a.dex ?? 0),
    bonusCon: depart.con + (a.con ?? 0),
    bonusInt: depart.int + (a.int ?? 0),
    bonusSag: depart.sag + (a.sag ?? 0),
    bonusCha: depart.cha + (a.cha ?? 0),
    deplacement: sousRace.deplacement ?? base.deplacement,
    visionNocturne: sousRace.visionNocturne ?? base.visionNocturne,
    classePreferee: sousRace.classePreferee ?? base.classePreferee,
    alias: sousRace.alias,
  }
}

/** Le profil fusionné d'un nom de sous-race, ou undefined si ce n'en est pas une. */
export function getRaceInfoSousRace(nom: string | null | undefined): RaceInfo | undefined {
  const sr = getSousRaceInfo(nom)
  return sr ? fusionner(sr) : undefined
}

/** Le pictogramme du vocabulaire des dons, pour que la fiche parle la même langue. */
export function picto(effet: EffetTrait): string {
  return effet === 'calcul' ? '⚙' : effet === 'main' ? '✋' : 'ℹ'
}

export function libelleEffet(effet: EffetTrait): string {
  return effet === 'calcul' ? 'déjà dans le total'
    : effet === 'main' ? 'à appliquer à la main'
    : 'pour information'
}

/**
 * ⭐ LE POINT D'ENTRÉE UNIQUE — à préférer partout à `getRaceInfo` seul.
 *
 * Rend le profil d'un nom qu'il désigne une race du Manuel ou une sous-race.
 * ⚠ C'est la fonction qui empêche la feuille imprimée de perdre les ajustements
 * d'un drow : elle lit `getRaceInfo(nom)`, qui ne connaît que les 7 races.
 */
export function getRaceOuSousRace(nom: string | null | undefined): RaceInfo | undefined {
  if (!nom) return undefined
  return getRaceInfo(nom) ?? getRaceInfoSousRace(nom)
}

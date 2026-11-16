import { pgTable, serial, varchar, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core'
import { races, classes, clans, gods } from './references'
import { creatures } from './creatures'
import { spells } from './spells'

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 200 }).notNull(),
  surnom: varchar('surnom', { length: 200 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  raceId: integer('race_id').references(() => races.id),
  sexe: varchar('sexe', { length: 20 }),
  taille: varchar('taille', { length: 20 }),
  poids: integer('poids'),
  yeux: varchar('yeux', { length: 50 }),
  cheveux: varchar('cheveux', { length: 50 }),
  age: integer('age'),
  alignement: varchar('alignement', { length: 50 }),
  dieuId: integer('dieu_id').references(() => gods.id),
  clanId: integer('clan_id').references(() => clans.id),
  xp: integer('xp').default(0),
  historique: text('historique'),
  notes: text('notes'),
  joueurPrenom: varchar('joueur_prenom', { length: 100 }),
  joueurNom: varchar('joueur_nom', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const characterClasses = pgTable('character_classes', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  classeId: integer('classe_id').notNull().references(() => classes.id),
  niveau: integer('niveau').notNull().default(1),
})

export const characterAbilityScores = pgTable('character_ability_scores', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  forBase: integer('for_base').default(10),
  forMagique: integer('for_magique').default(0),
  dexBase: integer('dex_base').default(10),
  dexMagique: integer('dex_magique').default(0),
  conBase: integer('con_base').default(10),
  conMagique: integer('con_magique').default(0),
  intBase: integer('int_base').default(10),
  intMagique: integer('int_magique').default(0),
  sagBase: integer('sag_base').default(10),
  sagMagique: integer('sag_magique').default(0),
  chaBase: integer('cha_base').default(10),
  chaMagique: integer('cha_magique').default(0),
})

export const characterCombatStats = pgTable('character_combat_stats', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  pvMax: integer('pv_max').default(0),
  pvActuels: integer('pv_actuels').default(0),
  caBase: integer('ca_base').default(10),
  caArme: integer('ca_arme').default(0),
  caBouclier: integer('ca_bouclier').default(0),
  caNaturelle: integer('ca_naturelle').default(0),
  caDeflexion: integer('ca_deflexion').default(0),
  caDivers: integer('ca_divers').default(0),
  deplacement: integer('deplacement').default(9),
  karma: integer('karma').default(0),
  initiativeBonus: integer('initiative_bonus').default(0),
  bbaCorpsACorps: integer('bba_corps_a_corps').default(0),
  bbaProjectiles: integer('bba_projectiles').default(0),
  domaine1: varchar('domaine1', { length: 100 }),
  domaine2: varchar('domaine2', { length: 100 }),
})

export const characterSavingThrows = pgTable('character_saving_throws', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  reflexesBase: integer('reflexes_base').default(0),
  reflexesMagique: integer('reflexes_magique').default(0),
  vigueurBase: integer('vigueur_base').default(0),
  vigueurMagique: integer('vigueur_magique').default(0),
  volonteBase: integer('volonte_base').default(0),
  volonteMagique: integer('volonte_magique').default(0),
})

export const characterSkills = pgTable('character_skills', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  skillId: integer('skill_id').notNull(),
  rangsInvestis: integer('rangs_investis').default(0),
  modifDivers: integer('modif_divers').default(0),
})

export const characterFeats = pgTable('character_feats', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  featId: integer('feat_id').notNull(),
  notes: text('notes'),
})

export const characterWeapons = pgTable('character_weapons', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  armeId: integer('arme_id').notNull(),
  bonusMagique: integer('bonus_magique').default(0),
  coteDeForce: integer('cote_de_force'),
  /** Bonus d'ALTÉRATION des munitions : flèches +1, carreaux +2. Jamais plus de +5. */
  bonusMunitions: integer('bonus_munitions'),
  /** Combien de projectiles au carquois. NULL = non suivi, 0 = épuisé. Voir drizzle/0015. */
  quantiteMunitions: integer('quantite_munitions'),
  /**
   * Attaque en finesse : la caractéristique choisie pour le JET D'ATTAQUE de
   * cette ligne. NULL = automatique (le meilleur des deux), 'for' ou 'dex' =
   * choix explicite du joueur, qui l'emporte même s'il est moins bon. Ignorée
   * à distance et sur une arme non éligible. Voir drizzle/0016.
   */
  caracAttaque: text('carac_attaque'),
  proprietesSpeciales: text('proprietes_speciales'),
  quantite: integer('quantite').default(1),
})

export const characterArmor = pgTable('character_armor', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  armureId: integer('armure_id').notNull(),
  bonusMagique: integer('bonus_magique').default(0),
  estPortee: integer('est_portee').default(1),
})

export const characterMagicItems = pgTable('character_magic_items', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  objetId: integer('objet_id').notNull(),
  emplacement: varchar('emplacement', { length: 100 }),
  notes: text('notes'),
  chargesRestantes: integer('charges_restantes'),
})

export const characterPotions = pgTable('character_potions', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  potionId: integer('potion_id').notNull(),
  chargesRestantes: integer('charges_restantes').default(1),
  notes: text('notes'),
})

// Parchemins. ⛔ Volontairement SANS table catalogue, contrairement aux potions :
// le catalogue d'un parchemin, c'est la fiche du sort qu'il porte. Recopier la
// portée ou la durée ici les laisserait diverger de `spells`. Voir drizzle/0013.
export const characterScrolls = pgTable('character_scrolls', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  /** Le lien vers la Bibliothèque. NULL quand le sort n'est pas au catalogue. */
  sortId: integer('sort_id').references(() => spells.id),
  /** Secours, et seulement ça : rempli uniquement quand `sortId` est NULL. */
  nomLibre: varchar('nom_libre', { length: 200 }),
  /** Niveau du sort tel qu'inscrit — il fixe le DD du test de niveau de lanceur. */
  niveauSort: integer('niveau_sort'),
  /** NLS du parchemin : il fixe portée, durée et dégâts, pas le niveau du lecteur. */
  niveauLanceur: integer('niveau_lanceur'),
  /** 'profane' | 'divin' — qui peut le lire sans Utilisation d'objets magiques. */
  type: varchar('type', { length: 10 }),
  /** 0 = lu. La ligne reste pour mémoire; le ✕ la retire. */
  quantite: integer('quantite').notNull().default(1),
  notes: text('notes'),
})

export const characterCurrency = pgTable('character_currency', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  pp: numeric('pp', { precision: 10, scale: 2 }).default('0'),
  po: numeric('po', { precision: 10, scale: 2 }).default('0'),
  pe: numeric('pe', { precision: 10, scale: 2 }).default('0'),
  pa: numeric('pa', { precision: 10, scale: 2 }).default('0'),
  pc: numeric('pc', { precision: 10, scale: 2 }).default('0'),
  pm: numeric('pm', { precision: 10, scale: 2 }).default('0'),
})

// Gemmes du trésor. Volontairement SANS lien vers la table catalogue `gems` :
// la valeur d'une gemme appartient au trésor d'un personnage précis (un rubis
// vaut 50 po chez l'un, 500 po chez l'autre). Passer par le catalogue obligerait
// à muter `gems.valeurBase` comme le code le fait déjà pour `magic_items`, ce
// qui écraserait la gemme homonyme des autres personnages.
export const characterGems = pgTable('character_gems', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  nom: varchar('nom', { length: 200 }).notNull(),
  quantite: integer('quantite').default(1),
  valeur: numeric('valeur', { precision: 12, scale: 2 }).default('0'),
  // Unité monétaire de la valeur : pp | po | pe | pa | pc | pm
  unite: varchar('unite', { length: 4 }).default('po'),
  notes: text('notes'),
})

// Équipement courant — la corde, le miroir, les outils de voleur, les rations.
// Volontairement SANS lien vers la table catalogue `equipment`, qui existe depuis
// le premier schéma et contient 0 ligne : ici c'est le NOM qui appartient au
// joueur (« corde de chanvre, 15 m », « rations pour 4 jours »), et passer par un
// catalogue obligerait à muter une ligne partagée au nom du personnage qui
// enregistre. Même raisonnement que `character_gems`. Voir drizzle/0017.
export const characterEquipment = pgTable('character_equipment', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  nom: varchar('nom', { length: 200 }).notNull(),
  quantite: integer('quantite').default(1),
  /** La colonne « Localisation » de la feuille imprimée : sac à dos, ceinture, botte. */
  emplacement: varchar('emplacement', { length: 100 }),
  /** Prix À LA PIÈCE. NULL = non chiffré, là où 0 dirait « gratuit ». */
  valeur: numeric('valeur', { precision: 10, scale: 2 }),
  // Unité monétaire de la valeur : pp | po | pe | pa | pc | pm
  unite: varchar('unite', { length: 4 }).default('po'),
  /** Poids À LA PIÈCE, en KILOGRAMMES — l'unité du catalogue d'armes et du papier. */
  poids: numeric('poids', { precision: 6, scale: 2 }),
  notes: text('notes'),
})

export const characterLanguages = pgTable('character_languages', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  langueId: integer('langue_id').notNull(),
})

export const characterSpells = pgTable('character_spells', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  sortId: integer('sort_id').notNull(),
  niveau: integer('niveau'),
  estPrepare: integer('est_prepare').default(0),
  estConnu: integer('est_connu').default(1),
  // Classe lanceuse du sort (multi-classes) — null = classe lanceuse unique du personnage
  classe: varchar('classe', { length: 50 }),
})

// Effets de sorts actifs (CA ou caractéristique) — activés au lancement du sort,
// retirés manuellement par le joueur (le temps de jeu ≠ temps réel, pas d'expiration)
export const characterSpellEffects = pgTable('character_spell_effects', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  nom: varchar('nom', { length: 200 }).notNull(),
  cible: varchar('cible', { length: 10 }).notNull().default('CA'), // CA | FOR | DEX | CON | INT | SAG | CHA
  typeBonus: varchar('type_bonus', { length: 50 }).notNull().default('divers'),
  valeur: integer('valeur').notNull().default(0),
})

export const characterCreatures = pgTable('character_creatures', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  creatureId: integer('creature_id').references(() => creatures.id),
  nomPersonnalise: varchar('nom_personnalise', { length: 200 }),
  role: varchar('role', { length: 50 }),
})

export const characterCompanions = pgTable('character_companions', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  nom: varchar('nom', { length: 200 }).notNull(),
  race: varchar('race', { length: 100 }),
  classe: varchar('classe', { length: 100 }),
  joueur: varchar('joueur', { length: 200 }),
  notes: text('notes'),
})

export const characterNotes = pgTable('character_notes', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  titre: varchar('titre', { length: 200 }),
  contenu: text('contenu').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Journal de partie — chaque action de jeu (PV, sort, potion, attaque…) y laisse une trace,
// écrite automatiquement par les actions serveur. personnageId null = marqueur global de
// table (rounds de combat), visible sur toutes les fiches et dans le journal du MJ.
export const characterJournal = pgTable('character_journal', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').references(() => characters.id),
  type: varchar('type', { length: 20 }).notNull(), // pv | sort | potion | parchemin | charge | effet | attaque | repos | round | note
  description: text('description').notNull(),
  valeur: integer('valeur'), // delta PV, numéro de round…
  // Qui a posé cette entrée, quand c'est le MJ : note du MJ, ordre d'initiative,
  // round, bilan, photo de la map, distribution d'XP. NULL pour tout ce qui vient
  // d'une fiche de personnage (le joueur est déjà désigné par personnageId) et pour
  // les entrées écrites avant le 2026-11-09, où aucun MJ ne s'identifiait.
  mj: varchar('mj', { length: 60 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── L'histoire du personnage, en chapitres ──────────────────────────────────
// Demandée par André le 2026-11-15 : « une section pour l'histoire des
// personnages, différente de leur fiche », atteinte par un lien depuis la fiche
// et écrite par le joueur.
//
// ⛔ Distincte de `characters.historique`, qui reste le RÉSUMÉ court lu sur la
// fiche : ce champ-là est un textarea de 6 lignes dans l'onglet « Notes » du
// formulaire, et l'histoire d'Azadrielle fait 20 000 caractères.
// ⛔ Distincte aussi de `characterJournal` : le journal est la chronique
// horodatée de ce qui se JOUE, l'histoire est le récit du joueur, réécrit à
// volonté.
//
// Des chapitres plutôt qu'un seul grand texte parce qu'une histoire s'allonge à
// chaque séance : on ajoute « Ce qui s'est passé à Eauprofonde » sans relire ni
// risquer le reste. Un chapitre unique reste parfaitement possible.
// Voir drizzle/0018 pour le détail de chaque colonne.
export const characterStoryChapters = pgTable('character_story_chapters', {
  id: serial('id').primaryKey(),
  personnageId: integer('personnage_id').notNull().references(() => characters.id),
  /** Dresse le sommaire de la page — un chapitre sans titre ne se navigue pas. */
  titre: varchar('titre', { length: 200 }).notNull(),
  /** La prose, telle que tapée. La mise en forme légère est interprétée à l'AFFICHAGE. */
  contenu: text('contenu').notNull().default(''),
  /** Rang d'affichage, 0 d'abord. Réordonné par échange de deux rangs voisins. */
  ordre: integer('ordre').notNull().default(0),
  /**
   * Qui a écrit, retenu sur l'appareil (clé `cormac.joueur`), comme l'identité du MJ.
   * ⚠ NULL est permis et fréquent : le Grimoire n'a qu'un mot de passe partagé et ne
   * SAIT pas qui écrit. Un nom inventé serait pire que pas de nom.
   */
  signature: varchar('signature', { length: 60 }),
  createdAt: timestamp('created_at').defaultNow(),
  /** Affiché sous le chapitre — seule trace de fraîcheur d'un texte qui vit des mois. */
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Le lien de partage d'une histoire ───────────────────────────────────────
// André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire. »
// Une adresse à jeton qui ouvre `/histoire/<jeton>` SANS mot de passe, en
// lecture seule, et qui se révoque. Voir drizzle/0019 pour le raisonnement.
//
// ⛔ Une table à part, et pas deux colonnes sur `characters` :
// `saveCharacter()` réécrit cette table par `.set({ ...charValues })` à chaque
// enregistrement de fiche. Un jeton posé là dépendrait de la façon dont ce jeu
// de valeurs se construit — c'est le défaut qui a vidé le carquois de Bram
// (`quantite_munitions`) et fait compter une armure rangée au sac
// (`est_portee`). Ici, enregistrer une fiche ne peut rien effacer.
export const characterStoryShares = pgTable('character_story_shares', {
  id: serial('id').primaryKey(),
  /** UNIQUE en base : un seul lien actif par histoire. */
  personnageId: integer('personnage_id').notNull().unique().references(() => characters.id),
  /**
   * 24 caractères, 120 bits (`lib/partage.ts`). UNIQUE : c'est la clé d'entrée
   * de la page publique.
   * ⚠ Colonne à 64 pour laisser la place d'allonger le jeton un jour sans
   * migration — la longueur réelle est vérifiée par `estJetonBienForme()`.
   */
  jeton: varchar('jeton', { length: 64 }).notNull().unique(),
  /** Depuis quand ce lien circule — la seule chose honnête à dire avant de le couper. */
  creeLe: timestamp('cree_le').defaultNow(),
})

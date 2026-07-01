export interface CapaciteClasse {
  niveau: number
  nom: string
  detail: string
}

// Seules les capacités significatives sont listées (pas les dons répétés de Guerrier/Moine)
export const CAPACITES_PAR_CLASSE: Record<string, CapaciteClasse[]> = {
  'Barbare': [
    { niveau: 1,  nom: 'Rage',                    detail: '1×/jour (+1 par 4 niveaux) : +4 FOR, +4 CON, −2 CA, +2 Vigueur/Volonté pendant 3+mod CON rounds.' },
    { niveau: 1,  nom: 'Déplacement accéléré',    detail: '+3 m de déplacement au sol si pas en armure lourde.' },
    { niveau: 2,  nom: 'Esquive instinctive',      detail: 'Garde son bonus DEX à la CA même surpris ou attaqué d\'un flanc non vu.' },
    { niveau: 3,  nom: 'Résistance au danger',     detail: 'RD 1/— (augmente de 1 tous les 3 niveaux).' },
    { niveau: 5,  nom: 'Rage améliorée',           detail: 'Bonus Rage : +6 FOR, +6 CON.' },
    { niveau: 7,  nom: 'Perception des pièges',    detail: '+1 aux jets Réflexes et Intuition contre les pièges (+1 par 3 niveaux).' },
    { niveau: 11, nom: 'Rage suprême',             detail: 'Bonus Rage : +8 FOR, +8 CON.' },
    { niveau: 14, nom: 'Esquive instinctive sup.', detail: 'Impossible de flanquer le barbare.' },
    { niveau: 20, nom: 'Puissance indomptable',    detail: 'En rage, peut dépasser CON 20 ; bonus CON s\'ajoute aux PV temporaires.' },
  ],
  'Barde': [
    { niveau: 1,  nom: 'Inspiration bardique',     detail: 'Inspire courage : +1 moral attaque/dégâts/sauvegardes peur alliés. D\'autres capacités s\'ajoutent avec les niveaux.' },
    { niveau: 1,  nom: 'Compétences bardiques',    detail: 'Maîtrise barde & langage secret du barde.' },
    { niveau: 2,  nom: 'Contre-sort',              detail: 'Peut utiliser Représentation pour contrecarrer les sorts en s\'y opposant.' },
    { niveau: 3,  nom: 'Compétence bardique: légende', detail: 'Peut utiliser Représentation pour aider les alliés à retenir des informations (Connaissance).' },
    { niveau: 6,  nom: 'Suggestion',               detail: 'Peut lancer Suggestion sur une créature touchée par son inspiration.' },
    { niveau: 9,  nom: 'Chant inspirant',          detail: 'Peut rendre les alliés insensibles à la peur ou aux charmes avec Représentation.' },
    { niveau: 12, nom: 'Inspiration compétence',   detail: 'Accorde un bonus de compétence à un allié par représentation.' },
    { niveau: 15, nom: 'Suggestion de masse',      detail: 'Affecte plusieurs créatures avec Suggestion.' },
    { niveau: 18, nom: 'Inspiration épique',       detail: 'Permet d\'accorder un reroll à un allié 1×/round.' },
  ],
  'Druide': [
    { niveau: 1,  nom: 'Empathie sauvage',         detail: 'Calme ou influence les animaux (équivalent Diplomatie).' },
    { niveau: 1,  nom: 'Langue secrète',           detail: 'Connaît le Druidique, langue secrète non enseignée aux non-druides.' },
    { niveau: 2,  nom: 'Résistance aux charmes',   detail: '+4 aux JS contre les poisons et les effets des Fées.' },
    { niveau: 4,  nom: 'Familier (animal)',        detail: 'Compagnon animal permanent qui gagne des capacités avec les niveaux du druide.' },
    { niveau: 5,  nom: 'Forme sauvage',            detail: '1×/jour (puis +1 par 2 niveaux) : se transforme en animal Small-Large pendant heures=niv. druide.' },
    { niveau: 9,  nom: 'Forme sauvage — Minuscule/Géant', detail: 'Peut se transformer en animal Tiny ou Huge.' },
    { niveau: 11, nom: 'Forme sauvage — Élémental', detail: 'Peut se transformer en élémental Petit ou Moyen 3×/jour.' },
    { niveau: 13, nom: 'Forme sauvage — Grand élémental', detail: 'Peut se transformer en élémental Grand 3×/jour.' },
    { niveau: 15, nom: 'Forme sauvage — Élémental supr.', detail: 'Peut se transformer en élémental Très grand 4×/jour.' },
    { niveau: 20, nom: 'Seigneur de la nature',    detail: 'Immunisé aux poisons, maladies, vieillissement. Plus besoin de manger ou boire.' },
  ],
  'Ensorceleur': [
    { niveau: 1,  nom: 'Familier',                 detail: 'Créature magique compagnon qui amplifie certains sorts et gagne des capacités avec le niveau.' },
  ],
  'Guerrier': [
    { niveau: 1,  nom: 'Dons de guerrier',         detail: 'Don supplémentaire au niv.1 puis à chaque niveau pair (choisi dans la liste de dons de combat).' },
    { niveau: 2,  nom: 'Courage à toute épreuve',  detail: '+2 moral aux JS contre peur et démoralisation.' },
  ],
  'Magicien': [
    { niveau: 1,  nom: 'Familier',                 detail: 'Créature magique compagnon qui amplifie certains sorts et gagne des capacités avec le niveau.' },
    { niveau: 1,  nom: 'École de spécialisation',  detail: 'Option : se spécialiser dans une école (sort bonus / emplacements +1 par niveau) avec 1-2 écoles interdites.' },
    { niveau: 5,  nom: 'Don de bonus',             detail: 'Don de bonus choisi dans la liste des dons de métamagie ou de création d\'objets magiques.' },
    { niveau: 10, nom: 'Don de bonus',             detail: 'Don de bonus (métamagie ou création).' },
    { niveau: 15, nom: 'Don de bonus',             detail: 'Don de bonus (métamagie ou création).' },
    { niveau: 20, nom: 'Don de bonus',             detail: 'Don de bonus (métamagie ou création).' },
  ],
  'Moine': [
    { niveau: 1,  nom: 'Attaque à mains nues',     detail: 'Dégâts mains nues : 1d6 (M), progressent jusqu\'à 2d10 au niv.20. Peut frapper des créatures incorporelles.' },
    { niveau: 1,  nom: 'Défense sans armure',      detail: 'Bonus de Sagesse (si ≥0) à la CA sans armure. Progressif selon le tableau du moine.' },
    { niveau: 1,  nom: 'Don de bonus',             detail: 'Don de moine au niv.1, 2 et 6 (dans la liste: Attaque en finesse, Combat à deux armes, etc.).' },
    { niveau: 2,  nom: 'Esquive instinctive',      detail: 'Garde son bonus DEX à la CA même surpris.' },
    { niveau: 3,  nom: 'Déplacement accéléré',     detail: '+3 m de déplacement au sol à partir du niv.3 (+3 m par tranche de 3 niveaux).' },
    { niveau: 3,  nom: 'Frappe renversante',        detail: 'Peut tenter de renverser un ennemi à la place d\'infliger des dégâts (DMG).' },
    { niveau: 4,  nom: 'Pureté du corps',          detail: 'Immunité aux maladies naturelles.' },
    { niveau: 5,  nom: 'Châtiment des malfaisants', detail: 'Frappe à mains nues compte comme magique pour ignorer RD.' },
    { niveau: 7,  nom: 'Vol du ki',               detail: '1×/semaine: vole la vitalité d\'une créature (perd un niveau) pendant quelques heures.' },
    { niveau: 9,  nom: 'Amélioration du ki',       detail: 'Frappe à mains nues compte comme arme d\'argent et de bien pour ignorer RD.' },
    { niveau: 11, nom: 'Corps de diamant',         detail: 'Immunité aux poisons.' },
    { niveau: 12, nom: 'Pas dans l\'air',          detail: 'Peut courir sur les surfaces verticales ou l\'eau à vitesse normale.' },
    { niveau: 13, nom: 'Âme de diamant',           detail: 'Résistance à la magie égale à 10+niveau.' },
    { niveau: 14, nom: 'Esquive instinctive sup.', detail: 'Impossible de flanquer le moine.' },
    { niveau: 15, nom: 'Frappe assourdissante',    detail: 'Frappe à mains nues : étourdit l\'ennemi raté le JS.' },
    { niveau: 17, nom: 'Âme vide',                detail: 'Immunité aux sorts ciblant l\'esprit (charme, compulsion, etc.).' },
    { niveau: 19, nom: 'Longévité perpétuelle',    detail: 'Ne prend plus de malus de vieillissement (bonus restent).' },
    { niveau: 20, nom: 'Perfection du corps',      detail: '+2 à toutes les caractéristiques.' },
  ],
  'Paladin': [
    { niveau: 1,  nom: 'Imposition des mains',     detail: 'Soigne niveau×CAR pv par jour, en une ou plusieurs fois. Ou inflige ce montant aux morts-vivants (1 toucher).' },
    { niveau: 1,  nom: 'Détection du mal',         detail: 'Détecte l\'aura du Mal à volonté (comme le sort Détection du Mal).' },
    { niveau: 1,  nom: 'Aura du bien',             detail: 'Aura de Bien de puissance égale au niveau de paladin.' },
    { niveau: 2,  nom: 'Charger les maux',         detail: 'Soigne une quantité de maladies naturelles par jour = mod CAR (min 1), par imposition des mains.' },
    { niveau: 3,  nom: 'Aura de courage',          detail: '+4 moral contre la peur pour lui-même et alliés à 3 m. Immunité à la peur lui-même.' },
    { niveau: 3,  nom: 'Santé divine',             detail: 'Immunité aux maladies, naturelles ou magiques.' },
    { niveau: 4,  nom: 'Châtiment du malfaisant',  detail: '1×/jour (+1 par 5 niveaux) : +1d6 dégâts divins par 2 niveaux sur une attaque déclarée.' },
    { niveau: 5,  nom: 'Monture spéciale',         detail: 'Convoque une monture surnaturelle (généralement un destrier des célestes) — bonus au paladin.' },
    { niveau: 6,  nom: 'Supprimer les maladies',   detail: 'Guérit les maladies par imposition des mains : 1×/semaine par 3 niveaux.' },
    { niveau: 11, nom: 'Briseur du Mal',           detail: 'Armes du paladin comptent comme Bien alignées pour ignorer la RD des démons.' },
  ],
  'Prêtre': [
    { niveau: 1,  nom: 'Renvoi des morts-vivants', detail: 'Tente de repousser ou détruire les morts-vivants (ou de les contrôler si malveillant). 3+mod CHA/jour.' },
    { niveau: 1,  nom: 'Domaines',                 detail: 'Choisit 2 domaines divins — chaque domaine accorde un pouvoir de domaine et 1 sort de domaine/niveau de sort.' },
    { niveau: 1,  nom: 'Sorts spontanés',          detail: 'Peut sacrifier un sort préparé pour lancer Soins/Blessures légers (et supérieurs) du même niveau.' },
  ],
  'Rôdeur': [
    { niveau: 1,  nom: 'Ennemi juré',              detail: '+2 Bluff/Disc./Empathie/Initiativ./Survie contre un type de créature choisi. +2 dégâts corpo. +1 ennemi aux niv.5,10,15,20.' },
    { niveau: 1,  nom: 'Pistage',                  detail: 'Peut utiliser Survie pour suivre des pistes (comme le don Pistage).' },
    { niveau: 1,  nom: 'Style de combat',          detail: 'Choisit Combat à deux armes (ignore −2 main directrice) ou Tir à l\'arc (don Tir à bout portant).' },
    { niveau: 2,  nom: 'Empathie sauvage',         detail: 'Comme le druide (améliorer l\'attitude des animaux).' },
    { niveau: 3,  nom: 'Endurance',                detail: 'Don Endurance (bonus aux JS de Constitution en situation d\'épuisement).' },
    { niveau: 4,  nom: 'Compagnon animal',         detail: 'Compagnon animal (comme un druide de niv = ½ rôdeur).' },
    { niveau: 6,  nom: 'Style de combat sup.',     detail: 'Style de combat amélioré (ex. Combat à deux armes supérieur).' },
    { niveau: 7,  nom: 'Connaissance des bois',   detail: 'Ne peut pas être perdu magiquement dans la nature, et survie alimentaire sans jet.' },
    { niveau: 8,  nom: 'Déplacement rapide',       detail: 'Comme Liberté de mouvement contre difficultés de terrain naturel.' },
    { niveau: 11, nom: 'Style de combat maîtrisé', detail: 'Style de combat maîtrisé (ex. Ambidextrie supérieure).' },
  ],
  'Roublard': [
    { niveau: 1,  nom: 'Attaque sournoise',        detail: '+1d6 dégâts si l\'ennemi est pris en flanc ou privé de DEX. Augmente de 1d6 par 2 niveaux.' },
    { niveau: 1,  nom: 'Chercher les pièges',      detail: 'Peut détecter et désamorcer des pièges magiques et mécaniques avec Détection/Escamotage.' },
    { niveau: 2,  nom: 'Esquive totale',           detail: 'Réflexes réussis = 0 dégâts au lieu de moitié (comme l\'esquive des sorts à zone).' },
    { niveau: 3,  nom: 'Coup bas',                 detail: 'Don Coup bas : peut prendre ses adversaires en flanc seul.' },
    { niveau: 4,  nom: 'Sens aiguisés',            detail: 'Ne peut pas être pris en flanc par un rôdeur de niv. 4+ si niv. > adversaire.' },
    { niveau: 6,  nom: 'Esquive totale sup.',      detail: 'En cas de Réflexes raté, ne subit que la moitié des dégâts (ceux qui ignorent l\'esquive totale).' },
    { niveau: 8,  nom: 'Intuition du danger',      detail: '+1 aux jets de Réflexes contre les pièges (+1 par 2 niveaux suivants).' },
    { niveau: 10, nom: 'Attaque spéciale',         detail: 'Choix parmi : Esquive améliorée, Coup sourd, Briser l\'élan, Mauvais oeil, etc.' },
    { niveau: 12, nom: 'Coup sourd',               detail: 'Attaque sournoise peut étourdir l\'ennemi (JS Vigueur DD 10+niv+INT).' },
  ],
}

export function getCapacitesPourPersonnage(nomClasse: string, niveau: number): CapaciteClasse[] {
  const feats = CAPACITES_PAR_CLASSE[nomClasse] ?? []
  return feats.filter(f => f.niveau <= niveau)
}

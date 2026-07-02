export interface DomaineInfo {
  nom: string
  pouvoir: string
  sorts: string[]  // 1 sort par niveau (index 0 = niv.1 ... index 8 = niv.9)
}

// Source : PHB D&D 3.5, p.183-187 (SRD)
export const DOMAINES_DND35: DomaineInfo[] = [
  {
    nom: 'Air',
    pouvoir: 'Renvoi des créatures à base de terre ou de pierre (comme renvoi morts-vivants, 3+mod CHA/jour).',
    sorts: ['Appel de la foudre', 'Rafale de vent', 'Convocation de nuée', 'Dissipation de brouillard', 'Contrôle des vents', 'Tempête vengeresse', 'Maelström', 'Air glacial', 'Tempête de grêle'],
  },
  {
    nom: 'Animal',
    pouvoir: 'Parler aux animaux 1 fois/jour (comme le sort). Compagnon animal (comme le rôdeur, niv. druide −3).',
    sorts: ['Charme-animal', 'Empathie sauvage', 'Croissance animale', 'Localisation de créature', 'Communier avec la nature', 'Antinaturel', 'Festin de chair', 'Animal épique', 'Régression animale'],
  },
  {
    nom: 'Chaos',
    pouvoir: '+1 niveau effectif pour lancer des sorts de type [Chaos].',
    sorts: ['Protection contre la Loi', 'Résistance aux armes', 'Briser', 'Chaos rampant', 'Dispersion du droit', 'Animé le chaos', 'Bouclier du chaos', 'Manteau du chaos', 'Vague de chaos'],
  },
  {
    nom: 'Destruction',
    pouvoir: 'Frappe destructrice : 1×/jour, toucher qui inflige 1 pt de dommage/niv + dégâts d\'arme normaux.',
    sorts: ['Blessure légère', 'Déchirure', 'Contraction', 'Blessure grave', 'Implosion', 'Harm', 'Désintégration', 'Épée des ténèbres', 'Implosion'],
  },
  {
    nom: 'Divination',
    pouvoir: 'Ajoute tous les sorts de Divination à la liste de classe. +2 aux tests de Psychologie.',
    sorts: ['Sagesse du détective', 'Augure', 'Clairvoyance', 'Divination', 'Communion', 'Vérité', 'Vision du futur', 'Vision', 'Foresight'],
  },
  {
    nom: 'Eau',
    pouvoir: 'Renvoi des créatures à base de feu (comme renvoi morts-vivants, 3+mod CHA/jour).',
    sorts: ['Nappe de brouillard', 'Respiration aquatique', 'Déluge', 'Contrôle de l\'eau', 'Marche sur l\'eau', 'Cône de froid', 'Inondation acide', 'Nuage empoisonné', 'Maelström'],
  },
  {
    nom: 'Feu',
    pouvoir: 'Renvoi des créatures à base d\'eau ou de glace. Résistance au feu 6.',
    sorts: ['Dard enflammé', 'Torche', 'Boule de feu', 'Mur de feu', 'Bouclier de feu', 'Flammes sacrées', 'Détonation thermique', 'Incendie de feu', 'Tempête de feu'],
  },
  {
    nom: 'Guerre',
    pouvoir: 'Maîtrise gratuite des armes de prédilection de la divinité (arme de guerre + maîtrise du bouclier).',
    sorts: ['Bénédiction d\'arme', 'Arme spirituelle', 'Arme magique supérieure', 'Défense divine', 'Résistance à l\'énergie', 'Épée flamboyante', 'Arme de la foi', 'Arme bénie', 'Puissance martiale'],
  },
  {
    nom: 'Guérison',
    pouvoir: 'Lancer des sorts de soin à +1 niveau effectif. Peut lancer Imposition des mains 1×/jour (3 pv/niv).',
    sorts: ['Soins légers', 'Soins modérés', 'Soins importants', 'Soins graves', 'Soins critiques', 'Soins de groupe', 'Régénération', 'Retour de l\'au-delà', 'Résurrection totale'],
  },
  {
    nom: 'Gloire',
    pouvoir: 'Terreur sacrée : les morts-vivants de 5 DV ou moins fuient. Renvoi amélioré.',
    sorts: ['Prestidigitation divine', 'Reflet brillant', 'Sphère lumineuse', 'Bannière céleste', 'Rayonnement sacré', 'Halo de rayonnement', 'Lumière aveuglante', 'Soleil', 'Lumière du soleil'],
  },
  {
    nom: 'Bien',
    pouvoir: '+1 niveau effectif pour lancer des sorts de type [Bien].',
    sorts: ['Protection contre le Mal', 'Aide', 'Cercle de protection contre le Mal', 'Sanctification du mal', 'Dispersion du mal', 'Arme bénie', 'Flamme sacrée', 'Aura du Bien', 'Bannissement'],
  },
  {
    nom: 'Chance',
    pouvoir: 'Joie 1×/jour (relance un dé, garde le meilleur résultat).',
    sorts: ['Grâce', 'Aide', 'Protection contre les éléments', 'Liberté de mouvement', 'Héroïsme suprême', 'Joyau de vœu', 'Chance suprême', 'Protection divine', 'Miracle'],
  },
  {
    nom: 'Loi',
    pouvoir: '+1 niveau effectif pour lancer des sorts de type [Loi].',
    sorts: ['Protection contre le Chaos', 'Calme des émotions', 'Mandats divins', 'Dictum', 'Ordre coercitif', 'Mur d\'ordre', 'Cloche d\'ordre', 'Bouclier de la Loi', 'Implantation de la Loi'],
  },
  {
    nom: 'Magie',
    pouvoir: 'Utilise le niveau de prêtre pour les tests de niveau de lanceur contre la Dissipation.',
    sorts: ['Détection de la magie', 'Identification', 'Dissipation de la magie', 'Contresort imbattable', 'Aura magique', 'Globe d\'invulnérabilité', 'Dissipation supérieure', 'Moment de prescience', 'Souhait'],
  },
  {
    nom: 'Mal',
    pouvoir: '+1 niveau effectif pour lancer des sorts de type [Mal].',
    sorts: ['Protection contre le Bien', 'Ténèbres', 'Magie néfaste', 'Cercle contre le Bien', 'Ombre maléfique', 'Création de morts-vivants', 'Désespoir d\'Evard', 'Aura maléfique', 'Châtiment divin'],
  },
  {
    nom: 'Mort',
    pouvoir: 'Toucher mortel 1×/jour : tuer une créature (JS Vigueur DD 10+½niv+mod SAG). Dommages létaux sinon.',
    sorts: ['Raison faussée', 'Rayon d\'affaiblissement', 'Mort simulée', 'Mort prématurée', 'Mort-vivant gardien', 'Création de morts-vivants', 'Destruction', 'Châtiment divin', 'Mort'],
  },
  {
    nom: 'Nature',
    pouvoir: 'Connaît Empathie sauvage. Compagnon animal (comme druide niv−3). Parler aux animaux 1×/jour.',
    sorts: ['Résistance au feu/froid', 'Pied léger', 'Croissance de bois', 'Épines', 'Contrôle de l\'eau', 'Mur de fer', 'Animaux de service', 'Vermine de siège', 'Vent de nature'],
  },
  {
    nom: 'Plante',
    pouvoir: 'Renvoi des créatures végétales (comme renvoi morts-vivants). Résistance aux poisons +2.',
    sorts: ['Enchevêtrement', 'Croissance de bois', 'Épines', 'Commandement de plantes', 'Mur d\'épines', 'Contrôle des plantes', 'Animaux de service', 'Empoisonnement par la sève', 'Changement de nature'],
  },
  {
    nom: 'Protection',
    pouvoir: 'Bouclier protecteur 1×/jour : accorder resistance égale au niv à un allié pour 1 minute.',
    sorts: ['Sanctuaire', 'Bouclier de la foi', 'Protection contre les éléments', 'Coche magique', 'Magie antimissile', 'Bouclier antimagie', 'Sphère de déflexion', 'Coupole protectrice', 'Globe protecteur'],
  },
  {
    nom: 'Renforcement',
    pouvoir: '+1 bonus de force pendant 1 round/niv 1×/jour (commence la journée).',
    sorts: ['Endurance du rhinocéros', 'Grâce du chat', 'Force du taureau', 'Peau de pierre', 'Vigueur d\'aigle', 'Amélioration suprême', 'Peau graniteuse', 'Croissance suprême', 'Magie noire'],
  },
  {
    nom: 'Soleil',
    pouvoir: 'Éclat du soleil 1×/jour : comme lumière aveuglante sur un mort-vivant adjacent.',
    sorts: ['Lumière', 'Rayon ardent', 'Soleil aveuglant', 'Lumière du jour', 'Flammes sacrées', 'Rayon de soleil', 'Explosion solaire', 'Lumière incandescente', 'Prisme solaire'],
  },
  {
    nom: 'Ruse',
    pouvoir: 'Peut utiliser Escamotage et Discrétion comme compétences de classe. +2 aux compétences sociales.',
    sorts: ['Déguisement', 'Invisibilité', 'Faux auguré', 'Confusion', 'Fausse vision', 'Voile', 'Simulation', 'Polymorplie à volonté', 'Insubstantialité'],
  },
  {
    nom: 'Voyage',
    pouvoir: 'Liberté de mouvement pendant 1 round/niv par jour (dépensés librement). Déplacement augmenté de 3 m.',
    sorts: ['Manteau de vent', 'Lévitation', 'Célérité', 'Liberté de mouvement', 'Téléportation', 'Trouver le chemin', 'Téléportation suprême', 'Déplacement éthéré', 'Marche planaire'],
  },

  // ─── Domaines des Royaumes Oubliés (Univers, chapitre 2, p.62-66) ───
  {
    nom: 'Araignées',
    pouvoir: 'Intimider ou contrôler les araignées comme un prêtre mauvais avec les morts-vivants (3 + mod CHA fois/jour).',
    sorts: ['Pattes d\'araignée', 'Nuée grouillante', 'Coursier fantôme (apparence de vermine)', 'Vermine géante', 'Fléau d\'insectes', 'Malédiction arachnide', 'Araignées de pierre', 'Mort rampante', 'Métamorphose arachnide'],
  },
  {
    nom: 'Artisanat',
    pouvoir: 'Lance les sorts de Création à +1 niveau effectif. Don Talent (compétence Artisanat au choix).',
    sorts: ['Corde animée', 'Façonnage du bois', 'Façonnage de la pierre', 'Création mineure', 'Mur de pierre', 'Machine fantastique', 'Création majeure', 'Cage de force', 'Machine fantastique améliorée'],
  },
  {
    nom: 'Cavernes',
    pouvoir: 'Connaissance de la pierre des nains (s\'il la possède déjà, bonus racial porté à +4 pour remarquer la roche inhabituelle).',
    sorts: ['Détection des passages secrets', 'Ténèbres', 'Fusion dans la pierre', 'Refuge de Léomund', 'Passe-muraille', 'Orientation', 'Mâchoire de pierre', 'Tremblement de terre', 'Emprisonnement'],
  },
  {
    nom: 'Charme',
    pouvoir: '1×/jour, +4 en Charisme pendant 1 minute (action libre).',
    sorts: ['Charme-personne', 'Apaisement des émotions', 'Suggestion', 'Émotion', 'Charme-monstre', 'Quête', 'Aliénation mentale', 'Exigence', 'Domination universelle'],
  },
  {
    nom: 'Commerce',
    pouvoir: '1×/jour, détection de pensées pendant un nombre de minutes égal au mod de CHA (action libre).',
    sorts: ['Message', 'Gemme explosive', 'Splendeur de l\'aigle', 'Communication à distance', 'Fabrication', 'Vision lucide', 'Manoir somptueux de Mordenkainen', 'Esprit impénétrable', 'Localisation suprême'],
  },
  {
    nom: 'Destin',
    pouvoir: 'Esquive instinctive (comme un roublard de niveau 3).',
    sorts: ['Coup au but', 'Augure', 'Malédiction', 'Rapport', 'Marque de la justice', 'Quête', 'Vision mystique', 'Esprit impénétrable', 'Prémonition'],
  },
  {
    nom: 'Drows',
    pouvoir: 'Don Réflexes surhumains.',
    sorts: ['Manteau de sombre puissance', 'Clairaudience/clairvoyance', 'Suggestion', 'Détection du mensonge', 'Forme arachnide', 'Dissipation suprême', 'Parole du Chaos', 'Allié d\'outreplan supérieur', 'Portail'],
  },
  {
    nom: 'Elfes',
    pouvoir: 'Don Tir à bout portant.',
    sorts: ['Coup au but', 'Grâce féline', 'Collet', 'Voyage par les arbres', 'Communion avec la nature', 'Orientation', 'Chêne animé', 'Explosion de lumière', 'Aversion'],
  },
  {
    nom: 'Esprit',
    pouvoir: '1×/jour, protection mentale sur une créature touchée : bonus de résistance aux jets de Volonté pendant 1 heure.',
    sorts: ['Action aléatoire', 'Détection de pensées', 'Clairaudience/clairvoyance', 'Modification de mémoire', 'Brume mentale', 'Lien télépathique de Rary', 'Aversion', 'Esprit impénétrable', 'Projection astrale'],
  },
  {
    nom: 'Famille',
    pouvoir: '1×/jour, +4 d\'esquive à la CA à un nombre de créatures égal au mod de CHA (1 round/niv, à 3 m max du prêtre).',
    sorts: ['Bénédiction', 'Protection d\'autrui', 'Main du berger', 'Transfert de sorts', 'Lien télépathique de Rary', 'Festin des héros', 'Refuge', 'Protection contre les sorts', 'Sphère prismatique'],
  },
  {
    nom: 'Gnomes',
    pouvoir: 'Lance les sorts d\'illusion à +1 niveau effectif.',
    sorts: ['Image silencieuse', 'Gemme explosive', 'Image imparfaite', 'Création mineure', 'Terrain hallucinatoire', 'Machine fantastique', 'Écran', 'Danse irrésistible d\'Otto', 'Convocation d\'alliés naturels IX (élémentaires de terre et animaux)'],
  },
  {
    nom: 'Haine',
    pouvoir: '1×/jour, +2 aux jets d\'attaque, de sauvegarde et à la CA contre un adversaire choisi pendant 1 minute (action libre).',
    sorts: ['Anathème', 'Effroi', 'Malédiction', 'Émotion (haine uniquement)', 'Force de colosse', 'Interdiction', 'Blasphème', 'Aversion', 'Plainte d\'outre-tombe'],
  },
  {
    nom: 'Halfelins',
    pouvoir: '1×/jour, bonus égal au mod de CHA aux jets de Déplacement silencieux, Discrétion, Escalade et Saut pendant 10 minutes (action libre).',
    sorts: ['Pierre magique', 'Grâce féline', 'Panoplie magique', 'Liberté de mouvement', 'Chien de garde de Mordenkainen', 'Glissement de terrain', 'Traversée des ombres', 'Mot de rappel', 'Prémonition'],
  },
  {
    nom: 'Illusion',
    pouvoir: 'Lance les sorts d\'illusion à +1 niveau effectif.',
    sorts: ['Image silencieuse', 'Image imparfaite', 'Déplacement', 'Assassin imaginaire', 'Image prédéterminée', 'Double illusoire', 'Projection d\'image', 'Écran', 'Ennemi subconscient'],
  },
  {
    nom: 'Jugement',
    pouvoir: '1×/jour, riposte contre l\'adversaire qui vient de vous blesser : si le coup porte, il inflige les dégâts maximaux.',
    sorts: ['Bouclier de la foi', 'Endurance', 'Communication avec les morts', 'Bouclier de feu', 'Marque de la justice', 'Bannissement', 'Renvoi des sorts', 'Localisation suprême', 'Tempête vengeresse'],
  },
  {
    nom: 'Lune',
    pouvoir: 'Repousser ou détruire les lycanthropes comme un prêtre bon avec les morts-vivants (3 + mod CHA fois/jour).',
    sorts: ['Lueur féerique', 'Rayon de lune', 'Sabre de lune', 'Émotion', 'Voie lunaire', 'Image permanente', 'Aliénation mentale', 'Métamorphose animale', 'Feu de lune'],
  },
  {
    nom: 'Métal',
    pouvoir: 'Don Maniement des armes de guerre ou exotiques + Arme de prédilection pour un type de marteau au choix.',
    sorts: ['Arme magique', 'Métal brûlant', 'Affûtage', 'Rouille', 'Mur de fer', 'Barrière de lames', 'Transmutation du métal en bois', 'Corps de fer', 'Éloignement du métal et de la pierre'],
  },
  {
    nom: 'Morts-vivants',
    pouvoir: 'Don Emprise sur les morts-vivants.',
    sorts: ['Détection des morts-vivants', 'Profanation', 'Animation des morts', 'Protection contre la mort', 'Cercle de douleur', 'Création de mort-vivant', 'Contrôle des morts-vivants', 'Création de mort-vivant dominant', 'Absorption d\'énergie'],
  },
  {
    nom: 'Nains',
    pouvoir: 'Don Vigueur surhumaine.',
    sorts: ['Arme magique', 'Endurance', 'Glyphe de garde', 'Arme magique supérieure', 'Fabrication', 'Pierres commères', 'Décret', 'Protection contre les sorts', 'Nuée d\'élémentaires (terre uniquement)'],
  },
  {
    nom: 'Noblesse',
    pouvoir: '1×/jour, galvanise les alliés qui l\'entendent : +2 de moral aux jets d\'attaque, de sauvegarde, de caractéristique, de compétence et de dégâts (durée = mod CHA en rounds, action libre).',
    sorts: ['Faveur divine', 'Discours captivant', 'Panoplie magique', 'Détection du mensonge', 'Injonction suprême', 'Quête', 'Champ de force', 'Exigence', 'Tempête vengeresse'],
  },
  {
    nom: 'Obscurité',
    pouvoir: 'Don Combat en aveugle.',
    sorts: ['Brume de dissimulation', 'Cécité/surdité', 'Lueur noire', 'Armure des ténèbres', 'Éclair des ténèbres', 'Œil indiscret', 'Cauchemar', 'Mot de pouvoir aveuglant', 'Mot de pouvoir mortel'],
  },
  {
    nom: 'Océan',
    pouvoir: 'Respiration aquatique 10 rounds par niveau et par jour (utilisable en plusieurs fois).',
    sorts: ['Endurance aux énergies destructives', 'Cacophonie', 'Respiration aquatique', 'Liberté de mouvement', 'Mur de glace', 'Sphère glaciale d\'Otiluke', 'Trombe d\'eau', 'Tourbillon', 'Nuée d\'élémentaires (eau uniquement)'],
  },
  {
    nom: 'Organisation',
    pouvoir: 'Don Extension de durée.',
    sorts: ['Perception de la mort', 'Augure', 'Clairaudience/clairvoyance', 'Rapport', 'Détection de la scrutation', 'Festin des héros', 'Scrutation ultime', 'Localisation suprême', 'Arrêt du temps'],
  },
  {
    nom: 'Orques',
    pouvoir: '1×/jour (déclaré avant l\'attaque), bonus aux dégâts de mêlée égal au niveau de prêtre ; +4 de châtiment à l\'attaque contre les nains et les elfes.',
    sorts: ['Frayeur', 'Flammes', 'Prière', 'Puissance divine', 'Œil indiscret', 'Mauvais œil', 'Blasphème', 'Manteau du Chaos', 'Plainte d\'outre-tombe'],
  },
  {
    nom: 'Portails',
    pouvoir: 'Détecte les portails actifs et inactifs comme des passages secrets (jet de Fouille DD 20).',
    sorts: ['Convocation de monstres I', 'Analyse de portail', 'Ancre dimensionnelle', 'Porte dimensionnelle', 'Téléportation', 'Bannissement', 'Passage dans l\'éther', 'Dédale', 'Portail'],
  },
  {
    nom: 'Renouvellement',
    pouvoir: '1×/jour, s\'il tombe sous 0 pv (mais pas à −10), regagne automatiquement 1d8 + mod CHA points de vie.',
    sorts: ['Charme-personne', 'Restauration partielle', 'Guérison des maladies', 'Réincarnation', 'Pénitence', 'Festin des héros', 'Restauration suprême', 'Métamorphose universelle', 'Délivrance'],
  },
  {
    nom: 'Reptiles',
    pouvoir: 'Intimider ou contrôler les créatures reptiliennes et les serpents comme un prêtre mauvais avec les morts-vivants (3 + mod CHA fois/jour).',
    sorts: ['Morsure magique', 'Hypnose des animaux (reptiles uniquement)', 'Morsure magique aggravée', 'Empoisonnement', 'Croissance animale (reptiles uniquement)', 'Mauvais œil', 'Mort rampante (serpents TP)', 'Métamorphose animale (reptiles uniquement)', 'Changement de forme'],
  },
  {
    nom: 'Runes',
    pouvoir: 'Don Écriture de parchemins.',
    sorts: ['Effacement', 'Page secrète', 'Glyphe de garde', 'Runes explosives', 'Contrat', 'Glyphe de garde divin', 'Invocation instantanée de Drawmij', 'Symbole', 'Cercle de téléportation'],
  },
  {
    nom: 'Sorts',
    pouvoir: '+2 aux jets de Concentration et de Connaissance des sorts.',
    sorts: ['Armure de mage', 'Silence', 'Sort universel', 'Mémorisation de Rary', 'Annulation d\'enchantement', 'Sort universel amélioré', 'Souhait limité', 'Zone d\'antimagie', 'Disjonction de Mordenkainen'],
  },
  {
    nom: 'Souffrance',
    pouvoir: '1×/jour, attaque de contact : −2 en Force et Dextérité pendant 1 minute (sans effet sur les créatures immunisées aux critiques).',
    sorts: ['Imprécation', 'Endurance', 'Malédiction', 'Énergie négative', 'Débilité', 'Mise à mal', 'Mauvais œil (fièvre uniquement)', 'Symbole (douleur uniquement)', 'Flétrissure'],
  },
  {
    nom: 'Tempête',
    pouvoir: 'Résistance à l\'électricité (5 points).',
    sorts: ['Bouclier entropique', 'Bourrasque', 'Appel de la foudre', 'Tempête de neige', 'Tempête de grêle', 'Convocation de monstres VI (créatures de l\'air)', 'Contrôle du climat', 'Cyclone', 'Tempête vengeresse'],
  },
  {
    nom: 'Temps',
    pouvoir: 'Don Science de l\'initiative.',
    sorts: ['Coup au but', 'Préservation des morts', 'Rapidité', 'Liberté de mouvement', 'Permanence', 'Prévoyance', 'Rapidité de groupe', 'Prémonition', 'Arrêt du temps'],
  },
  {
    nom: 'Tyrannie',
    pouvoir: '+2 au DD des jets de sauvegarde des sorts de coercition qu\'il lance.',
    sorts: ['Injonction', 'Discours captivant', 'Détection du mensonge', 'Terreur', 'Injonction suprême', 'Quête', 'Poigne de Bigby', 'Charme de groupe', 'Domination universelle'],
  },
  {
    nom: 'Vases',
    pouvoir: 'Intimider ou contrôler les vases comme un prêtre mauvais avec les morts-vivants (3 + mod CHA fois/jour).',
    sorts: ['Graisse', 'Flèche acide de Melf', 'Empoisonnement', 'Rouille', 'Tentacules noirs d\'Evard', 'Transmutation de la pierre en boue', 'Destruction', 'Mot de pouvoir aveuglant', 'Implosion'],
  },
]

export function getDomaineInfo(nom: string): DomaineInfo | undefined {
  return DOMAINES_DND35.find(d => d.nom === nom)
}

export const NOMS_DOMAINES = DOMAINES_DND35.map(d => d.nom).sort()

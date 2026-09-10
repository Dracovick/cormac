export interface DomaineInfo {
  nom: string
  pouvoir: string
  sorts: string[]  // 1 sort par niveau (index 0 = niv.1 ... index 8 = niv.9)
}
// ══ SOURCES ══════════════════════════════════════════════════════════════════
// Toutes les pages citées ici ont été LUES à l'image (les PDF sont des scans
// sans couche texte : pdftotext ne rend rien). Décalage constaté, à revérifier
// pour tout nouvel ouvrage :
//   • Manuel des Joueurs 3.5 (VF)  → page PDF = page du livre + 1
//   • Les Royaumes Oubliés         → page PDF = page du livre + 1
//   • Codex Divin                  → page PDF = page du livre (décalage NUL)
// ⚠ Ces noms sont de l'affichage pur : aucune jointure ne les valide. Le LIVRE
//   est l'arbitre des noms de sorts, jamais la table `spells` (orientée
//   suppléments Faerûn, il lui manque des sorts du PHB).
export const DOMAINES_DND35: DomaineInfo[] = [
  // ─── Domaines du Manuel des Joueurs 3.5 (VF), chapitre 11, p.192-195 ───
  // Vérifiés à l'image page par page le 2026-08-27. Les 22 domaines du PHB y sont.
  {
    // PHB VF p.192
    nom: 'Air',
    pouvoir: 'Renvoi ou destruction des créatures de la terre comme un prêtre bon avec les morts-vivants ; peut aussi intimider, contrôler ou augmenter le moral des créatures de l\'air comme un prêtre mauvais. 3 + mod CHA fois/jour (pouvoir surnaturel).',
    sorts: ['Brume de dissimulation', 'Mur de vent', 'État gazeux', 'Marche dans les airs', 'Contrôle des vents', 'Éclair multiple', 'Contrôle du climat', 'Cyclone', 'Nuée d\'élémentaires (Air)'],
  },
  {
    // PHB VF p.193 — le livre le nomme « domaine de la Faune ».
    nom: 'Animal',
    pouvoir: 'Communication avec les animaux 1×/jour (pouvoir magique). Connaissances (nature) est une compétence de classe.',
    sorts: ['Apaisement des animaux', 'Immobilisation d\'animal', 'Domination d\'animal', 'Convocation d\'alliés naturels IV', 'Communion avec la nature', 'Coquille antivie', 'Métamorphose animale', 'Convocation d\'alliés naturels VIII', 'Changement de forme'],
  },
  {
    // PHB VF p.192
    nom: 'Bien',
    pouvoir: 'Lance les sorts du Bien avec un bonus de +1 au niveau de lanceur de sorts.',
    sorts: ['Protection contre le Mal', 'Aide', 'Cercle magique contre le Mal', 'Châtiment sacré', 'Rejet du Mal', 'Barrière de lames', 'Parole sacrée', 'Aura sacrée', 'Convocation de monstres IX'],
  },
  {
    // PHB VF p.192-193
    nom: 'Chaos',
    pouvoir: 'Lance les sorts du Chaos avec un bonus de +1 au niveau de lanceur de sorts.',
    sorts: ['Protection contre la Loi', 'Fracassement', 'Cercle magique contre la Loi', 'Marteau du Chaos', 'Rejet de la Loi', 'Animation d\'objets', 'Parole du Chaos', 'Manteau du Chaos', 'Convocation de monstres IX'],
  },
  {
    // PHB VF p.192
    nom: 'Chance',
    pouvoir: '1×/jour, faire appel à sa bonne fortune : rejouer un jet de dés qu\'il vient d\'effectuer, avant que le MD ne dévoile l\'issue de la situation. On applique systématiquement le résultat du second lancer, même s\'il est moins favorable que le premier (pouvoir extraordinaire).',
    sorts: ['Bouclier entropique', 'Aide', 'Protection contre les énergies destructives', 'Liberté de mouvement', 'Annulation d\'enchantement', 'Double illusoire', 'Renvoi des sorts', 'Moment de prescience', 'Miracle'],
  },
  {
    // PHB VF p.193 — « domaine de la Connaissance ».
    nom: 'Connaissance',
    pouvoir: 'Lance les sorts de Divination avec un bonus de +1 au niveau de lanceur de sorts. Connaissances (sous toutes ses formes) est une compétence de classe.',
    sorts: ['Détection des passages secrets', 'Détection de pensées', 'Clairaudience/clairvoyance', 'Divination', 'Vision lucide', 'Orientation', 'Mythes et légendes', 'Localisation suprême', 'Prémonition'],
  },
  {
    // PHB VF p.193
    nom: 'Destruction',
    pouvoir: '1×/jour, châtiment : attaque de corps à corps accompagnée d\'un bonus de +4 au jet d\'attaque et d\'un bonus aux dégâts égal au niveau de prêtre (en cas de coup au but). L\'intention doit être déclarée avant de lancer le dé d\'attaque (pouvoir surnaturel).',
    sorts: ['Blessure légère', 'Fracassement', 'Contagion', 'Blessure critique', 'Blessure légère de groupe', 'Mise à mal', 'Désintégration', 'Tremblement de terre', 'Implosion'],
  },
  {
    // Entrée héritée, NON conforme au PHB : le domaine du livre s'appelle « Connaissance » (voir ci-dessus).
    // Contenu laissé intact — sa suppression est une décision d'André.
    nom: 'Divination',
    pouvoir: 'Ajoute tous les sorts de Divination à la liste de classe. +2 aux tests de Psychologie.',
    sorts: ['Sagesse du détective', 'Augure', 'Clairvoyance', 'Divination', 'Communion', 'Vérité', 'Vision du futur', 'Vision', 'Foresight'],
  },
  {
    // PHB VF p.193
    nom: 'Eau',
    pouvoir: 'Renvoi ou destruction des créatures du feu comme un prêtre bon avec les morts-vivants ; peut aussi intimider, contrôler ou augmenter le moral des créatures de l\'eau comme un prêtre mauvais. 3 + mod CHA fois/jour (pouvoir surnaturel).',
    sorts: ['Brume de dissimulation', 'Nappe de brouillard', 'Respiration aquatique', 'Contrôle de l\'eau', 'Tempête de grêle', 'Cône de froid', 'Brume acide', 'Flétrissure', 'Nuée d\'élémentaires (Eau)'],
  },
  {
    // PHB VF p.193
    nom: 'Feu',
    pouvoir: 'Renvoi ou destruction des créatures de l\'eau comme un prêtre bon avec les morts-vivants ; peut aussi intimider, contrôler ou augmenter le moral des créatures du feu comme un prêtre mauvais. 3 + mod CHA fois/jour (pouvoir surnaturel).',
    sorts: ['Mains brûlantes', 'Flammes', 'Résistance aux énergies destructives', 'Mur de feu', 'Bouclier de feu', 'Germes de feu', 'Tempête de feu', 'Nuage incendiaire', 'Nuée d\'élémentaires (Feu)'],
  },
  {
    // PHB VF p.194 — « Domaine de la Force ». Vérifié à l'image le 2026-08-27.
    nom: 'Force',
    pouvoir: '1×/jour, exploit physique : la valeur de Force augmente brusquement (bonus d\'altération égal au niveau de prêtre). Dure 1 round. S\'active au prix d\'une action libre.',
    sorts: ['Agrandissement', 'Force de taureau', 'Panoplie magique', 'Immunité contre les sorts', 'Force du colosse', 'Peau de pierre', 'Poigne de Bigby', 'Poing de Bigby', 'Main broyeuse de Bigby'],
  },
  {
    // Entrée héritée, absente du PHB (le domaine de la Gloire vient du Codex Divin — non vérifié au livre).
    nom: 'Gloire',
    pouvoir: 'Terreur sacrée : les morts-vivants de 5 DV ou moins fuient. Renvoi amélioré.',
    sorts: ['Prestidigitation divine', 'Reflet brillant', 'Sphère lumineuse', 'Bannière céleste', 'Rayonnement sacré', 'Halo de rayonnement', 'Lumière aveuglante', 'Soleil', 'Lumière du soleil'],
  },
  {
    // PHB VF p.194
    nom: 'Guerre',
    pouvoir: 'Dons Maniement d\'une arme de guerre (si nécessaire) et Arme de prédilection, l\'arme étant celle de son dieu.',
    sorts: ['Arme magique', 'Arme spirituelle', 'Panoplie magique', 'Puissance divine', 'Colonne de feu', 'Barrière de lames', 'Mot de pouvoir aveuglant', 'Mot de pouvoir étourdissant', 'Mot de pouvoir mortel'],
  },
  {
    // PHB VF p.194
    nom: 'Guérison',
    pouvoir: 'Lance les sorts de guérison avec un bonus de +1 au niveau de lanceur de sorts.',
    sorts: ['Soins légers', 'Soins modérés', 'Soins importants', 'Soins intensifs', 'Soins légers de groupe', 'Guérison suprême', 'Régénération', 'Soins critiques de groupe', 'Guérison suprême de groupe'],
  },
  {
    // PHB VF p.194
    nom: 'Loi',
    pouvoir: 'Lance les sorts de la Loi avec un bonus de +1 au niveau de lanceur de sorts.',
    sorts: ['Protection contre le Chaos', 'Apaisement des émotions', 'Cercle magique contre le Chaos', 'Courroux de l\'ordre', 'Rejet du Chaos', 'Immobilisation de monstre', 'Décret', 'Bouclier de la Loi', 'Convocation de monstres IX'],
  },
  {
    // PHB VF p.194
    nom: 'Magie',
    pouvoir: 'Utilise les parchemins, baguettes et autres objets activés par une fin d\'incantation ou par le potentiel magique de leur utilisateur comme un magicien de la moitié de son niveau (niveau 1 minimum). Si le PJ est aussi magicien, ce niveau « virtuel » s\'ajoute à son niveau de magicien.',
    sorts: ['Aura indétectable de Nystul', 'Identification', 'Dissipation de la magie', 'Transfert de sorts', 'Résistance à la magie', 'Zone d\'antimagie', 'Renvoi des sorts', 'Protection contre les sorts', 'Disjonction de Mordenkainen'],
  },
  {
    // PHB VF p.194-195
    nom: 'Mal',
    pouvoir: 'Lance les sorts du Mal avec un bonus de +1 au niveau de lanceur de sorts.',
    sorts: ['Protection contre le Bien', 'Profanation', 'Cercle magique contre le Bien', 'Ténèbres maudites', 'Rejet du Bien', 'Création de mort-vivant', 'Blasphème', 'Aura maudite', 'Convocation de monstres IX'],
  },
  {
    // PHB VF p.195 — attention : la caresse mortelle n'offre AUCUN jet de sauvegarde.
    nom: 'Mort',
    pouvoir: '1×/jour, caresse mortelle : touche une créature vivante (attaque de contact) et jette 1d6 par niveau de prêtre. Si le total atteint ou dépasse les points de vie de la cible, elle meurt, sans jet de sauvegarde. Sinon elle n\'est pas affectée (pouvoir surnaturel).',
    sorts: ['Frayeur', 'Mise à mort', 'Animation des morts', 'Protection contre la mort', 'Exécution', 'Création de mort-vivant', 'Destruction', 'Création de mort-vivant dominant', 'Plainte d\'outre-tombe'],
  },
  {
    // Entrée héritée, absente du PHB (aucun « domaine de la Nature » aux p.192-195).
    nom: 'Nature',
    pouvoir: 'Connaît Empathie sauvage. Compagnon animal (comme druide niv−3). Parler aux animaux 1×/jour.',
    sorts: ['Résistance au feu/froid', 'Pied léger', 'Croissance de bois', 'Épines', 'Contrôle de l\'eau', 'Mur de fer', 'Animaux de service', 'Vermine de siège', 'Vent de nature'],
  },
  {
    // PHB VF p.194 — le livre le nomme « domaine de la Flore ».
    nom: 'Plante',
    pouvoir: 'Intimider ou contrôler les créatures végétales comme un prêtre mauvais avec les morts-vivants, 3 + mod CHA fois/jour (pouvoir surnaturel). Connaissances (nature) est une compétence de classe.',
    sorts: ['Enchevêtrement', 'Peau d\'écorce', 'Croissance végétale', 'Empire végétal', 'Mur d\'épines', 'Éloignement du bois', 'Animation des plantes', 'Contrôle des plantes', 'Grand tertre'],
  },
  {
    // PHB VF p.195
    nom: 'Protection',
    pouvoir: '1×/jour, protection divine sur une créature au choix : son prochain jet de sauvegarde reçoit un bonus de résistance égal au niveau de prêtre. Action simple, dure 1 heure ou jusqu\'à utilisation (pouvoir surnaturel).',
    sorts: ['Sanctuaire', 'Protection d\'autrui', 'Protection contre les énergies destructives', 'Immunité contre les sorts', 'Résistance à la magie', 'Zone d\'antimagie', 'Champ de force', 'Esprit impénétrable', 'Sphère prismatique'],
  },
  {
    // Entrée héritée, absente du PHB : le domaine de la Force (p.194) occupe cette place.
    // Contenu laissé intact — sa suppression est une décision d'André.
    nom: 'Renforcement',
    pouvoir: '+1 bonus de force pendant 1 round/niv 1×/jour (commence la journée).',
    sorts: ['Endurance du rhinocéros', 'Grâce féline', 'Force du taureau', 'Peau de pierre', 'Vigueur d\'aigle', 'Amélioration suprême', 'Peau graniteuse', 'Croissance suprême', 'Magie noire'],
  },
  {
    // PHB VF p.193 — le livre le nomme « domaine de la Duperie ».
    nom: 'Ruse',
    pouvoir: 'Bluff, Déguisement et Discrétion sont des compétences de classe.',
    sorts: ['Déguisement', 'Invisibilité', 'Antidétection', 'Confusion', 'Leurre', 'Double illusoire', 'Écran', 'Métamorphose universelle', 'Arrêt du temps'],
  },
  {
    // PHB VF p.195
    nom: 'Soleil',
    pouvoir: '1×/jour, renvoi suprême : une tentative de renvoi, d\'intimidation ou de contrôle des morts-vivants dont les créatures affectées sont automatiquement détruites.',
    sorts: ['Endurance aux énergies destructives', 'Métal brûlant', 'Lumière brûlante', 'Bouclier de feu', 'Colonne de feu', 'Germes de feu', 'Rayon de soleil', 'Explosion de lumière', 'Sphère prismatique'],
  },
  {
    // PHB VF p.195 — domaine absent de la liste jusqu'au 2026-08-27.
    nom: 'Terre',
    pouvoir: 'Renvoi ou destruction des créatures de l\'air comme un prêtre bon avec les morts-vivants ; peut aussi intimider, contrôler ou augmenter le moral des créatures de la terre comme un prêtre mauvais. 3 + mod CHA fois/jour (pouvoir surnaturel).',
    sorts: ['Pierre magique', 'Ramollissement de la terre et de la pierre', 'Façonnage de la pierre', 'Pierres acérées', 'Mur de pierre', 'Peau de pierre', 'Tremblement de terre', 'Corps de fer', 'Nuée d\'élémentaires (Terre)'],
  },
  {
    // PHB VF p.195
    nom: 'Voyage',
    pouvoir: 'Agit normalement même sous un effet magique restreignant ses mouvements : pouvoir extraordinaire semblable à liberté de mouvement, utilisable à volonté dans la limite d\'un total quotidien de 1 round par niveau. Sens de la nature est une compétence de classe.',
    sorts: ['Repli expéditif', 'Localisation d\'objet', 'Vol', 'Porte dimensionnelle', 'Téléportation', 'Orientation', 'Téléportation suprême', 'Porte de phase', 'Projection astrale'],
  },

  // ─── Domaines des Royaumes Oubliés (chapitre « La Magie », p.62 et suiv.) ───
  // Page 62 lue à l'image le 2026-08-27 : Araignées, Artisanat, Cavernes, Charme,
  // Commerce et Destin sont CONFORMES au livre (pouvoir et sorts). Le reste du bloc
  // n'a pas encore été recoupé, mais l'échantillon est bon.
  // ⚠ Ce chapitre redéfinit aussi des domaines du PHB (Air, Bien, Chance…) — il n'y
  //   donne que la liste des dieux de Faerûn, pas de sorts. Le PHB reste l'arbitre.
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

  // ─── Domaines du Codex Divin (chapitre 7, p.140 et suiv. — décalage PDF NUL) ───
  // Page 141 lue à l'image le 2026-08-27 : Communauté, Compétition, Convocation,
  // Création et Domination sont CONFORMES au livre. Le reste du bloc n'a pas encore
  // été recoupé, mais l'échantillon est bon.
  {
    nom: 'Célérité',
    pouvoir: '+3 m de déplacement au sol (perdu en armure ou charge intermédiaire/lourde). [Codex Divin]',
    sorts: ['Repli expéditif', 'Grâce féline', 'Flou', 'Rapidité', 'Voyage par les arbres', 'Vent divin', 'Grâce féline de groupe', 'Clignotement supérieur', 'Arrêt du temps'],
  },
  {
    nom: 'Climat',
    pouvoir: 'Insensible au mauvais temps : Détection/Fouille non pénalisés par pluie et neige, vitesse normale sur neige et glace, le vent l\'affecte comme s\'il avait une taille de plus. [Codex Divin]',
    sorts: ['Brume de dissimulation', 'Bourrasque', 'Appel de la foudre', 'Tempête de grêle', 'Vents paralysants', 'Marche des nuages', 'Contrôle du climat', 'Cyclone', 'Cyclone suprême'],
  },
  {
    nom: 'Communauté',
    pouvoir: 'Apaisement des émotions 1×/jour (pouvoir magique) ; +2 aux tests de Diplomatie. [Codex Divin]',
    sorts: ['Bénédiction', 'Rapport', 'Prière', 'Don des langues', 'Lien télépathique de Rary', 'Festin des héros', 'Refuge', 'Manoir somptueux de Mordenkainen', 'Guérison suprême de groupe'],
  },
  {
    nom: 'Compétition',
    pouvoir: '+1 à tous les tests opposés. [Codex Divin]',
    sorts: ['Regain d\'assurance', 'Zèle', 'Prière', 'Puissance divine', 'Force du colosse', 'Pacte du zélote', 'Régénération', 'Moment de prescience', 'Visage divin suprême'],
  },
  {
    nom: 'Convocation',
    pouvoir: 'Lance les sorts d\'Invocation (convocation/appel) avec +2 au niveau de lanceur. [Codex Divin]',
    sorts: ['Convocation de monstres I', 'Convocation de monstres II', 'Convocation de monstres III', 'Allié d\'outreplan', 'Convocation de monstres V', 'Allié majeur d\'outreplan', 'Convocation de monstres VII', 'Allié suprême d\'outreplan', 'Portail'],
  },
  {
    nom: 'Création',
    pouvoir: 'Lance les sorts d\'Invocation (création) avec +1 au niveau de lanceur. [Codex Divin]',
    sorts: ['Création d\'eau', 'Image imparfaite', 'Création de nourriture et d\'eau', 'Création mineure', 'Création majeure', 'Festin des héros', 'Image permanente', 'Création véritable', 'Pavillon de grandeur'],
  },
  {
    nom: 'Domination',
    pouvoir: 'Don École renforcée (Enchantement). [Codex Divin]',
    sorts: ['Injonction', 'Discours captivant', 'Suggestion', 'Domination', 'Injonction suprême', 'Quête', 'Suggestion de groupe', 'Domination véritable', 'Esclave monstrueux'],
  },
  {
    nom: 'Folie',
    pouvoir: '−1 aux tests de Sagesse et jets de Volonté ; 1×/jour, +niveau/2 à un test de Sagesse ou jet de Volonté (déclaré avant le jet). [Codex Divin]',
    sorts: ['Confusion mineure', 'Contact aliénant', 'Rage', 'Confusion', 'Rayons d\'ensorcellement', 'Assassin imaginaire', 'Aliénation mentale', 'Hurlement aliénant', 'Ennemi subconscient'],
  },
  {
    nom: 'Forces',
    pouvoir: '1×/jour, rejoue un jet de dégâts et garde le meilleur résultat. [Codex Divin]',
    sorts: ['Armure de mage', 'Projectile magique', 'Explosion de force', 'Sphère d\'isolement d\'Otiluke', 'Mur de force', 'Champ de force', 'Cage de force', 'Sphère téléguidée d\'Otiluke', 'Main broyeuse de Bigby'],
  },
  {
    nom: 'Froid',
    pouvoir: 'Renvoie/détruit les créatures du Feu, intimide/contrôle celles du Froid (3 + mod CHA fois/jour). [Codex Divin]',
    sorts: ['Contact glacial', 'Métal gelé', 'Tempête de neige', 'Tempête de grêle', 'Mur de glace', 'Cône de froid', 'Contrôle du climat', 'Rayon polaire', 'Avalanche vengeresse'],
  },
  {
    nom: 'Inquisition',
    pouvoir: '+4 aux tests de dissipation. [Codex Divin]',
    sorts: ['Détection du Chaos', 'Zone de vérité', 'Détection de pensées', 'Détection du mensonge', 'Vision lucide', 'Quête', 'Décret', 'Bouclier de la Loi', 'Emprisonnement'],
  },
  {
    nom: 'Libération',
    pouvoir: 'Rejoue 1 round plus tard un JS raté contre un effet de charme, coercition ou terreur. [Codex Divin]',
    sorts: ['Mauvais augure', 'Alignement indétectable', 'Rage', 'Liberté de mouvement', 'Annulation d\'enchantement', 'Dissipation suprême', 'Refuge', 'Esprit impénétrable', 'Rupture d\'entraves'],
  },
  {
    nom: 'Mysticisme',
    pouvoir: '1×/jour (action libre), bonus de chance aux jets de sauvegarde égal au mod de CHA pendant 1 round/niveau. [Codex Divin]',
    sorts: ['Faveur divine', 'Arme spirituelle', 'Visage divin mineur', 'Arme de la divinité', 'Force du colosse', 'Visage divin', 'Blasphème ou Parole sacrée (selon l\'alignement)', 'Aura sacrée ou Aura maudite (selon l\'alignement)', 'Visage divin suprême'],
  },
  {
    nom: 'Oracles',
    pouvoir: 'Lance les sorts de Divination avec +2 au niveau de lanceur. [Codex Divin]',
    sorts: ['Identification', 'Augure', 'Divination', 'Scrutation', 'Communion', 'Mythes et légendes', 'Scrutation suprême', 'Localisation suprême', 'Prémonition'],
  },
  {
    nom: 'Pactes',
    pouvoir: 'Estimation, Intimidation et Psychologie deviennent des compétences de classe. [Codex Divin]',
    sorts: ['Injonction', 'Protection d\'autrui', 'Communication avec les morts', 'Divination', 'Pacte de vigueur', 'Pacte du zélote', 'Pacte de regain', 'Pacte mortel', 'Portail'],
  },
  {
    nom: 'Pensée',
    pouvoir: '+2 aux tests de Bluff, Diplomatie et Psychologie. [Codex Divin]',
    sorts: ['Compréhension des langages', 'Détection de pensées', 'Lien télépathique mineur', 'Détection du mensonge', 'Lien télépathique de Rary', 'Exploration des pensées', 'Araignée mentale', 'Esprit impénétrable', 'Ennemi subconscient'],
  },
  {
    nom: 'Pestilence',
    pouvoir: 'Immunisé contre les maladies (peut être porteur sain). [Codex Divin]',
    sorts: ['Anathème', 'Nuée grouillante', 'Contagion', 'Empoisonnement', 'Horde de rats', 'Malédiction de la lycanthropie', 'Fléau', 'Création de mort-vivant dominant (momies)', 'Nuée d\'otyughs'],
  },
  {
    nom: 'Purification',
    pouvoir: 'Lance les sorts d\'Abjuration avec +1 au niveau de lanceur. [Codex Divin]',
    sorts: ['Auréole de lumière', 'Vengeance divine', 'Déclamation', 'Rudoiement', 'Brume de pureté', 'Feux purificateurs', 'Fureur vertueuse des fidèles', 'Explosion de lumière', 'Visage divin suprême'],
  },
  {
    nom: 'Rêves',
    pouvoir: 'Immunisé contre la terreur. [Codex Divin]',
    sorts: ['Sommeil', 'Augure', 'Sommeil profond', 'Assassin imaginaire', 'Cauchemar', 'Décorporation', 'Scrutation suprême', 'Mot de pouvoir étourdissant', 'Ennemi subconscient'],
  },
]

export function getDomaineInfo(nom: string): DomaineInfo | undefined {
  return DOMAINES_DND35.find(d => d.nom === nom)
}

export const NOMS_DOMAINES = DOMAINES_DND35.map(d => d.nom).sort()

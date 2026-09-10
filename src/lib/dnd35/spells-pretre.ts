import type { SortDnD } from './spells'

// ─────────────────────────────────────────────────────────────────────────────
// Sorts de prêtre du Manuel des Joueurs 3.5 (édition française)
//
// Relevés page par page dans le PDF du Manuel : la liste résumée du chapitre 10
// (p. 190 à 192) pour les noms, les niveaux et la description d'une ligne, et le
// chapitre 11 « Les sorts » (p. 196 à 303) pour l'école, les composantes, la
// portée et la durée. Le PDF n'a aucune couche texte : tout a été lu à l'image.
//
// Quand le résumé et le chapitre alphabétique divergent, c'est le chapitre qui
// fait foi (ex. « Blessure grave de groupe », et non « importante »).
//
// Ces entrées ne portent que le niveau du PRÊTRE. Plusieurs de ces sorts sont
// aussi accessibles au barde, au druide, au magicien, à l'ensorceleur, au
// paladin ou au rôdeur : ces niveaux-là restent à relever.
// ─────────────────────────────────────────────────────────────────────────────

export const SORTS_PRETRE_MDJ: SortDnD[] = [

  // ─── PRÊTRE, NIVEAU 0 ───
  { nom: 'Blessure superficielle', ecole: 'Nécromancie', niveaux: { Prêtre: 0 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Attaque de contact infligeant 1 point de dégâts à la cible.' },
  { nom: 'Purification de nourriture et d\'eau', ecole: 'Transmutation', niveaux: { Prêtre: 0, Druide: 0 }, composantes: 'V, G', portee: '3 m', duree: 'Instantané', description: 'Purifie 30 dm³/niveau de nourriture et d\'eau.' },

  // ─── PRÊTRE, NIVEAU 1 ───
  { nom: 'Imprécation', ecole: 'Enchantement', niveaux: { Prêtre: 1 }, composantes: 'V, G, FD', portee: '15 m', duree: '1 minute/niveau', description: 'Les adversaires subissent -1 à l\'attaque et aux jets de sauvegarde contre la terreur.' },
  { nom: 'Perception de la mort', ecole: 'Nécromancie', niveaux: { Prêtre: 1 }, composantes: 'V, G', portee: '9 m', duree: '10 minutes/niveau', description: 'Révèle l\'état de santé des créatures à 9 m à la ronde.' },
  { nom: 'Anathème', ecole: 'Nécromancie', niveaux: { Prêtre: 1 }, composantes: 'V, G, FD', portee: 'Moyenne', duree: '1 minute/niveau', description: 'Inflige un malus de -2 aux jets d\'attaque, jets de sauvegarde et tests.' },
  { nom: 'Arme magique', ecole: 'Transmutation', niveaux: { Prêtre: 1, Magicien: 1, Ensorceleur: 1, Paladin: 1 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 minute/niveau', description: 'Confère un bonus de +1 à une arme.' },
  { nom: 'Bénédiction de l\'eau', ecole: 'Transmutation', niveaux: { Prêtre: 1, Paladin: 1 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Instantané', description: 'Crée de l\'eau bénite.' },
  { nom: 'Blessure légère', ecole: 'Nécromancie', niveaux: { Prêtre: 1 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Inflige 1d8 points de dégâts, +1/niveau (max. +5).' },
  { nom: 'Bouclier entropique', ecole: 'Abjuration', niveaux: { Prêtre: 1 }, composantes: 'V, G', portee: 'Personnelle', duree: '1 minute/niveau (T)', description: 'Les attaques à distance ont 20 % de chances de rater le PJ.' },
  { nom: 'Convocation de monstres I', ecole: 'Invocation', niveaux: { Barde: 1, Prêtre: 1, Magicien: 1, Ensorceleur: 1 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une créature extraplanaire luttant pour le PJ.' },
  { nom: 'Détection du Bien', ecole: 'Divination', niveaux: { Prêtre: 1 }, composantes: 'V, G, FD', portee: '18 m', duree: 'Concentration, jusqu\'à 10 minutes/niveau (T)', description: 'Révèle l\'aura des créatures, sorts ou objets bons.' },
  { nom: 'Détection du Chaos', ecole: 'Divination', niveaux: { Prêtre: 1 }, composantes: 'V, G, FD', portee: '18 m', duree: 'Concentration, jusqu\'à 10 minutes/niveau (T)', description: 'Révèle l\'aura des créatures, sorts ou objets chaotiques.' },
  { nom: 'Détection de la Loi', ecole: 'Divination', niveaux: { Prêtre: 1 }, composantes: 'V, G, FD', portee: '18 m', duree: 'Concentration, jusqu\'à 10 minutes/niveau (T)', description: 'Révèle l\'aura des créatures, sorts ou objets loyaux.' },
  { nom: 'Détection des morts-vivants', ecole: 'Divination', niveaux: { Prêtre: 1, Magicien: 1, Ensorceleur: 1, Paladin: 1 }, composantes: 'V, G, M/FD', portee: '18 m', duree: 'Concentration, jusqu\'à 1 minute/niveau (T)', description: 'Révèle les morts-vivants à moins de 18 m.' },
  { nom: 'Endurance aux énergies destructives', ecole: 'Abjuration', niveaux: { Prêtre: 1, Magicien: 1, Ensorceleur: 1, Paladin: 1, Rôdeur: 1, Druide: 1 }, composantes: 'V, G', portee: 'Contact', duree: '24 heures', description: 'Protège des environnements chauds ou froids.' },
  { nom: 'Invisibilité pour les morts-vivants', ecole: 'Abjuration', niveaux: { Prêtre: 1 }, composantes: 'V, G, FD', portee: 'Contact', duree: '10 minutes/niveau (T)', description: 'Les morts-vivants ne voient pas les sujets (1/niveau).' },
  { nom: 'Malédiction de l\'eau', ecole: 'Nécromancie', niveaux: { Prêtre: 1 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Instantané', description: 'Crée de l\'eau maudite.' },
  { nom: 'Pierre magique', ecole: 'Transmutation', niveaux: { Prêtre: 1, Druide: 1 }, composantes: 'V, G, FD', portee: 'Contact', duree: '30 minutes ou jusqu\'à utilisation', description: '3 projectiles ; +1 à l\'attaque, 1d6+1 points de dégâts.' },
  { nom: 'Protection contre le Bien', ecole: 'Abjuration', niveaux: { Prêtre: 1, Magicien: 1, Ensorceleur: 1 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: '1 minute/niveau (T)', description: '+2 à la CA et aux jets de sauvegarde contre le Bien, empêche le contrôle mental, repousse les créatures convoquées bonnes.' },
  { nom: 'Protection contre le Chaos', ecole: 'Abjuration', niveaux: { Prêtre: 1, Magicien: 1, Ensorceleur: 1, Paladin: 1 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: '1 minute/niveau (T)', description: '+2 à la CA et aux jets de sauvegarde contre le Chaos, empêche le contrôle mental, repousse les créatures convoquées chaotiques.' },
  { nom: 'Protection contre la Loi', ecole: 'Abjuration', niveaux: { Prêtre: 1, Magicien: 1, Ensorceleur: 1 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: '1 minute/niveau (T)', description: '+2 à la CA et aux jets de sauvegarde contre la Loi, empêche le contrôle mental, repousse les créatures convoquées loyales.' },
  { nom: 'Regain d\'assurance', ecole: 'Abjuration', niveaux: { Barde: 1, Prêtre: 1 }, composantes: 'V, G', portee: 'Courte', duree: '10 minutes', description: '+4 aux jets de sauvegarde contre la terreur (1 sujet, +1/4 niveaux).' },

  // ─── PRÊTRE, NIVEAU 2 ───
  { nom: 'Alignement indétectable', ecole: 'Abjuration', niveaux: { Barde: 1, Prêtre: 2, Paladin: 2 }, composantes: 'V, G', portee: 'Courte', duree: '24 heures', description: 'Masque l\'alignement pendant 24 heures.' },
  { nom: 'Apaisement des émotions', ecole: 'Enchantement', niveaux: { Barde: 2, Prêtre: 2 }, composantes: 'V, G, FD', portee: 'Moyenne', duree: 'Concentration, jusqu\'à 1 round/niveau (T)', description: 'Calme des créatures.' },
  { nom: 'Arme alignée', ecole: 'Transmutation', niveaux: { Prêtre: 2 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 minute/niveau', description: 'Une arme devient bonne, chaotique, loyale ou mauvaise.' },
  { nom: 'Arme spirituelle', ecole: 'Évocation', niveaux: { Prêtre: 2 }, composantes: 'V, G, FD', portee: 'Moyenne', duree: '1 round/niveau (T)', description: 'Arme magique attaquant d\'elle-même.' },
  { nom: 'Augure', ecole: 'Divination', niveaux: { Prêtre: 2 }, composantes: 'V, G, M, F', portee: 'Personnelle', duree: 'Instantané', description: 'Révèle si une action aura de bonnes conséquences ou non.' },
  { nom: 'Blessure modérée', ecole: 'Nécromancie', niveaux: { Prêtre: 2 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Inflige 2d8 points de dégâts, +1/niveau (max. +10).' },
  { nom: 'Cacophonie', ecole: 'Évocation', niveaux: { Barde: 2, Prêtre: 2 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: 'Instantané', description: '1d8 points de dégâts de son, étourdissement possible.' },
  { nom: 'Consécration', ecole: 'Évocation', niveaux: { Prêtre: 2 }, composantes: 'V, G, M, FD', portee: 'Courte', duree: '2 heures/niveau', description: 'Affaiblit les morts-vivants au sein d\'une zone.' },
  { nom: 'Convocation de monstres II', ecole: 'Invocation', niveaux: { Barde: 2, Prêtre: 2, Magicien: 2, Ensorceleur: 2 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Délivrance de la paralysie', ecole: 'Invocation', niveaux: { Prêtre: 2, Paladin: 2 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Délivre de la paralysie, d\'immobilisation et de lenteur.' },
  { nom: 'Détection des pièges', ecole: 'Divination', niveaux: { Prêtre: 2 }, composantes: 'V, G', portee: 'Personnelle', duree: '1 minute/niveau', description: 'Le PJ repère les pièges comme un roublard.' },
  { nom: 'Discours captivant', ecole: 'Enchantement', niveaux: { Barde: 2, Prêtre: 2 }, composantes: 'V, G', portee: 'Moyenne', duree: 'Jusqu\'à 1 heure', description: 'Captive à 30 m (+ 3 m/niveau) à la ronde.' },
  { nom: 'Mise à mort', ecole: 'Nécromancie', niveaux: { Prêtre: 2 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané/10 minutes par DV', description: 'Achève une créature mourante ; le PJ gagne temporairement 1d8 pv, +2 en Force et +1 niveau.' },
  { nom: 'Préservation des morts', ecole: 'Nécromancie', niveaux: { Prêtre: 2, Magicien: 3, Ensorceleur: 3 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: '1 jour/niveau', description: 'Préserve un cadavre.' },
  { nom: 'Profanation', ecole: 'Évocation', niveaux: { Prêtre: 2 }, composantes: 'V, G, M, FD', portee: 'Courte', duree: '2 heures/niveau', description: 'Rend les morts-vivants plus forts au sein d\'une zone.' },
  { nom: 'Protection d\'autrui', ecole: 'Abjuration', niveaux: { Prêtre: 2, Paladin: 2 }, composantes: 'V, G, F', portee: 'Courte', duree: '1 heure/niveau (T)', description: 'Le PJ subit 1/2 dégâts à la place du sujet.' },
  { nom: 'Ralentissement du poison', ecole: 'Invocation', niveaux: { Barde: 2, Prêtre: 2, Paladin: 2, Rôdeur: 1, Druide: 2 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 heure/niveau', description: 'Neutralise le poison pendant 1 heure/niveau.' },
  { nom: 'Rapport', ecole: 'Divination', niveaux: { Prêtre: 2 }, composantes: 'V, G', portee: 'Contact', duree: '1 heure/niveau', description: 'Indique où se trouvent les alliés et quel est leur état.' },
  { nom: 'Réparation intégrale', ecole: 'Transmutation', niveaux: { Prêtre: 2 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Répare totalement un objet.' },
  { nom: 'Restauration partielle', ecole: 'Invocation', niveaux: { Prêtre: 2, Paladin: 1, Druide: 2 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Dissipe effets magiques affaiblissants ou rend 1d4 points de caractéristique perdus.' },
  { nom: 'Sagesse du hibou', ecole: 'Transmutation', niveaux: { Prêtre: 2, Magicien: 2, Ensorceleur: 2, Paladin: 2, Rôdeur: 2, Druide: 2 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: '1 minute/niveau', description: 'Confère +4 en Sag pendant 1 minute/niveau.' },
  { nom: 'Silence', ecole: 'Illusion', niveaux: { Barde: 2, Prêtre: 2 }, composantes: 'V, G', portee: 'Longue', duree: '1 minute/niveau (T)', description: 'Étouffe tout bruit dans un rayon de 4,50 m.' },
  { nom: 'Zone de vérité', ecole: 'Enchantement', niveaux: { Prêtre: 2, Paladin: 2 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 minute/niveau', description: 'Les créatures affectées ne peuvent pas mentir.' },

  // ─── PRÊTRE, NIVEAU 3 ───
  { nom: 'Animation des morts', ecole: 'Nécromancie', niveaux: { Prêtre: 3, Magicien: 4, Ensorceleur: 4 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Instantané', description: 'Crée squelettes et zombis morts-vivants.' },
  { nom: 'Blessure grave', ecole: 'Nécromancie', niveaux: { Prêtre: 3 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Inflige 3d8 pts de dégâts, +1/niveau (max. +15).' },
  { nom: 'Cécité/surdité', ecole: 'Nécromancie', niveaux: { Barde: 2, Prêtre: 3, Magicien: 2, Ensorceleur: 2 }, composantes: 'V', portee: 'Moyenne', duree: 'Permanente (T)', description: 'Rend la cible aveugle ou sourde.' },
  { nom: 'Cercle magique contre le Mal', ecole: 'Abjuration', niveaux: { Prêtre: 3, Magicien: 3, Ensorceleur: 3, Paladin: 3 }, composantes: 'V, G, M/FD', portee: 'Contact (émanation 3 m)', duree: '10 minutes/niveau', description: 'Comme protection contre le Mal, mais sur un rayon de 3 m et pendant 10 minutes/niveau.' },
  { nom: 'Cercle magique contre le Bien', ecole: 'Abjuration', niveaux: { Prêtre: 3, Magicien: 3, Ensorceleur: 3 }, composantes: 'V, G, M/FD', portee: 'Contact (émanation 3 m)', duree: '10 minutes/niveau', description: 'Comme protection contre le Bien, mais sur un rayon de 3 m et pendant 10 minutes/niveau.' },
  { nom: 'Cercle magique contre le Chaos', ecole: 'Abjuration', niveaux: { Prêtre: 3, Magicien: 3, Ensorceleur: 3, Paladin: 3 }, composantes: 'V, G, M/FD', portee: 'Contact (émanation 3 m)', duree: '10 minutes/niveau', description: 'Comme protection contre le Chaos, mais sur un rayon de 3 m et pendant 10 minutes/niveau.' },
  { nom: 'Cercle magique contre la Loi', ecole: 'Abjuration', niveaux: { Prêtre: 3, Magicien: 3, Ensorceleur: 3 }, composantes: 'V, G, M/FD', portee: 'Contact (émanation 3 m)', duree: '10 minutes/niveau', description: 'Comme protection contre la Loi, mais sur un rayon de 3 m et pendant 10 minutes/niveau.' },
  { nom: 'Communication avec les morts', ecole: 'Nécromancie', niveaux: { Prêtre: 3 }, composantes: 'V, G, FD', portee: '3 m', duree: '1 minute/niveau', description: 'Un cadavre répond à 1 question/2 niveaux.' },
  { nom: 'Contagion', ecole: 'Nécromancie', niveaux: { Prêtre: 3, Magicien: 4, Ensorceleur: 4, Druide: 3 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Infecte la cible.' },
  { nom: 'Convocation de monstres III', ecole: 'Invocation', niveaux: { Barde: 3, Prêtre: 3, Magicien: 3, Ensorceleur: 3 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Création de nourriture et d\'eau', ecole: 'Invocation', niveaux: { Prêtre: 3 }, composantes: 'V, G', portee: 'Courte', duree: '24 heures', description: 'Nourrit 3 humains ou 1 cheval/niveau.' },
  { nom: 'Dissimulation d\'objet', ecole: 'Abjuration', niveaux: { Barde: 1, Prêtre: 3, Magicien: 2, Ensorceleur: 2 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: '8 heures (T)', description: 'Dissimule un objet à la scrutation.' },
  { nom: 'Façonnage de la pierre', ecole: 'Transmutation', niveaux: { Prêtre: 3, Magicien: 4, Ensorceleur: 4, Druide: 3 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: 'Instantané', description: 'Permet de modeler la pierre.' },
  { nom: 'Flamme éternelle', ecole: 'Évocation', niveaux: { Prêtre: 3, Magicien: 2, Ensorceleur: 2 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Permanente', description: 'Torche permanente ne dégageant aucune chaleur.' },
  { nom: 'Fusion dans la pierre', ecole: 'Transmutation', niveaux: { Prêtre: 3, Druide: 3 }, composantes: 'V, G, FD', portee: 'Personnelle', duree: '10 minutes/niveau', description: 'Permet d\'entrer dans la pierre.' },
  { nom: 'Glyphe de garde', ecole: 'Abjuration', niveaux: { Prêtre: 3 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Permanente jusqu\'au déclenchement (T)', description: 'Inscription affectant ceux qui la touchent.' },
  { nom: 'Guérison de la cécité/surdité', ecole: 'Invocation', niveaux: { Prêtre: 3, Paladin: 3 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Soigne la cécité ou la surdité.' },
  { nom: 'Guérison des maladies', ecole: 'Invocation', niveaux: { Prêtre: 3, Rôdeur: 3, Druide: 3 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Guérit tous les maux du sujet.' },
  { nom: 'Localisation d\'objet', ecole: 'Divination', niveaux: { Barde: 2, Prêtre: 3, Magicien: 2, Ensorceleur: 2 }, composantes: 'V, G, F/FD', portee: 'Longue', duree: '1 minute/niveau', description: 'Indique la direction de l\'objet cherché.' },
  { nom: 'Lumière brûlante', ecole: 'Évocation', niveaux: { Prêtre: 3 }, composantes: 'V, G', portee: 'Moyenne', duree: 'Instantané', description: '1d8 points de dégâts/2 niveaux ; plus contre les morts-vivants.' },
  { nom: 'Main du berger', ecole: 'Évocation', niveaux: { Prêtre: 3 }, composantes: 'V, G, FD', portee: '7,5 km', duree: '1 heure/niveau', description: 'Guide le sujet jusqu\'au PJ.' },
  { nom: 'Marche sur l\'onde', ecole: 'Transmutation', niveaux: { Prêtre: 3, Rôdeur: 3 }, composantes: 'V, G, FD', portee: 'Contact', duree: '10 minutes/niveau (T)', description: 'Permet de marcher sur l\'eau.' },
  { nom: 'Mur de vent', ecole: 'Évocation', niveaux: { Prêtre: 3, Magicien: 3, Ensorceleur: 3, Rôdeur: 2, Druide: 3 }, composantes: 'V, G, M/FD', portee: 'Moyenne', duree: '1 round/niveau', description: 'Détourne projectiles, gaz et créatures de taille modeste.' },
  { nom: 'Négation de l\'invisibilité', ecole: 'Évocation', niveaux: { Prêtre: 3 }, composantes: 'V, G', portee: 'Personnelle', duree: '1 minute/niveau (T)', description: 'Dissipe l\'invisibilité sur 1,50 m/niveau.' },
  { nom: 'Panoplie magique', ecole: 'Transmutation', niveaux: { Prêtre: 3 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 heure/niveau', description: 'Armure ou bouclier gagne un bonus d\'altération de +1/4 niveaux.' },
  { nom: 'Ténèbres profondes', ecole: 'Évocation', niveaux: { Prêtre: 3 }, composantes: 'V, M/FD', portee: 'Contact', duree: '1 jour/niveau (T)', description: 'Ténèbres surnaturelles sur 18 m de rayon.' },

  // ─── PRÊTRE, NIVEAU 4 ───
  { nom: 'Allié d\'outreplan', ecole: 'Invocation', niveaux: { Prêtre: 4 }, composantes: 'V, G, FD, PX', portee: 'Courte', duree: 'Instantané', description: 'Échange de services avec une créature extraplanaire à 6 DV.' },
  { nom: 'Ancre dimensionnelle', ecole: 'Abjuration', niveaux: { Prêtre: 4, Magicien: 4, Ensorceleur: 4 }, composantes: 'V, G', portee: 'Moyenne', duree: '1 minute/niveau', description: 'Empêche tout déplacement extradimensionnel.' },
  { nom: 'Arme magique suprême', ecole: 'Transmutation', niveaux: { Prêtre: 4, Magicien: 3, Ensorceleur: 3, Paladin: 3 }, composantes: 'V, G, M/FD', portee: 'Courte', duree: '1 heure/niveau', description: 'Confère un bonus de +1/4 niveaux à une arme (max. +5).' },
  { nom: 'Blessure critique', ecole: 'Nécromancie', niveaux: { Prêtre: 4 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Inflige 4d8 pts de dégâts, +1/niveau (max. +20).' },
  { nom: 'Communication à distance', ecole: 'Évocation', niveaux: { Prêtre: 4, Magicien: 5, Ensorceleur: 5 }, composantes: 'V, G, M/FD', portee: 'Voir description', duree: '1 round', description: 'Envoie un message quelle que soit la distance.' },
  { nom: 'Contrôle de l\'eau', ecole: 'Transmutation', niveaux: { Prêtre: 4, Magicien: 6, Ensorceleur: 6, Druide: 4 }, composantes: 'V, G, M/FD', portee: 'Longue', duree: '10 minutes/niveau (T)', description: 'Abaisse ou élève le niveau de l\'eau.' },
  { nom: 'Convocation de monstres IV', ecole: 'Invocation', niveaux: { Barde: 4, Prêtre: 4, Magicien: 4, Ensorceleur: 4 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Détection du mensonge', ecole: 'Divination', niveaux: { Prêtre: 4, Paladin: 3 }, composantes: 'V, G, FD', portee: 'Courte', duree: 'Concentration, jusqu\'à 1 round/niveau (T)', description: 'Révèle les mensonges délibérés.' },
  { nom: 'Divination', ecole: 'Divination', niveaux: { Prêtre: 4 }, composantes: 'V, G, M', portee: 'Personnelle', duree: 'Instantané', description: 'Donne des conseils en rapport avec une action envisagée.' },
  { nom: 'Don des langues', ecole: 'Divination', niveaux: { Barde: 2, Prêtre: 4, Magicien: 3, Ensorceleur: 3 }, composantes: 'V, G, M/FD', portee: 'Contact', duree: '10 minutes/niveau', description: 'Permet de parler toutes les langues.' },
  { nom: 'Empoisonnement', ecole: 'Nécromancie', niveaux: { Prêtre: 4, Druide: 3 }, composantes: 'V, G, FD', portee: 'Contact', duree: 'Instantané', description: 'Le sujet perd 1d10 points de Con, idem 1 minute plus tard.' },
  { nom: 'Immunité contre les sorts', ecole: 'Abjuration', niveaux: { Prêtre: 4 }, composantes: 'V, G, FD', portee: 'Contact', duree: '10 minutes/niveau', description: 'Immunise le sujet contre 1 sort/4 niveaux.' },
  { nom: 'Marche dans les airs', ecole: 'Transmutation', niveaux: { Prêtre: 4, Druide: 4 }, composantes: 'V, G, FD', portee: 'Contact', duree: '10 minutes/niveau', description: 'Le sujet marche dans les airs comme sur la terre ferme.' },
  { nom: 'Protection contre la mort', ecole: 'Nécromancie', niveaux: { Prêtre: 4, Paladin: 4, Druide: 5 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 minute/niveau', description: 'Protège contre les sorts de mort.' },
  { nom: 'Puissance divine', ecole: 'Évocation', niveaux: { Prêtre: 4 }, composantes: 'V, G, FD', portee: 'Personnelle', duree: '1 round/niveau', description: 'Bonus à l\'attaque, +6 en For et +1 pv/niveau.' },
  { nom: 'Renvoi', ecole: 'Abjuration', niveaux: { Prêtre: 4, Magicien: 5, Ensorceleur: 5 }, composantes: 'V, G, FD', portee: 'Courte', duree: 'Instantané', description: 'Force une créature à repartir dans son plan d\'origine.' },
  { nom: 'Répulsif', ecole: 'Abjuration', niveaux: { Barde: 4, Prêtre: 4, Rôdeur: 3, Druide: 4 }, composantes: 'V, G, FD', portee: '3 m', duree: '10 minutes/niveau', description: 'Les insectes, araignées et autres vermines restent à 3 m du PJ.' },
  { nom: 'Restauration', ecole: 'Invocation', niveaux: { Prêtre: 4, Paladin: 4 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Instantané', description: 'Rend niveau et points de caractéristique perdus.' },
  { nom: 'Transfert de sorts', ecole: 'Évocation', niveaux: { Prêtre: 4 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 heure/niveau ou jusqu\'à utilisation (T)', description: 'Transfère des sorts du PJ au sujet.' },
  { nom: 'Vermine géante', ecole: 'Transmutation', niveaux: { Prêtre: 4, Druide: 4 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 minute/niveau', description: 'Transforme les insectes en vermine géante.' },

  // ─── PRÊTRE, NIVEAU 5 ───
  { nom: 'Annulation d\'enchantement', ecole: 'Abjuration', niveaux: { Barde: 4, Prêtre: 5, Magicien: 5, Ensorceleur: 5, Paladin: 4 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Libère la cible des enchantements, des altérations, des malédictions et de la pétrification.' },
  { nom: 'Arme destructrice', ecole: 'Transmutation', niveaux: { Prêtre: 5 }, composantes: 'V, G', portee: 'Contact', duree: '1 round/niveau', description: 'Une arme de corps à corps détruit les morts-vivants.' },
  { nom: 'Blessure légère de groupe', ecole: 'Nécromancie', niveaux: { Prêtre: 5 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Inflige 1d8 points de dégâts à de nombreuses créatures, +1/niveau.' },
  { nom: 'Changement de plan', ecole: 'Invocation', niveaux: { Prêtre: 5, Magicien: 7, Ensorceleur: 7 }, composantes: 'V, G, F', portee: 'Contact', duree: 'Instantané', description: 'Permet de changer de plan (8 sujets max.).' },
  { nom: 'Convocation de monstres V', ecole: 'Invocation', niveaux: { Barde: 5, Prêtre: 5, Magicien: 5, Ensorceleur: 5 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Exécution', ecole: 'Nécromancie', niveaux: { Prêtre: 5 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Attaque de contact tuant la cible.' },
  { nom: 'Force du colosse', ecole: 'Transmutation', niveaux: { Prêtre: 5 }, composantes: 'V, G, FD', portee: 'Personnelle', duree: '1 round/niveau (T)', description: 'Accroît la taille du PJ et lui confère des bonus au combat.' },
  { nom: 'Marque de la justice', ecole: 'Nécromancie', niveaux: { Prêtre: 5, Paladin: 4 }, composantes: 'V, G, FD', portee: 'Contact', duree: 'Permanente', description: 'Définit une condition maudissant la cible.' },
  { nom: 'Mur de pierre', ecole: 'Invocation', niveaux: { Prêtre: 5, Magicien: 5, Ensorceleur: 5, Druide: 6 }, composantes: 'V, G, M/FD', portee: 'Moyenne', duree: 'Instantané', description: 'Crée un mur qui peut être façonné.' },
  { nom: 'Pénitence', ecole: 'Abjuration', niveaux: { Prêtre: 5, Druide: 5 }, composantes: 'V, G, M, F, FD, PX', portee: 'Contact', duree: 'Instantané', description: 'Permet au sujet d\'expier ses fautes.' },
  { nom: 'Rejet du Mal', ecole: 'Abjuration', niveaux: { Prêtre: 5, Paladin: 4 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 round/niveau ou jusqu\'à épuisement', description: 'Bonus de parade de +4 contre les attaques des créatures mauvaises ; permet de chasser une créature mauvaise extraplanaire.' },
  { nom: 'Rejet du Bien', ecole: 'Abjuration', niveaux: { Prêtre: 5 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 round/niveau ou jusqu\'à épuisement', description: 'Bonus de parade de +4 contre les attaques des créatures bonnes ; permet de chasser une créature bonne extraplanaire.' },
  { nom: 'Rejet du Chaos', ecole: 'Abjuration', niveaux: { Prêtre: 5, Paladin: 4 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 round/niveau ou jusqu\'à épuisement', description: 'Bonus de parade de +4 contre les attaques des créatures chaotiques ; permet de chasser une créature chaotique extraplanaire.' },
  { nom: 'Rejet de la Loi', ecole: 'Abjuration', niveaux: { Prêtre: 5 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 round/niveau ou jusqu\'à épuisement', description: 'Bonus de parade de +4 contre les attaques des créatures loyales ; permet de chasser une créature loyale extraplanaire.' },
  { nom: 'Résistance à la magie', ecole: 'Abjuration', niveaux: { Prêtre: 5 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 minute/niveau', description: 'Le sujet gagne une RM de 12, +1/niveau.' },
  { nom: 'Sanctification', ecole: 'Évocation', niveaux: { Prêtre: 5, Druide: 5 }, composantes: 'V, G, M, FD', portee: 'Contact', duree: 'Instantané', description: 'Rend un site sacré.' },
  { nom: 'Sanctification maléfique', ecole: 'Évocation', niveaux: { Prêtre: 5, Druide: 5 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Instantané', description: 'Rend un site maudit.' },
  { nom: 'Symbole de douleur', ecole: 'Nécromancie', niveaux: { Prêtre: 5, Magicien: 5, Ensorceleur: 5 }, composantes: 'V, G, M', portee: '0 m', duree: 'Voir description', description: 'La rune inflige de terribles douleurs.' },
  { nom: 'Symbole de sommeil', ecole: 'Enchantement', niveaux: { Prêtre: 5, Magicien: 5, Ensorceleur: 5 }, composantes: 'V, G, M', portee: '0 m', duree: 'Voir description', description: 'La rune plonge les créatures proches dans un sommeil catatonique.' },
  { nom: 'Vision lucide', ecole: 'Divination', niveaux: { Prêtre: 5, Magicien: 6, Ensorceleur: 6, Druide: 7 }, composantes: 'V, G, M', portee: 'Contact', duree: '1 minute/niveau', description: 'Permet de voir les choses telles qu\'elles sont.' },

  // ─── PRÊTRE, NIVEAU 6 ───
  { nom: 'Allié majeur d\'outreplan', ecole: 'Invocation', niveaux: { Prêtre: 6 }, composantes: 'V, G, FD, PX', portee: 'Courte', duree: 'Instantané', description: 'Comme allié d\'outreplan, mais jusqu\'à 12 DV.' },
  { nom: 'Animation d\'objets', ecole: 'Transmutation', niveaux: { Barde: 6, Prêtre: 6 }, composantes: 'V, G', portee: 'Moyenne', duree: '1 round/niveau', description: 'Les objets attaquent les adversaires du PJ.' },
  { nom: 'Bannissement', ecole: 'Abjuration', niveaux: { Prêtre: 6, Magicien: 7, Ensorceleur: 7 }, composantes: 'V, G, F', portee: 'Courte', duree: 'Instantané', description: 'Bannit pour 2 DV/niveau de créatures extraplanaires.' },
  { nom: 'Blessure modérée de groupe', ecole: 'Nécromancie', niveaux: { Prêtre: 6 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Inflige 2d8 points de dégâts à de nombreuses créatures, +1/niveau.' },
  { nom: 'Convocation de monstres VI', ecole: 'Invocation', niveaux: { Barde: 6, Prêtre: 6, Magicien: 6, Ensorceleur: 6 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Coquille antivie', ecole: 'Abjuration', niveaux: { Prêtre: 6, Druide: 6 }, composantes: 'V, G, FD', portee: '3 m', duree: '10 minutes/niveau (T)', description: 'Tient les créatures vivantes à distance (3 m).' },
  { nom: 'Création de mort-vivant', ecole: 'Nécromancie', niveaux: { Prêtre: 6, Magicien: 6, Ensorceleur: 6 }, composantes: 'V, G, M', portee: 'Courte', duree: 'Instantané', description: 'Goule, blême, momie ou mohrg.' },
  { nom: 'Dissipation suprême', ecole: 'Abjuration', niveaux: { Barde: 5, Prêtre: 6, Magicien: 6, Ensorceleur: 6, Druide: 6 }, composantes: 'V, G', portee: 'Moyenne', duree: 'Instantané', description: 'Comme dissipation de la magie, mais jusqu\'à +20.' },
  { nom: 'Endurance de l\'ours de groupe', ecole: 'Transmutation', niveaux: { Prêtre: 6, Magicien: 6, Ensorceleur: 6, Druide: 6 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 minute/niveau', description: 'Comme endurance de l\'ours, mais affecte 1 sujet/niveau.' },
  { nom: 'Force de taureau de groupe', ecole: 'Transmutation', niveaux: { Prêtre: 6, Magicien: 6, Ensorceleur: 6, Druide: 6 }, composantes: 'V, G, M/FD', portee: 'Courte', duree: '1 minute/niveau', description: 'Comme force de taureau, mais affecte 1 sujet/niveau.' },
  { nom: 'Glyphe de garde suprême', ecole: 'Abjuration', niveaux: { Prêtre: 6 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Permanente jusqu\'au déclenchement (T)', description: 'Comme glyphe de garde, mais avec un sort du 6e niveau ou des dégâts de 10d8 max.' },
  { nom: 'Interdiction', ecole: 'Abjuration', niveaux: { Prêtre: 6 }, composantes: 'V, G, M, FD', portee: 'Moyenne', duree: 'Permanente', description: 'Bloque les déplacements planaires, blesse les créatures d\'un alignement différent.' },
  { nom: 'Sagesse du hibou de groupe', ecole: 'Transmutation', niveaux: { Prêtre: 6, Magicien: 6, Ensorceleur: 6, Druide: 6 }, composantes: 'V, G, M/FD', portee: 'Courte', duree: '1 minute/niveau', description: 'Comme sagesse du hibou, mais affecte 1 sujet/niveau.' },
  { nom: 'Soins modérés de groupe', ecole: 'Invocation', niveaux: { Barde: 6, Prêtre: 6, Druide: 7 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Rend 2d8 pv à de nombreuses créatures, +1/niveau.' },
  { nom: 'Splendeur de l\'aigle de groupe', ecole: 'Transmutation', niveaux: { Barde: 6, Prêtre: 6, Magicien: 6, Ensorceleur: 6 }, composantes: 'V, G, M/FD', portee: 'Courte', duree: '1 minute/niveau', description: 'Comme splendeur de l\'aigle, mais affecte 1 sujet/niveau.' },
  { nom: 'Symbole de terreur', ecole: 'Nécromancie', niveaux: { Prêtre: 6, Magicien: 6, Ensorceleur: 6 }, composantes: 'V, G, M', portee: '0 m', duree: 'Voir description', description: 'La rune frappe les créatures proches de panique.' },
  { nom: 'Symbole de persuasion', ecole: 'Enchantement', niveaux: { Prêtre: 6, Magicien: 6, Ensorceleur: 6 }, composantes: 'V, G, M', portee: '0 m', duree: 'Voir description', description: 'La rune charme les créatures proches.' },
  { nom: 'Vent divin', ecole: 'Transmutation', niveaux: { Prêtre: 6, Druide: 7 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 heure/niveau (T)', description: 'Transforme les cibles en vapeur et les emporte rapidement.' },

  // ─── PRÊTRE, NIVEAU 7 ───
  { nom: 'Résurrection', ecole: 'Invocation', niveaux: { Prêtre: 7 }, composantes: 'V, G, M, FD', portee: 'Contact', duree: 'Instantané', description: 'Ramène un mort à la vie.' },
  { nom: 'Blasphème', ecole: 'Évocation', niveaux: { Prêtre: 7 }, composantes: 'V', portee: '9 m', duree: 'Instantané', description: 'Tue, paralyse, affaiblit ou hébète les cibles non mauvaises.' },
  { nom: 'Blessure grave de groupe', ecole: 'Nécromancie', niveaux: { Prêtre: 7 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Inflige 3d8 points de dégâts à de nombreuses créatures, +1/niveau.' },
  { nom: 'Champ de force', ecole: 'Abjuration', niveaux: { Prêtre: 7, Magicien: 6, Ensorceleur: 6 }, composantes: 'V, G, F/FD', portee: 'Jusqu\'à 3 m/niveau', duree: '1 round/niveau (T)', description: 'Nul ne peut approcher du PJ.' },
  { nom: 'Convocation de monstres VII', ecole: 'Invocation', niveaux: { Prêtre: 7, Magicien: 7, Ensorceleur: 7 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Décret', ecole: 'Évocation', niveaux: { Prêtre: 7 }, composantes: 'V', portee: '12 m', duree: 'Instantané', description: 'Tue, paralyse, ralentit ou assourdit les cibles non loyales.' },
  { nom: 'Destruction', ecole: 'Nécromancie', niveaux: { Prêtre: 7 }, composantes: 'V, G, F', portee: 'Courte', duree: 'Instantané', description: 'Tue la cible et détruit son corps.' },
  { nom: 'Forme éthérée', ecole: 'Transmutation', niveaux: { Prêtre: 7, Magicien: 7, Ensorceleur: 7 }, composantes: 'V, G', portee: 'Personnelle', duree: '1 round/niveau (T)', description: 'Le PJ passe dans le plan Éthéré pour 1 round/niveau.' },
  { nom: 'Parole du Chaos', ecole: 'Évocation', niveaux: { Prêtre: 7 }, composantes: 'V', portee: '12 m', duree: 'Instantané', description: 'Tue, cause la confusion, étourdit ou assourdit les cibles non chaotiques.' },
  { nom: 'Parole sacrée', ecole: 'Évocation', niveaux: { Prêtre: 7 }, composantes: 'V', portee: '12 m', duree: 'Instantané', description: 'Tue, paralyse, aveugle ou assourdit les cibles non bonnes.' },
  { nom: 'Refuge', ecole: 'Transmutation', niveaux: { Prêtre: 7, Magicien: 9, Ensorceleur: 9 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Permanente jusqu\'à utilisation', description: 'Enchante un objet pour ramener son possesseur jusqu\'au PJ.' },
  { nom: 'Restauration suprême', ecole: 'Invocation', niveaux: { Prêtre: 7 }, composantes: 'V, G, PX', portee: 'Contact', duree: 'Instantané', description: 'Comme restauration, mais rend tous les niveaux et points de caractéristique perdus.' },
  { nom: 'Scrutation suprême', ecole: 'Divination', niveaux: { Barde: 6, Prêtre: 7, Magicien: 7, Ensorceleur: 7, Druide: 7 }, composantes: 'V, G', portee: 'Voir description', duree: '1 heure/niveau', description: 'Comme scrutation, mais plus rapidement et plus longtemps.' },
  { nom: 'Soins importants de groupe', ecole: 'Invocation', niveaux: { Prêtre: 7, Druide: 8 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Rend 3d8 pv à de nombreuses créatures, +1/niveau.' },
  { nom: 'Symbole d\'étourdissement', ecole: 'Enchantement', niveaux: { Prêtre: 7, Magicien: 7, Ensorceleur: 7 }, composantes: 'V, G, M', portee: '0 m', duree: 'Voir description', description: 'La rune étourdit les créatures proches.' },
  { nom: 'Symbole de faiblesse', ecole: 'Nécromancie', niveaux: { Prêtre: 7, Magicien: 7, Ensorceleur: 7 }, composantes: 'V, G, M', portee: '0 m', duree: 'Voir description', description: 'La rune affaiblit les créatures proches.' },

  // ─── PRÊTRE, NIVEAU 8 ───
  { nom: 'Allié suprême d\'outreplan', ecole: 'Invocation', niveaux: { Prêtre: 8 }, composantes: 'V, G, FD, PX', portee: 'Courte', duree: 'Instantané', description: 'Comme allié d\'outreplan, mais jusqu\'à 18 DV.' },
  { nom: 'Aura maudite', ecole: 'Abjuration', niveaux: { Prêtre: 8 }, composantes: 'V, G, F', portee: '6 m', duree: '1 round/niveau (T)', description: '+4 à la CA, bonus de résistance de +4 et RM de 25 contre les sorts du Bien.' },
  { nom: 'Aura sacrée', ecole: 'Abjuration', niveaux: { Prêtre: 8 }, composantes: 'V, G, F', portee: '6 m', duree: '1 round/niveau (T)', description: '+4 à la CA, bonus de résistance de +4 et RM de 25 contre les sorts du Mal.' },
  { nom: 'Blessure critique de groupe', ecole: 'Nécromancie', niveaux: { Prêtre: 8 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Inflige 4d8 points de dégâts à de nombreuses créatures, +1/niveau.' },
  { nom: 'Bouclier de la Loi', ecole: 'Abjuration', niveaux: { Prêtre: 8 }, composantes: 'V, G, F', portee: '6 m', duree: '1 round/niveau (T)', description: '+4 à la CA, bonus de résistance de +4 et RM de 25 contre les sorts des créatures du Chaos.' },
  { nom: 'Convocation de monstres VIII', ecole: 'Invocation', niveaux: { Prêtre: 8, Magicien: 8, Ensorceleur: 8 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Création de mort-vivant dominant', ecole: 'Nécromancie', niveaux: { Prêtre: 8, Magicien: 8, Ensorceleur: 8 }, composantes: 'V, G, M', portee: 'Courte', duree: 'Instantané', description: 'Ombre, âme-en-peine, spectre ou dévoreur.' },
  { nom: 'Immunité contre les sorts suprême', ecole: 'Abjuration', niveaux: { Prêtre: 8 }, composantes: 'V, G, FD', portee: 'Contact', duree: '10 minutes/niveau', description: 'Comme immunité contre les sorts, mais jusqu\'au 8e niveau.' },
  { nom: 'Localisation suprême', ecole: 'Divination', niveaux: { Prêtre: 8, Magicien: 8, Ensorceleur: 8 }, composantes: 'V, G, FD', portee: 'Illimitée', duree: 'Instantané', description: 'Localise précisément une créature ou un objet.' },
  { nom: 'Manteau du Chaos', ecole: 'Abjuration', niveaux: { Prêtre: 8 }, composantes: 'V, G, F', portee: '6 m', duree: '1 round/niveau (T)', description: '+4 à la CA, bonus de résistance de +4 et RM de 25 contre les sorts de la Loi.' },
  // Le Manuel nomme ce sort des deux façons : « Soins critiques de groupe » au résumé (p.192)
  // et au domaine de la Guérison (p.194), « Soins intensifs de groupe » au chapitre (p.289).
  // Les deux noms sont gardés pour que le domaine retrouve sa définition.
  { nom: 'Soins intensifs de groupe', ecole: 'Invocation', niveaux: { Prêtre: 8, Druide: 9 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Rend 4d8 pv à de nombreuses créatures, +1/niveau.' },
  { nom: 'Soins critiques de groupe', ecole: 'Invocation', niveaux: { Prêtre: 8 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Rend 4d8 pv à de nombreuses créatures, +1/niveau.' },
  { nom: 'Symbole d\'aliénation mentale', ecole: 'Enchantement', niveaux: { Prêtre: 8, Magicien: 8, Ensorceleur: 8 }, composantes: 'V, G, M', portee: '0 m', duree: 'Voir description', description: 'La rune frappe les créatures proches de démence.' },
  { nom: 'Tempête de feu', ecole: 'Évocation', niveaux: { Prêtre: 8, Druide: 7 }, composantes: 'V, G', portee: 'Moyenne', duree: 'Instantané', description: 'Inflige 1d6 points de dégâts de feu/niveau.' },
  { nom: 'Verrou dimensionnel', ecole: 'Abjuration', niveaux: { Prêtre: 8, Magicien: 8, Ensorceleur: 8 }, composantes: 'V, G', portee: 'Moyenne', duree: '1 jour/niveau', description: 'Téléportation et voyages interplanaires bloqués pendant 1 jour/niveau.' },
  { nom: 'Zone d\'antimagie', ecole: 'Abjuration', niveaux: { Prêtre: 8, Magicien: 6, Ensorceleur: 6 }, composantes: 'V, G, M/FD', portee: '3 m', duree: '10 minutes/niveau (T)', description: 'Réprime toute magie à moins de 3 m.' },

  // ─── PRÊTRE, NIVEAU 9 ───
  { nom: 'Absorption d\'énergie', ecole: 'Nécromancie', niveaux: { Prêtre: 9, Magicien: 9, Ensorceleur: 9 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'La cible gagne 2d4 niveaux négatifs.' },
  { nom: 'Capture d\'âme', ecole: 'Nécromancie', niveaux: { Prêtre: 9, Magicien: 9, Ensorceleur: 9 }, composantes: 'V, G, F', portee: 'Courte', duree: 'Permanente', description: 'Retient l\'âme d\'un défunt pour empêcher sa résurrection.' },
  { nom: 'Convocation de monstres IX', ecole: 'Invocation', niveaux: { Prêtre: 9, Magicien: 9, Ensorceleur: 9 }, composantes: 'V, G, F/FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une ou plusieurs créatures extraplanaires luttant pour le PJ.' },
  { nom: 'Guérison suprême de groupe', ecole: 'Invocation', niveaux: { Prêtre: 9 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantané', description: 'Comme guérison suprême, mais sur plusieurs sujets.' },
  { nom: 'Implosion', ecole: 'Évocation', niveaux: { Prêtre: 9 }, composantes: 'V, G', portee: 'Courte', duree: 'Concentration (jusqu\'à 4 rounds)', description: 'Tue 1 créature/round.' },
  // Durée corrigée : le chapitre 11 (p. 269) imprime « 1 minute/niveau (T) ».
  // Le « 1 round/niveau » est celui de Forme éthérée, un sort voisin mais distinct.
  { nom: 'Passage dans l\'éther', ecole: 'Transmutation', niveaux: { Prêtre: 9, Magicien: 9, Ensorceleur: 9 }, composantes: 'V, G', portee: 'Contact (voir description)', duree: '1 minute/niveau (T)', description: 'Emmène plusieurs créatures dans le plan Éthéré.' },
  { nom: 'Projection astrale', ecole: 'Nécromancie', niveaux: { Prêtre: 9, Magicien: 9, Ensorceleur: 9 }, composantes: 'V, G, M', portee: 'Contact', duree: 'Voir description', description: 'Emmène le PJ et ses compagnons dans le plan Astral.' },
  { nom: 'Tempête vengeresse', ecole: 'Invocation', niveaux: { Prêtre: 9, Druide: 9 }, composantes: 'V, G', portee: 'Longue', duree: 'Concentration (jusqu\'à 10 rounds) (T)', description: 'Tempête mêlant acide, éclairs et grêlons.' },

  // ─── Sort du Manuel dont le nom était pris par un autre (voir Brume de dissimulation) ───
  { nom: 'Nappe de brouillard', ecole: 'Invocation', niveaux: { Magicien: 2, Ensorceleur: 2, Druide: 2 }, composantes: 'V, G', portee: 'Moyenne', duree: '10 minutes/niveau', description: 'Brouillard qui bloque la vue sur 9 m de rayon. À ne pas confondre avec brume de dissimulation (niveau 1).' },
]

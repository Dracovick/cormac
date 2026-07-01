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
]

export function getDomaineInfo(nom: string): DomaineInfo | undefined {
  return DOMAINES_DND35.find(d => d.nom === nom)
}

export const NOMS_DOMAINES = DOMAINES_DND35.map(d => d.nom).sort()

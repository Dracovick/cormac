import type { SortDnD } from './spells'

// ─────────────────────────────────────────────────────────────────────────────
// Sorts de druide du Manuel des Joueurs 3.5 (édition française)
//
// La liste du druide va du niveau 0 (oraisons) au niveau 9. C'est la septième
// et dernière classe de lanceur de sorts du Manuel à être relevée : après elle,
// le Grimoire porte les sept listes complètes (prêtre, ensorceleur/magicien,
// paladin, rôdeur, barde, druide).
//
// SOURCES LUES À L'IMAGE (le PDF du Manuel n'a aucune couche texte) :
//   • la liste résumée qui ouvre le chapitre 11, pages imprimées 183 et 184,
//     pour les noms, les niveaux et la description d'une ligne ;
//   • le corps alphabétique du chapitre 11 « Les sorts », pages imprimées 199,
//     200, 203, 204, 205, 211, 217, 218, 219, 220, 226, 233, 234, 235, 236,
//     239, 240, 241, 245, 246, 253, 258, 259, 260, 262, 263, 267, 269, 272,
//     278, 281, 285, 299 et 302, pour l'école, les composantes, la portée et
//     la durée de chaque sort créé ci-dessous.
// Le décalage de pagination a été recalé sur le folio 184 : page PDF = page
// imprimée + 1, comme pour les six listes précédentes.
//
// ARBITRAGES — quand le résumé et le corps alphabétique divergent, le corps
// fait foi (même règle que pour les six autres listes) :
//   • « Soins importants de groupe » — la liste résumée du niveau 8 l'OMET
//     purement et simplement (elle n'y aligne que 10 sorts). Le chapitre 11
//     (p. 289) lit « Niveau : Dru 8, Prê 7 » : le sort est donc bien un sort de
//     druide de niveau 8 et il a été rattaché comme tel. La liste du Manuel
//     compte donc 169 sorts et non 168.
//   • « Régénération » — le catalogue maison portait Druide 7. Le chapitre 11
//     (p. 281) lit « Niveau : Dru 9, Guérison 7, Prê 7 » : corrigé à 9.
//   • « Peau de pierre » — le catalogue maison portait Druide 6. La liste
//     résumée le range au niveau 5 du druide : corrigé à 5.
//   • « Passage sans trace » — la liste résumée écrit le pluriel (« sans
//     traces »), le corps alphabétique (p. 269) le singulier. Le mandat
//     paladin/rôdeur avait déjà tranché pour le singulier ; le sort existait
//     donc déjà et a seulement reçu son niveau Druide 1.
//
// RÉPARTITION relevée : 169 sorts — 13 au niveau 0, 20 au 1er, 26 au 2e,
// 22 au 3e, 17 au 4e, 19 au 5e, 18 au 6e, 13 au 7e, 11 au 8e, 10 au 9e.
//
// Ce fichier n'en contient que 43. Le druide partage énormément avec le prêtre
// et le rôdeur, tous deux déjà relevés : 126 des 169 sorts existaient déjà dans
// SORTS_BASE (spells.ts), SORTS_PRETRE_MDJ, SORTS_MAGICIEN_MDJ,
// SORTS_PALADIN_RODEUR_MDJ, SORTS_BARDE_MDJ ou SORTS_SUPPLEMENTS. Ils N'ONT PAS
// été recopiés ici : leur niveau Druide a été ajouté SUR PLACE, dans leur
// entrée d'origine. SORTS_DND35 est une concaténation brute, sans
// déduplication, et le nom d'un sort sert de clé de jointure (spell-effects.ts,
// domains.ts, generator.ts, table `spells` en base) : une seconde entrée du
// même nom casserait ces liens en silence.
//
// RÉSERVE DE LECTURE : le bloc abrégé d'« Appel de la tempête » (p. 200) ne
// répète pas sa ligne « Composantes » et renvoie à « appel de la foudre » ;
// c'est la ligne du sort parent qui a été reprise. Rien d'autre n'a été deviné.
//
// NON TRAITÉ (hors mandat, signalé pour André) : SORTS_BASE porte une quinzaine
// d'entrées anciennes qui sont des traductions littérales de sorts du Manuel
// déjà présents sous leur nom officiel — « Appel des foudres » à côté d'« Appel
// de la foudre », « Grâce du félin » à côté de « Grâce féline », « Soin des
// animaux », « Sens de la nature », « Transmutation de boue »… Ce sont des
// quasi-doublons sémantiques, pas des doublons de nom : ils ne cassent aucun
// lien et n'ont pas été touchés.
// ─────────────────────────────────────────────────────────────────────────────

export const SORTS_DRUIDE_MDJ: SortDnD[] = [
  // ─── DRUIDE, NIVEAU 1 ───
  { nom: 'Baie nourricière', ecole: 'Transmutation', niveaux: { Druide: 1 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 jour/niveau', description: '2d4 baies fraîchement cueillies deviennent magiques : chacune nourrit une créature de taille M comme un repas normal et rend 1 point de vie (8 points de vie au maximum par tranche de 24 heures). (p. 203)' },
  { nom: 'Flammes', ecole: 'Évocation [feu]', niveaux: { Druide: 1 }, composantes: 'V, G', portee: '0 m', duree: '1 minute/niveau (T)', description: 'Des flammes apparaissent dans la main du druide et infligent 1d6 points de dégâts de feu, +1 par niveau de lanceur de sorts (maximum +10). (p. 241)' },
  { nom: 'Gourdin magique', ecole: 'Transmutation', niveaux: { Druide: 1 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 minute/niveau', description: 'Un gourdin ou un bâton touché frappe comme une arme deux fois plus grande, avec un bonus d\'altération de +1 au jet d\'attaque. (p. 246)' },
  { nom: 'Lueur féerique', ecole: 'Évocation [lumière]', niveaux: { Druide: 1 }, composantes: 'V, G, FD', portee: 'Longue', duree: '1 minute/niveau (T)', description: 'Les créatures et objets de la zone sont nimbés d\'une lueur pâle qui les rend visibles même s\'ils sont invisibles ou camouflés. (p. 253)' },

  // ─── DRUIDE, NIVEAU 2 ───
  { nom: 'Distorsion du bois', ecole: 'Transmutation', niveaux: { Druide: 2 }, composantes: 'V, G', portee: 'Courte', duree: 'Instantanée', description: 'Tord définitivement 1 objet en bois de taille P par niveau : une porte se coince, une arme à distance devient inutilisable, une coque prend l\'eau. (p. 234)' },
  { nom: 'Façonnage du bois', ecole: 'Transmutation', niveaux: { Druide: 2 }, composantes: 'V, G, FD', portee: 'Contact', duree: 'Instantanée', description: 'Remodèle un objet en bois pour lui donner la forme voulue. (p. 240)' },
  { nom: 'Métal brûlant', ecole: 'Transmutation [feu]', niveaux: { Druide: 2 }, composantes: 'V, G, FD', portee: 'Courte', duree: '7 rounds', description: 'Chauffe le métal jusqu\'à le rendre brûlant : les porteurs subissent des dégâts de feu croissants puis décroissants sur 7 rounds. (p. 258)' },
  { nom: 'Métal gelé', ecole: 'Transmutation [froid]', niveaux: { Druide: 2 }, composantes: 'V, G, FD', portee: 'Courte', duree: '7 rounds', description: 'Refroidit le métal jusqu\'à le rendre glacial : les porteurs subissent des dégâts de froid croissants puis décroissants sur 7 rounds. (p. 258)' },
  { nom: 'Ramollissement de la terre et de la pierre', ecole: 'Transmutation [terre]', niveaux: { Druide: 2 }, composantes: 'V, G, FD', portee: 'Courte', duree: 'Instantanée', description: 'Ramollit la terre et la pierre à l\'état naturel dans un carré de 3 m de côté par niveau : la roche devient argile et la terre sèche, du sable. Sans effet sur la pierre travaillée. (p. 278)' },

  // ─── DRUIDE, NIVEAU 3 ───
  { nom: 'Appel de la foudre', ecole: 'Évocation [électricité]', niveaux: { Druide: 3 }, composantes: 'V, G', portee: 'Moyenne', duree: '1 minute/niveau', description: 'Appelle un éclair par niveau (maximum 5) infligeant 3d6 points de dégâts d\'électricité, ou 3d10 en extérieur par temps d\'orage. (p. 200)' },
  { nom: 'Domination d\'animal', ecole: 'Enchantement (coercition) [mental]', niveaux: { Druide: 3 }, composantes: 'V, G', portee: 'Courte', duree: '1 round/niveau', description: 'Envoûte un animal et l\'oblige à obéir à des ordres simples transmis par un lien télépathique. Les instructions suicidaires sont ignorées. (p. 235)' },
  { nom: 'Extinction des feux', ecole: 'Transmutation', niveaux: { Druide: 3 }, composantes: 'V, G, FD', portee: 'Moyenne', duree: 'Instantanée', description: 'Éteint tous les feux non magiques de la zone et met un terme aux sorts de feu de niveau égal ou inférieur. (p. 240)' },

  // ─── DRUIDE, NIVEAU 4 ───
  { nom: 'Coquille antiplantes', ecole: 'Abjuration', niveaux: { Druide: 4 }, composantes: 'V, G, FD', portee: '3 m', duree: '10 minutes/niveau (T)', description: 'Une barrière invisible de 3 m de rayon interdit l\'approche des créatures végétales. (p. 220)' },
  { nom: 'Pierres acérées', ecole: 'Transmutation [terre]', niveaux: { Druide: 4 }, composantes: 'V, G, FD', portee: 'Moyenne', duree: '1 heure/niveau (T)', description: 'Hérisse le sol de pointes de pierre : les créatures qui traversent la zone subissent des dégâts et voient leur vitesse réduite. (p. 272)' },
  { nom: 'Réincarnation', ecole: 'Transmutation', niveaux: { Druide: 4 }, composantes: 'V, G, M, FD', portee: 'Contact', duree: 'Instantanée', description: 'Ramène un mort à la vie, mais dans un nouveau corps déterminé aléatoirement. Le décès doit remonter à moins d\'une semaine. Le sujet perd un niveau. (p. 281)' },
  { nom: 'Rouille', ecole: 'Transmutation', niveaux: { Druide: 4 }, composantes: 'V, G, FD', portee: 'Contact', duree: 'Voir description', description: 'Le druide oxyde d\'un simple contact tout métal ferreux non magique. Contre une créature ferreuse : 3d6 points de dégâts, +1 par niveau (maximum +15). (p. 285)' },

  // ─── DRUIDE, NIVEAU 5 ───
  { nom: 'Appel de la tempête', ecole: 'Évocation [électricité]', niveaux: { Druide: 5 }, composantes: 'V, G', portee: 'Longue', duree: '1 minute/niveau', description: 'Version majeure d\'appel de la foudre : chaque éclair inflige 5d6 points de dégâts d\'électricité, ou 5d10 en extérieur par temps d\'orage. (p. 200)' },
  { nom: 'Contrôle des vents', ecole: 'Transmutation [air]', niveaux: { Druide: 5 }, composantes: 'V, G', portee: '12 m/niveau', duree: '10 minutes/niveau', description: 'Modifie la direction et la force du vent dans un vaste cylindre centré sur le druide. (p. 217)' },
  { nom: 'Convocation d\'alliés naturels V', ecole: 'Invocation (convocation)', niveaux: { Druide: 5 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une créature naturelle de la liste du 5e niveau, qui combat pour le druide. (p. 219)' },
  { nom: 'Éveil', ecole: 'Transmutation', niveaux: { Druide: 5 }, composantes: 'V, G, FD, PX', portee: 'Contact', duree: 'Instantanée', description: 'Confère l\'intelligence humaine à un animal ou à un arbre, qui devient une créature magique ou végétale. Coût : 250 PX. (p. 239)' },
  { nom: 'Mur d\'épines', ecole: 'Invocation (création)', niveaux: { Druide: 5 }, composantes: 'V, G', portee: 'Moyenne', duree: '10 minutes/niveau (T)', description: 'Fait surgir un mur de ronces enchevêtrées que les créatures ne peuvent traverser sans subir de lourds dégâts. (p. 263)' },

  // ─── DRUIDE, NIVEAU 6 ───
  { nom: 'Bâton à sort', ecole: 'Transmutation', niveaux: { Druide: 6 }, composantes: 'V, G, F', portee: 'Contact', duree: 'Permanente jusqu\'à utilisation (T)', description: 'Le druide emmagasine un de ses sorts dans un bâton en bois pour le libérer plus tard. (p. 204)' },
  { nom: 'Bois de fer', ecole: 'Transmutation', niveaux: { Druide: 6 }, composantes: 'V, G, M', portee: '0 m', duree: '1 jour/niveau (T)', description: 'Transforme du bois en bois de fer, aussi solide que l\'acier : armes et armures ainsi façonnées échappent aux interdits du druide. (p. 205)' },
  { nom: 'Chêne animé', ecole: 'Transmutation', niveaux: { Druide: 6 }, composantes: 'V, G', portee: 'Contact', duree: '1 jour/niveau (T)', description: 'Un chêne devient le gardien d\'un lieu : il s\'anime et attaque les intrus selon les instructions du druide. (p. 211)' },
  { nom: 'Convocation d\'alliés naturels VI', ecole: 'Invocation (convocation)', niveaux: { Druide: 6 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une créature naturelle de la liste du 6e niveau, qui combat pour le druide. (p. 219)' },
  { nom: 'Éloignement du bois', ecole: 'Transmutation', niveaux: { Druide: 6 }, composantes: 'V, G, M', portee: '18 m', duree: '1 minute/niveau (T)', description: 'Repousse tout objet en bois hors de la zone : lances, gourdins, portes et même les navires. (p. 236)' },
  { nom: 'Germes de feu', ecole: 'Invocation (création) [feu]', niveaux: { Druide: 6 }, composantes: 'V, G, M', portee: 'Contact', duree: '10 minutes/niveau ou jusqu\'à utilisation', description: 'Transforme des glands ou des baies en grenades incendiaires que l\'on lance sur ses adversaires. (p. 245)' },
  { nom: 'Pierres commères', ecole: 'Divination', niveaux: { Druide: 6 }, composantes: 'V, G, FD', portee: 'Personnelle', duree: '1 minute/niveau', description: 'La pierre raconte au druide tout ce qui s\'est passé à sa surface, à son contact ou devant elle. (p. 272)' },
  { nom: 'Voie végétale', ecole: 'Transmutation', niveaux: { Druide: 6 }, composantes: 'V, G', portee: 'Illimitée', duree: '1 round', description: 'Le druide s\'engouffre dans une plante de taille M ou plus et ressort par une autre plante de la même espèce, quelle que soit la distance. (p. 302)' },

  // ─── DRUIDE, NIVEAU 7 ───
  { nom: 'Animation des plantes', ecole: 'Transmutation', niveaux: { Druide: 7 }, composantes: 'V', portee: 'Courte', duree: '1 round/niveau ou 1 heure/niveau (voir description)', description: 'Anime une plante de taille G par tranche de 3 niveaux, qui attaque les cibles désignées — ou, au choix, enchevêtre les créatures de la zone. (p. 199)' },
  { nom: 'Bâton sylvanien', ecole: 'Transmutation', niveaux: { Druide: 7 }, composantes: 'V, G, F', portee: 'Contact', duree: '1 heure/niveau (T)', description: 'Transforme un bâton préparé en sylvanien qui combat pour le druide. (p. 204)' },
  { nom: 'Convocation d\'alliés naturels VII', ecole: 'Invocation (convocation)', niveaux: { Druide: 7 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une créature naturelle de la liste du 7e niveau, qui combat pour le druide. (p. 219)' },
  { nom: 'Mort rampante', ecole: 'Invocation (convocation)', niveaux: { Druide: 7 }, composantes: 'V, G', portee: 'Courte / 30 m (voir description)', duree: '1 minute/niveau', description: 'Appelle une masse grouillante de mille-pattes venimeux — une nuée par tranche de 2 niveaux, jusqu\'à dix. (p. 262)' },
  { nom: 'Rayon de soleil', ecole: 'Évocation [lumière]', niveaux: { Druide: 7 }, composantes: 'V, G, FD', portee: '18 m', duree: '1 round/niveau ou jusqu\'à épuisement', description: 'Un rayon de lumière solaire aveugle les créatures et calcine les morts-vivants, un rayon par round. (p. 281)' },
  { nom: 'Transmutation du métal en bois', ecole: 'Transmutation', niveaux: { Druide: 7 }, composantes: 'V, G, FD', portee: 'Longue', duree: 'Instantanée', description: 'Transforme en bois tout le métal présent dans un rayonnement de 12 m, armes et armures comprises. (p. 299)' },

  // ─── DRUIDE, NIVEAU 8 ───
  { nom: 'Contrôle des plantes', ecole: 'Transmutation', niveaux: { Druide: 8 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 minute/niveau', description: 'Prend le contrôle des créatures végétales et leur dicte leur conduite. (p. 217)' },
  { nom: 'Convocation d\'alliés naturels VIII', ecole: 'Invocation (convocation)', niveaux: { Druide: 8 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une créature naturelle de la liste du 8e niveau, qui combat pour le druide. (p. 219)' },
  { nom: 'Cyclone', ecole: 'Évocation [air]', niveaux: { Druide: 8 }, composantes: 'V, G, FD', portee: 'Longue', duree: '1 round/niveau (T)', description: 'Fait apparaître un cyclone haut de 9 m que le druide dirige : 3d6 points de dégâts au contact, puis 1d8 par round pour les créatures ballottées. (p. 226)' },
  { nom: 'Éloignement du métal et de la pierre', ecole: 'Abjuration [terre]', niveaux: { Druide: 8 }, composantes: 'V, G', portee: '18 m', duree: '1 round/niveau (T)', description: 'Repousse hors de la zone tout objet en métal ou en pierre. (p. 236)' },
  { nom: 'Métamorphose animale', ecole: 'Transmutation', niveaux: { Druide: 8 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 heure/niveau (T)', description: 'Transforme une créature consentante par niveau en un animal choisi par le druide. (p. 259)' },

  // ─── DRUIDE, NIVEAU 9 ───
  { nom: 'Convocation d\'alliés naturels IX', ecole: 'Invocation (convocation)', niveaux: { Druide: 9 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Appelle une créature naturelle de la liste du 9e niveau, qui combat pour le druide. (p. 219)' },
  { nom: 'Grand tertre', ecole: 'Invocation (création)', niveaux: { Druide: 9 }, composantes: 'V, G', portee: 'Moyenne', duree: '7 jours ou 7 mois (T)', description: 'Appelle 1d4+2 tertres errants qui combattent pour le druide. (p. 246)' },
  { nom: 'Nuée d\'élémentaires', ecole: 'Invocation (convocation)', niveaux: { Druide: 9 }, composantes: 'V, G', portee: 'Moyenne', duree: '10 minutes/niveau (T)', description: 'Ouvre un portail vers un plan élémentaire : 2d4 élémentaires de taille G, puis 1d4 de taille TG, puis un élémentaire noble. (p. 267)' },
]

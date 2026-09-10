import type { SortDnD } from './spells'

// ─────────────────────────────────────────────────────────────────────────────
// Sorts de PALADIN et de RÔDEUR du Manuel des Joueurs 3.5 (édition française)
//
// Le paladin et le rôdeur sont des lanceurs divins limités aux niveaux de sort
// 1 à 4, accessibles à partir du niveau 4 de classe (voir classes.ts).
//
// SOURCES LUES, page par page, À L'IMAGE — le PDF du Manuel n'a aucune couche
// texte, aucune extraction textuelle n'y fonctionne :
//   • liste résumée des sorts de paladin ....... pages imprimées 189 et 190
//   • liste résumée des sorts de rôdeur ........ pages imprimées 195 et 196
//   • chapitre 11 « Les sorts », alphabétique .. pages imprimées 197 à 303
// Décalage de pagination mesuré et confirmé : page PDF = page imprimée + 1.
//
// Quand la liste résumée et le chapitre 11 divergent, C'EST LE CHAPITRE QUI FAIT
// FOI — même arbitrage que pour le prêtre (spells-pretre.ts) et l'ensorceleur /
// magicien (spells-magicien.ts). Il a redressé quatre points :
//
//   1. « Soins légers » était enregistré en Rôdeur 1 dans le catalogue. Le
//      chapitre 11 (p. 289) imprime « Rôd 2 », ce que confirme la liste résumée.
//      Corrigé sur place. Cohérent avec la série légers / modérés / importants,
//      qui vaut Rôd 2 / 3 / 4 — le rôdeur reçoit chaque soin un cran plus haut
//      que le prêtre et le paladin.
//   2. « Restauration partielle » figure dans la liste résumée des sorts de
//      paladin du 4e niveau (p. 190). Le chapitre 11 (p. 284) imprime « Pal 1 ».
//      Enregistrée en Paladin 1.
//   3. En contrepartie, le vrai sort de paladin du 4e niveau est
//      « Restauration » (chapitre 11, p. 284 : « Pal 4, Prê 4 »), que la liste
//      résumée ne mentionne nulle part. Ajouté en Paladin 4.
//   4. « Détection du poison » porte « Rôd 1 » au chapitre 11 (p. 231) mais est
//      absent de la liste résumée du rôdeur (p. 195, qui passe de « Détection
//      des collets et des fosses » à « Enchevêtrement »). Conservé en Rôdeur 1.
//
// Une divergence d'orthographe interne au livre : « Passage sans traces »
// (pluriel) dans la liste résumée p. 196, « Passage sans trace » (singulier)
// dans le titre du bloc du chapitre 11 p. 269. Le titre du bloc fait foi — même
// choix que « Téléportation sans erreur » pour le magicien.
//
// La ligne « Protection contre le Chaos/Mal » de la liste du paladin couvre deux
// sorts que le chapitre 11 décrit séparément : elle est développée en deux
// entrées. Comptes finaux : PALADIN 45 sorts, RÔDEUR 51 sorts.
//
// ⚠ CE FICHIER NE CONTIENT QUE LES SORTS ABSENTS DES AUTRES LISTES.
// SORTS_DND35 (spells.ts) est une concaténation BRUTE, sans déduplication, et le
// nom d'un sort sert de clé de jointure (spell-effects.ts, domains.ts,
// generator.ts, table `spells` en base) : une seconde entrée du même nom
// casserait ces liens en silence. Les 66 sorts déjà présents dans SORTS_BASE,
// SORTS_PRETRE_MDJ, SORTS_MAGICIEN_MDJ ou SORTS_SUPPLEMENTS ont reçu leur niveau
// Paladin / Rôdeur directement dans leur entrée d'origine — ils ne sont pas
// recopiés ici. Contrôle : node menage-references/palrod-croiser.mjs
//
// Les niveaux de DRUIDE ne sont volontairement PAS renseignés, même quand le
// chapitre 11 les donne : la liste du druide fait l'objet d'un mandat distinct,
// qui les ajoutera sur place dans ces mêmes entrées.
//
// AVANCEMENT : listes du paladin et du rôdeur complètes, niveaux 1 à 4.
// ─────────────────────────────────────────────────────────────────────────────

export const SORTS_PALADIN_RODEUR_MDJ: SortDnD[] = [
  // ─── PALADIN, NIVEAU 1 ───
  { nom: 'Bénédiction d\'arme', ecole: 'Transmutation', niveaux: { Paladin: 1 }, composantes: 'V, G', portee: 'Contact', duree: '1 minute/niveau', description: 'L\'arme devient bonne, ignore la réduction de dégâts des créatures mauvaises et confirme automatiquement les critiques.' },

  // ─── PALADIN, NIVEAU 3 ───
  { nom: 'Guérison de destrier', ecole: 'Invocation', niveaux: { Paladin: 3 }, composantes: 'V, G', portee: 'Contact', duree: 'Instantané', description: 'Comme guérison suprême, mais n\'affecte que la monture du paladin.' },

  // ─── PALADIN, NIVEAU 4 ───
  { nom: 'Épée sainte', ecole: 'Évocation', niveaux: { Paladin: 4 }, composantes: 'V, G', portee: 'Contact', duree: '1 round/niveau', description: 'L\'arme de corps à corps devient une arme sainte +5 et émet un cercle magique contre le Mal.' },

  // ─── RÔDEUR, NIVEAU 1 ───
  { nom: 'Apaisement des animaux', ecole: 'Enchantement', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G', portee: 'Courte', duree: '1 minute/niveau', description: 'Calme 2d4 + niveau DV d\'animaux, qui cessent d\'attaquer ou de fuir.' },
  { nom: 'Charme-animal', ecole: 'Enchantement', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G', portee: 'Courte', duree: '1 heure/niveau', description: 'Un animal considère le PJ comme un ami fidèle et lui obéit dans la limite du raisonnable.' },
  { nom: 'Communication avec les animaux', ecole: 'Divination', niveaux: { Barde: 3, Rôdeur: 1, Druide: 1 }, composantes: 'V, G', portee: 'Personnelle', duree: '1 minute/niveau', description: 'Permet de comprendre les animaux et de dialoguer avec eux, sans les rendre plus amicaux.' },
  { nom: 'Convocation d\'alliés naturels I', ecole: 'Invocation', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Convoque une créature naturelle de niveau 1 qui combat pour le PJ.' },
  { nom: 'Détection de la faune ou de la flore', ecole: 'Divination', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G', portee: 'Longue', duree: 'Concentration, jusqu\'à 10 mn/niveau (T)', description: 'Détecte dans un cône un type précis de plante ou d\'animal, et son état de santé.' },
  { nom: 'Détection des collets et des fosses', ecole: 'Divination', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G', portee: '18 m', duree: 'Concentration, jusqu\'à 10 mn/niveau (T)', description: 'Repère fosses, pièges rudimentaires et risques naturels du terrain — ni pièges complexes, ni pièges magiques.' },
  { nom: 'Grand pas', ecole: 'Transmutation', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G, M', portee: 'Personnelle', duree: '1 heure/niveau (T)', description: 'Augmente de 3 m la vitesse de déplacement terrestre (bonus d\'altération).' },
  { nom: 'Invisibilité pour les animaux', ecole: 'Abjuration', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'G, FD', portee: 'Contact', duree: '10 minutes/niveau (T)', description: 'Les animaux ne peuvent ni voir, ni entendre, ni sentir les sujets (1/niveau).' },
  { nom: 'Messager animal', ecole: 'Enchantement', niveaux: { Barde: 2, Rôdeur: 1, Druide: 2 }, composantes: 'V, G, M', portee: 'Courte', duree: '1 jour/niveau', description: 'Envoie un petit animal en un lieu donné, généralement pour y porter un message.' },
  { nom: 'Morsure magique', ecole: 'Transmutation', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 minute/niveau', description: 'Une arme naturelle du sujet gagne +1 aux jets d\'attaque et de dégâts.' },
  { nom: 'Passage sans trace', ecole: 'Transmutation', niveaux: { Rôdeur: 1, Druide: 1 }, composantes: 'V, G, FD', portee: 'Contact', duree: '1 heure/niveau (T)', description: 'Les sujets (1/niveau) ne laissent aucune trace ; seule la magie permet de les suivre.' },

  // ─── RÔDEUR, NIVEAU 2 ───
  { nom: 'Collet', ecole: 'Transmutation', niveaux: { Rôdeur: 2, Druide: 3 }, composantes: 'V, G, FD', portee: 'Contact', duree: 'Jusqu\'à déclenchement ou rupture', description: 'Crée un piège magique dissimulé dont le nœud coulant se referme sur la première créature.' },
  { nom: 'Communication avec les plantes', ecole: 'Divination', niveaux: { Barde: 4, Rôdeur: 2, Druide: 3 }, composantes: 'V, G', portee: 'Personnelle', duree: '1 minute/niveau', description: 'Permet de parler aux plantes et créatures végétales et de les interroger sur leur voisinage.' },
  { nom: 'Convocation d\'alliés naturels II', ecole: 'Invocation', niveaux: { Rôdeur: 2, Druide: 2 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Convoque 1 créature naturelle de niveau 2, ou 1d3 de niveau 1.' },
  { nom: 'Croissance d\'épines', ecole: 'Transmutation', niveaux: { Rôdeur: 2, Druide: 3 }, composantes: 'V, G, FD', portee: 'Moyenne', duree: '1 heure/niveau (T)', description: 'Le sol se hérisse d\'épines invisibles : 1d4 points de dégâts par 1,50 m parcouru, vitesse réduite de moitié.' },
  { nom: 'Immobilisation d\'animal', ecole: 'Enchantement', niveaux: { Rôdeur: 2, Druide: 2 }, composantes: 'V, G', portee: 'Moyenne', duree: '1 round/niveau (T)', description: 'Fige un animal sur place, conscient mais incapable d\'agir ou de parler.' },
  { nom: 'Peau d\'écorce', ecole: 'Transmutation', niveaux: { Rôdeur: 2, Druide: 2 }, composantes: 'V, G, FD', portee: 'Contact', duree: '10 minutes/niveau', description: 'Confère un bonus d\'armure naturelle de +2, +1 par 3 niveaux (max. +5 au niveau 12).' },

  // ─── RÔDEUR, NIVEAU 3 ───
  { nom: 'Convocation d\'alliés naturels III', ecole: 'Invocation', niveaux: { Rôdeur: 3, Druide: 3 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Convoque 1 créature naturelle de niveau 3, 1d3 de niveau 2 ou 1d4+1 de niveau 1.' },
  { nom: 'Croissance végétale', ecole: 'Transmutation', niveaux: { Rôdeur: 3, Druide: 3 }, composantes: 'V, G, FD', portee: 'Voir description', duree: 'Instantané', description: 'Rend la végétation impénétrable (jungle) ou augmente d\'un tiers la production agricole (engrais).' },
  { nom: 'Empire végétal', ecole: 'Transmutation', niveaux: { Rôdeur: 3, Druide: 4 }, composantes: 'V', portee: 'Courte', duree: '1 jour/niveau', description: 'Les créatures végétales visées (2 DV/niveau) deviennent amicales et obéissent à des ordres simples.' },
  { nom: 'Forme d\'arbre', ecole: 'Transmutation', niveaux: { Rôdeur: 3, Druide: 2 }, composantes: 'V, G, FD', portee: 'Personnelle', duree: '1 heure/niveau (T)', description: 'Le PJ prend l\'apparence indétectable d\'un petit arbre ou d\'un buisson (armure naturelle +10).' },
  { nom: 'Morsure magique suprême', ecole: 'Transmutation', niveaux: { Rôdeur: 3, Druide: 3 }, composantes: 'Voir description', portee: 'Courte', duree: '1 heure/niveau', description: 'Comme morsure magique, mais +1 par tranche de 4 niveaux (max. +5), ou +1 à toutes les armes naturelles.' },
  { nom: 'Rabougrissement des plantes', ecole: 'Transmutation', niveaux: { Rôdeur: 3, Druide: 3 }, composantes: 'V, G, FD', portee: 'Voir description', duree: 'Instantané', description: 'Éclaircit d\'un tiers la végétation d\'une zone, ou réduit d\'un tiers la productivité des plantes.' },
  { nom: 'Rapetissement d\'animal', ecole: 'Transmutation', niveaux: { Rôdeur: 3, Druide: 2 }, composantes: 'V, G', portee: 'Contact', duree: '1 heure/niveau (T)', description: 'Réduit d\'une catégorie de taille un animal consentant (+2 Dex, +1 attaque et CA, −2 For).' },

  // ─── RÔDEUR, NIVEAU 4 ───
  { nom: 'Communion avec la nature', ecole: 'Divination', niveaux: { Rôdeur: 4, Druide: 5 }, composantes: 'V, G', portee: 'Personnelle', duree: 'Instantané', description: 'Apprend trois faits sur les environs naturels (1,5 km/niveau en extérieur).' },
  { nom: 'Convocation d\'alliés naturels IV', ecole: 'Invocation', niveaux: { Rôdeur: 4, Druide: 4 }, composantes: 'V, G, FD', portee: 'Courte', duree: '1 round/niveau (T)', description: 'Convoque 1 créature naturelle de niveau 4, 1d3 de niveau 3 ou 1d4+1 de niveau moindre.' },
  { nom: 'Voyage par les arbres', ecole: 'Invocation', niveaux: { Rôdeur: 4, Druide: 5 }, composantes: 'V, G, FD', portee: 'Personnelle', duree: '1 heure/niveau ou jusqu\'à utilisation', description: 'Le PJ entre dans un arbre et ressort par un autre de la même espèce.' },
]

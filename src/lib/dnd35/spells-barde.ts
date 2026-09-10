import type { SortDnD } from './spells'

// ─────────────────────────────────────────────────────────────────────────────
// Sorts de barde du Manuel des Joueurs 3.5 (édition française)
//
// La liste du barde va du niveau 0 au niveau 6. Le barde n'obtient son premier
// emplacement de sort qu'au niveau 2 de classe : ce décalage est déjà porté par
// classes.ts et ne concerne pas ce fichier.
//
// Relevés page par page dans le PDF du Manuel : la liste résumée qui ouvre le
// chapitre 11 (pages imprimées 181 à 183) pour les noms, les niveaux et la
// description d'une ligne, et le corps alphabétique du chapitre 11 « Les sorts »
// (pages 196 à 303) pour l'école, les composantes, la portée et la durée. Le PDF
// n'a aucune couche texte : tout a été lu à l'image. Le décalage de pagination a
// été recalé sur le folio 181 — page PDF = page imprimée + 1.
//
// Quand le résumé et le chapitre alphabétique divergent, c'est le chapitre qui
// fait foi — même choix que pour les listes de prêtre, d'ensorceleur/magicien et
// de paladin/rôdeur (voir spells-pretre.ts, spells-magicien.ts,
// spells-paladin-rodeur.ts).
//
// ARBITRAGES du chapitre 11 (deux niveaux Barde du catalogue étaient faux) :
//   • Soins modérés — le catalogue portait Barde 3. Le chapitre 11 (p. 289) lit
//     « Niveau : Bard 2, Dru 3, Guérison 2, Pal 3, Prê 2, Rôd 3 » : corrigé à 2.
//   • Dissipation de la magie — le catalogue portait Barde 4. Le chapitre 11
//     lit « Bard 3, Dru 4, Ens/Mag 3, Magie 3, Pal 3, Prê 3 » : corrigé à 3.
// Dans les deux cas la liste résumée du chapitre 11 disait déjà la même chose
// que le corps alphabétique ; c'est le catalogue maison qui était en écart.
//
// La liste du Manuel compte 164 sorts (16 au niveau 0, 26 au 1er, 35 au 2e,
// 30 au 3e, 21 au 4e, 16 au 5e, 20 au 6e). Ce fichier n'en contient que 12 :
// les sorts DÉJÀ présents dans SORTS_BASE (spells.ts), SORTS_PRETRE_MDJ,
// SORTS_MAGICIEN_MDJ, SORTS_PALADIN_RODEUR_MDJ ou SORTS_SUPPLEMENTS n'y sont PAS
// recopiés. SORTS_DND35 est une concaténation brute, sans déduplication, et le
// nom d'un sort sert de clé de jointure (spell-effects.ts, domains.ts,
// generator.ts, table `spells` en base) : une seconde entrée du même nom
// casserait ces liens en silence. Ces 152 sorts-là ont reçu leur niveau Barde
// directement dans leur entrée d'origine.
//
// Les douze sorts ci-dessous sont donc les seuls du Manuel qu'aucune des quatre
// autres listes ne portait déjà. Le numéro entre parenthèses est la page
// imprimée du chapitre 11 où la ligne « Niveau » a été lue.
//
// AVANCEMENT : niveaux 0 à 6 relevés — liste complète.
// ─────────────────────────────────────────────────────────────────────────────

export const SORTS_BARDE_MDJ: SortDnD[] = [
  // ─── BARDE, NIVEAU 0 ───
  { nom: 'Berceuse', ecole: 'Enchantement', niveaux: { Barde: 0 }, composantes: 'V, G', portee: 'Moyenne', duree: 'Concentration + 1 round/niveau (T)', description: 'Rend les sujets somnolents : −5 aux tests de Détection et de Perception auditive, −2 aux jets de Volonté contre le sommeil. (p. 205)' },
  { nom: 'Convocation d\'instrument', ecole: 'Invocation', niveaux: { Barde: 0 }, composantes: 'V, G', portee: '0 m', duree: '1 minute/niveau (T)', description: 'Convoque un instrument de musique portable au choix du barde, que lui seul peut jouer. (p. 219)' },
  { nom: 'Repérage', ecole: 'Divination', niveaux: { Barde: 0, Druide: 0 }, composantes: 'V, G', portee: 'Personnelle', duree: 'Instantané', description: 'Le personnage sait instantanément où se trouve le nord. (p. 283)' },

  // ─── BARDE, NIVEAU 1 ───
  { nom: 'Confusion mineure', ecole: 'Enchantement', niveaux: { Barde: 1 }, composantes: 'V, G', portee: 'Courte', duree: '1 round', description: 'Rend une créature vivante confuse pendant 1 round. (p. 215)' },

  // ─── BARDE, NIVEAU 2 ───
  { nom: 'Hypnose des animaux', ecole: 'Enchantement', niveaux: { Barde: 2, Druide: 2 }, composantes: 'V, G', portee: 'Courte', duree: 'Concentration', description: 'Fascine 2d6 DV d\'animaux ou de créatures magiques dotées d\'une Intelligence de 1 ou 2. (p. 247)' },

  // ─── BARDE, NIVEAU 3 ───
  { nom: 'Bagou', ecole: 'Transmutation', niveaux: { Barde: 3 }, composantes: 'G', portee: 'Personnelle', duree: '10 minutes/niveau (T)', description: 'Confère +30 aux tests de Bluff visant à convaincre autrui ; résiste aux divinations censées déceler les mensonges. (p. 203)' },
  { nom: 'Espoir', ecole: 'Enchantement', niveaux: { Barde: 3 }, composantes: 'V, G', portee: 'Moyenne', duree: '1 minute/niveau', description: 'Une créature/niveau reçoit un bonus de moral de +2 aux jets d\'attaque, de dégâts, de sauvegarde et aux tests. Contre désespoir foudroyant. (p. 239)' },
  { nom: 'Manipulation des sons', ecole: 'Transmutation', niveaux: { Barde: 3 }, composantes: 'V, G', portee: 'Courte', duree: '1 heure/niveau (T)', description: 'Altère les sons produits par 1 créature ou objet/niveau, ou en crée de nouveaux. (p. 256)' },

  // ─── BARDE, NIVEAU 4 ───
  { nom: 'Modification de mémoire', ecole: 'Enchantement', niveaux: { Barde: 4 }, composantes: 'V, G', portee: 'Courte', duree: 'Permanente', description: 'Modifie 5 minutes des souvenirs de la cible : effacer, préciser, altérer ou implanter un souvenir. (p. 261)' },
  { nom: 'Zone de silence', ecole: 'Illusion', niveaux: { Barde: 4 }, composantes: 'V, G', portee: 'Personnelle', duree: '1 heure/niveau (T)', description: 'Émanation de 1,50 m de rayon centrée sur le barde : les gens à l\'extérieur n\'entendent pas les conversations qui s\'y tiennent. (p. 303)' },

  // ─── BARDE, NIVEAU 5 ───
  { nom: 'Chant de discorde', ecole: 'Enchantement', niveaux: { Barde: 5 }, composantes: 'V, G', portee: 'Moyenne', duree: '1 round/niveau', description: 'Dans une étendue de 6 m de rayon, chaque créature a 50 % de chances par round d\'attaquer la cible la plus proche. (p. 211)' },

  // ─── BARDE, NIVEAU 6 ───
  { nom: 'Résonance', ecole: 'Évocation', niveaux: { Barde: 6 }, composantes: 'V, G, F', portee: 'Contact', duree: 'Jusqu\'à 1 round/niveau', description: 'Inflige 2d10 points de dégâts par round à un édifice ou une construction ; sans effet sur les créatures. Focaliseur : un diapason. (p. 284)' },
]

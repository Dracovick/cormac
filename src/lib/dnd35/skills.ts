export interface CompetenceRef {
  nom: string
  // '—' : la compétence Langue n'est liée à aucune caractéristique (table 4–2).
  caracteristique: 'FOR' | 'DEX' | 'CON' | 'INT' | 'SAG' | 'CHA' | '—'
  formationRequise: boolean
  classesCompetence: string[]
}

// Noms officiels français de la 3.5.
// Source : Manuel des Joueurs, Livre de Règles I v.3.5 (éd. française),
// chapitre 4, table 4–2 « Compétences », page 63.
export const COMPETENCES_DND35: CompetenceRef[] = [
  { nom: 'Acrobaties', caracteristique: 'DEX', formationRequise: true, classesCompetence: ['Barde', 'Bretteur', 'Moine', 'Roublard'] },
  { nom: 'Artisanat (armures)', caracteristique: 'INT', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Bretteur', 'Druide', 'Ensorceleur', 'Guerrier', 'Magicien', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur', 'Roublard'] },
  { nom: 'Artisanat (armes)', caracteristique: 'INT', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Bretteur', 'Druide', 'Ensorceleur', 'Guerrier', 'Magicien', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur', 'Roublard'] },
  { nom: 'Artisanat (pièges)', caracteristique: 'INT', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Bretteur', 'Druide', 'Ensorceleur', 'Guerrier', 'Magicien', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur', 'Roublard'] },
  { nom: 'Bluff', caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Bretteur', 'Ensorceleur', 'Roublard'] },
  { nom: 'Concentration', caracteristique: 'CON', formationRequise: false, classesCompetence: ['Barde', 'Druide', 'Ensorceleur', 'Magicien', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur'] },
  { nom: 'Connaissances (mystères)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Ensorceleur', 'Magicien', 'Moine', 'Prêtre'] },
  { nom: 'Connaissances (exploration souterraine)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Rôdeur'] },
  { nom: 'Connaissances (géographie)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Rôdeur'] },
  { nom: 'Connaissances (histoire)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Prêtre'] },
  { nom: 'Connaissances (nature)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Druide', 'Magicien', 'Rôdeur'] },
  { nom: 'Connaissances (religion)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Moine', 'Paladin', 'Prêtre'] },
  { nom: 'Connaissances (plans)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Prêtre'] },
  { nom: 'Connaissances (architecture et ingénierie)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien'] },
  { nom: 'Connaissances (folklore local)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Roublard'] },
  { nom: 'Connaissances (noblesse et royauté)', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Paladin'] },
  { nom: 'Contrefaçon', caracteristique: 'INT', formationRequise: false, classesCompetence: ['Roublard'] },
  { nom: 'Décryptage', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Magicien', 'Roublard'] },
  { nom: 'Déguisement', caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Diplomatie', caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Bretteur', 'Druide', 'Moine', 'Paladin', 'Prêtre', 'Roublard'] },
  { nom: 'Discrétion', caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barde', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Dressage', caracteristique: 'CHA', formationRequise: true, classesCompetence: ['Barbare', 'Druide', 'Guerrier', 'Paladin', 'Rôdeur'] },
  { nom: 'Équilibre', caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barde', 'Bretteur', 'Moine', 'Roublard'] },
  { nom: 'Équitation', caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barbare', 'Druide', 'Guerrier', 'Paladin', 'Rôdeur'] },
  { nom: 'Escalade', caracteristique: 'FOR', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Bretteur', 'Guerrier', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Escamotage', caracteristique: 'DEX', formationRequise: true, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Estimation', caracteristique: 'INT', formationRequise: false, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Évasion', caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barde', 'Bretteur', 'Moine', 'Roublard'] },
  { nom: 'Renseignements', caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Fouille', caracteristique: 'INT', formationRequise: false, classesCompetence: ['Rôdeur', 'Roublard'] },
  { nom: 'Intimidation', caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barbare', 'Guerrier', 'Roublard'] },
  { nom: 'Art de la magie', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Barde', 'Druide', 'Ensorceleur', 'Magicien', 'Prêtre'] },
  { nom: 'Profession', caracteristique: 'SAG', formationRequise: true, classesCompetence: ['Barde', 'Bretteur', 'Druide', 'Ensorceleur', 'Magicien', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur', 'Roublard'] },
  { nom: 'Natation', caracteristique: 'FOR', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Bretteur', 'Druide', 'Guerrier', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Perception auditive', caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Druide', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Premiers secours', caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Druide', 'Paladin', 'Prêtre', 'Rôdeur'] },
  { nom: 'Psychologie', caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barde', 'Bretteur', 'Moine', 'Paladin', 'Roublard'] },
  { nom: 'Représentation', caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Moine', 'Roublard'] },
  { nom: 'Désamorçage/sabotage', caracteristique: 'INT', formationRequise: true, classesCompetence: ['Roublard'] },
  { nom: 'Saut', caracteristique: 'FOR', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Bretteur', 'Guerrier', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Survie', caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barbare', 'Druide', 'Rôdeur'] },
  { nom: 'Langue', caracteristique: '—', formationRequise: true, classesCompetence: ['Barde'] },
  { nom: 'Maîtrise des cordes', caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Bretteur', 'Rôdeur', 'Roublard'] },
  { nom: 'Utilisation d\'objets magiques', caracteristique: 'CHA', formationRequise: true, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Détection', caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Druide', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Déplacement silencieux', caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barde', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Crochetage', caracteristique: 'DEX', formationRequise: true, classesCompetence: ['Roublard'] },
]

export function getCompetenceRef(nom: string): CompetenceRef | undefined {
  return COMPETENCES_DND35.find(c => c.nom === nom)
}

/**
 * Caractéristique associée à une compétence, pour l'écran comme pour la fiche
 * imprimée — les deux doivent afficher la même chose.
 *
 * La table 4–2 fait autorité quand elle connaît la compétence : plusieurs
 * entrées de la base portent une caractéristique fautive (« Psychologie » y est
 * rattachée au Charisme au lieu de la Sagesse). Pour les compétences maison,
 * qui ne sont dans aucune table officielle, c'est la base qui décide.
 */
export function caracteristiqueDe(nom: string, caracteristiqueEnBase?: string | null): string {
  return getCompetenceRef(nom)?.caracteristique ?? caracteristiqueEnBase ?? '—'
}

/**
 * Les compétences qui font autorité pour le STATUT d'un nom de compétence —
 * compétence de classe, formation requise. Jamais pour sa caractéristique :
 * celle-ci reste décidée par `caracteristiqueDe`, qui garde la valeur saisie en
 * base quand le nom exact lui est inconnu. Changer une caractéristique ferait
 * bouger un total déjà imprimé; changer un statut ne fait que cocher une case.
 *
 * Une spécialité libre — « Profession (joueur) », « Artisanat (tissage) »,
 * « Connaissances (dragons) » — n'est dans aucune table officielle sous ce
 * nom-là : la table 4–2 ne nomme que la compétence générique, ou quelques
 * spécialités données en exemple. Le nom exact n'y était donc pas trouvé et la
 * ligne cessait d'être comptée comme compétence de classe : case □ au lieu de ■
 * sur la feuille imprimée, et surtout plafond de rangs de hors-classe au
 * formulaire — (N+3)/2 au lieu de N+3 — alors que le joueur a payé ses rangs au
 * tarif de classe. 16 lignes des fiches étaient dans ce cas.
 *
 * Le repli se fait en deux temps :
 *   1. la compétence générique de même base (« Profession (joueur) » → « Profession ») ;
 *   2. à défaut, ses sœurs de la table (« Artisanat (tissage) » → les trois
 *      « Artisanat (…) »), et seulement si elles sont TOUTES d'accord. Les
 *      « Connaissances (…) » n'ont pas les mêmes classes de classe d'une
 *      spécialité à l'autre : sans unanimité, on ne tranche pas et la ligne
 *      reste hors-classe, exactement comme avant.
 */
function refsDeStatut(nom: string): CompetenceRef[] {
  const exact = getCompetenceRef(nom)
  if (exact) return [exact]
  const base = nom.match(/^([^(]+?)\s*\(/)?.[1]
  if (!base) return []
  const generique = COMPETENCES_DND35.find(c => c.nom === base)
  if (generique) return [generique]
  return COMPETENCES_DND35.filter(c => c.nom.startsWith(`${base} (`))
}

/**
 * La compétence est-elle une compétence de classe pour ce personnage ?
 * ⛔ Le garde sur le tableau vide est indispensable : `[].every(...)` vaut
 * `true`, et un nom maison inconnu de la table deviendrait compétence de classe
 * pour tout le monde.
 */
export function estCompetenceDeClasse(nom: string, classesDuPersonnage: string[]): boolean {
  const refs = refsDeStatut(nom)
  if (refs.length === 0) return false
  return refs.every(r => r.classesCompetence.some(cc => classesDuPersonnage.includes(cc)))
}

/** La compétence exige-t-elle une formation ? Même repli, même garde. */
export function formationRequiseDe(nom: string): boolean {
  const refs = refsDeStatut(nom)
  if (refs.length === 0) return false
  return refs.every(r => r.formationRequise)
}

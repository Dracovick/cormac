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
  { nom: 'Acrobaties',                 caracteristique: 'DEX', formationRequise: true,  classesCompetence: ['Barde', 'Moine', 'Roublard', 'Rôdeur'] },
  { nom: 'Artisanat (armures)',         caracteristique: 'INT', formationRequise: false, classesCompetence: ['Barbare', 'Druide', 'Guerrier', 'Moine', 'Paladin', 'Rôdeur'] },
  { nom: 'Artisanat (armes)',           caracteristique: 'INT', formationRequise: false, classesCompetence: ['Barbare', 'Druide', 'Guerrier', 'Moine', 'Paladin', 'Rôdeur'] },
  { nom: 'Artisanat (pièges)',          caracteristique: 'INT', formationRequise: false, classesCompetence: ['Roublard', 'Rôdeur'] },
  { nom: 'Bluff',                      caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Ensorceleur', 'Roublard'] },
  { nom: 'Concentration',              caracteristique: 'CON', formationRequise: false, classesCompetence: ['Barde', 'Druide', 'Ensorceleur', 'Magicien', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur'] },
  { nom: 'Connaissances (mystères)',                caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Ensorceleur', 'Magicien', 'Prêtre'] },
  { nom: 'Connaissances (exploration souterraine)', caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Druide', 'Guerrier', 'Rôdeur'] },
  { nom: 'Connaissances (géographie)',              caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Druide', 'Rôdeur'] },
  { nom: 'Connaissances (histoire)',                caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Magicien', 'Prêtre'] },
  { nom: 'Connaissances (nature)',                  caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Druide', 'Rôdeur'] },
  { nom: 'Connaissances (religion)',                caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Magicien', 'Moine', 'Paladin', 'Prêtre'] },
  { nom: 'Connaissances (plans)',                   caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Magicien', 'Prêtre'] },
  { nom: 'Connaissances (architecture et ingénierie)', caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Magicien'] },
  { nom: 'Connaissances (folklore local)',          caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Magicien', 'Roublard'] },
  { nom: 'Connaissances (noblesse et royauté)',     caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Magicien'] },
  { nom: 'Contrefaçon',                caracteristique: 'INT', formationRequise: false, classesCompetence: ['Roublard'] },
  { nom: 'Décryptage',                 caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Magicien', 'Roublard'] },
  { nom: 'Déguisement',               caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Diplomatie',                 caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Druide', 'Moine', 'Paladin', 'Prêtre', 'Roublard'] },
  { nom: 'Discrétion',                 caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barde', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Dressage',                   caracteristique: 'CHA', formationRequise: true,  classesCompetence: ['Barbare', 'Druide', 'Guerrier', 'Paladin', 'Rôdeur'] },
  { nom: 'Équilibre',                  caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barde', 'Moine', 'Roublard', 'Rôdeur'] },
  { nom: 'Équitation',                 caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barbare', 'Guerrier', 'Paladin', 'Rôdeur'] },
  { nom: 'Escalade',                   caracteristique: 'FOR', formationRequise: false, classesCompetence: ['Barbare', 'Guerrier', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Escamotage',                 caracteristique: 'DEX', formationRequise: true,  classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Estimation',                 caracteristique: 'INT', formationRequise: false, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Évasion',                    caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barde', 'Moine', 'Roublard'] },
  { nom: 'Renseignements',             caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Fouille',                    caracteristique: 'INT', formationRequise: false, classesCompetence: ['Magicien', 'Rôdeur', 'Roublard'] },
  { nom: 'Intimidation',               caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barbare', 'Guerrier', 'Roublard'] },
  { nom: 'Art de la magie',            caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Barde', 'Druide', 'Ensorceleur', 'Magicien', 'Paladin', 'Prêtre', 'Rôdeur'] },
  { nom: 'Profession',                 caracteristique: 'SAG', formationRequise: true,  classesCompetence: ['Barde', 'Moine', 'Prêtre', 'Roublard'] },
  { nom: 'Natation',                   caracteristique: 'FOR', formationRequise: false, classesCompetence: ['Barbare', 'Druide', 'Guerrier', 'Moine', 'Rôdeur'] },
  { nom: 'Perception auditive',        caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Druide', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur', 'Roublard'] },
  { nom: 'Premiers secours',           caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barde', 'Druide', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur'] },
  { nom: 'Psychologie',                caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barde', 'Moine', 'Paladin', 'Prêtre', 'Roublard'] },
  { nom: 'Représentation',             caracteristique: 'CHA', formationRequise: false, classesCompetence: ['Barde'] },
  { nom: 'Désamorçage/sabotage',       caracteristique: 'INT', formationRequise: true,  classesCompetence: ['Roublard'] },
  { nom: 'Saut',                       caracteristique: 'FOR', formationRequise: false, classesCompetence: ['Barbare', 'Guerrier', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Survie',                     caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Druide', 'Moine', 'Rôdeur'] },
  { nom: 'Langue',                     caracteristique: '—',   formationRequise: true,  classesCompetence: ['Barde'] },
  { nom: 'Maîtrise des cordes',        caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Roublard', 'Rôdeur'] },
  { nom: 'Utilisation d\'objets magiques', caracteristique: 'CHA', formationRequise: true,  classesCompetence: ['Barde', 'Roublard'] },
  { nom: 'Détection',                  caracteristique: 'SAG', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Druide', 'Moine', 'Paladin', 'Prêtre', 'Rôdeur', 'Roublard'] },
  { nom: 'Déplacement silencieux',     caracteristique: 'DEX', formationRequise: false, classesCompetence: ['Barbare', 'Barde', 'Druide', 'Moine', 'Rôdeur', 'Roublard'] },
  { nom: 'Crochetage',                 caracteristique: 'DEX', formationRequise: true,  classesCompetence: ['Roublard'] },
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

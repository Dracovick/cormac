export type FeatCategorie = 'Combat' | 'Tir' | 'Magie' | 'Métamagie' | 'Divin' | 'Général'

export interface FeatDef {
  nom: string
  categorie: FeatCategorie
  needsWeapon?: boolean
  description: string
  prerequis?: string[]  // ex. ["Arme de prédilection", "BBA+4"]
}

import { FEATS_SUPPLEMENTS } from './feats-supplements'

const FEATS_BASE: FeatDef[] = [
  // ── GÉNÉRAL ─────────────────────────────────────────────────────────────────
  { nom: 'Robustesse',               categorie: 'Général', description: '+3 points de vie' },
  { nom: 'Grande résistance',        categorie: 'Général', description: '+2 aux jets de Vigueur' },
  { nom: 'Volonté de fer',           categorie: 'Général', description: '+2 aux jets de Volonté' },
  { nom: 'Réflexes surhumains',      categorie: 'Général', description: '+2 aux jets de Réflexes' },
  { nom: 'Science de l\'initiative', categorie: 'Général', description: '+4 à l\'initiative' },
  { nom: 'Vigilance',                categorie: 'Général', description: '+2 aux tests de Psychologie et Détection' },
  { nom: 'Endurance',                categorie: 'Général', description: '+4 aux tests de Constitution prolongés' },
  { nom: 'Esquive',                  categorie: 'Général', description: '+1 à la CA contre un adversaire désigné' },
  { nom: 'Mobilité',                 categorie: 'Général', description: '+4 à la CA contre les attaques d\'opportunité en déplacement', prerequis: ['Esquive'] },
  { nom: 'Course',                   categorie: 'Général', description: 'Déplacement ×5 en course, pas de malus de DEX à la CA' },
  { nom: 'Réflexes de combat',       categorie: 'Général', description: 'Attaques d\'opportunité supplémentaires (mod. DEX par round)' },
  { nom: 'Expertise de combat',      categorie: 'Général', description: 'Échange jusqu\'à −5 en attaque contre +5 à la CA', prerequis: ['INT13'] },

  // ── COMBAT ──────────────────────────────────────────────────────────────────
  { nom: 'Arme de prédilection',              categorie: 'Combat', needsWeapon: true, description: '+1 aux jets d\'attaque avec l\'arme choisie' },
  { nom: 'Maîtrise martiale supérieure',      categorie: 'Combat', needsWeapon: true, description: '+1 attaque supplémentaire avec l\'arme choisie (Guerrier niv. 4)', prerequis: ['Arme de prédilection', 'BBA+4'] },
  { nom: 'Spécialisation martiale',           categorie: 'Combat', needsWeapon: true, description: '+2 aux dégâts avec l\'arme choisie (Guerrier niv. 4)', prerequis: ['Arme de prédilection', 'BBA+4'] },
  { nom: 'Spécialisation martiale supérieure',categorie: 'Combat', needsWeapon: true, description: '+2 dégâts supplémentaires avec l\'arme choisie (Guerrier niv. 8)', prerequis: ['Spécialisation martiale', 'BBA+8'] },
  { nom: 'Acuité martiale',                   categorie: 'Combat', needsWeapon: true, description: 'Utiliser DEX au lieu de FOR pour les jets d\'attaque avec l\'arme choisie' },
  { nom: 'Attaque en puissance',              categorie: 'Combat', description: 'Échange jusqu\'à −5 en attaque contre +5 aux dégâts (à 2 mains : +10)', prerequis: ['FOR13'] },
  { nom: 'Fendant',                           categorie: 'Combat', description: 'Attaque supplémentaire gratuite si l\'ennemi est mis hors de combat', prerequis: ['BBA+1'] },
  { nom: 'Grand fendant',                     categorie: 'Combat', description: 'Attaque supplémentaire après chaque ennemi mis hors de combat', prerequis: ['Fendant', 'BBA+4'] },
  { nom: 'Attaque en vol',                    categorie: 'Combat', description: 'Se déplacer, attaquer, puis finir le déplacement en une action', prerequis: ['Mobilité', 'BBA+4'] },
  { nom: 'Tourbillon',                        categorie: 'Combat', description: 'Attaquer toutes les créatures adjacentes en une action de round', prerequis: ['Combat défensif', 'Expertise de combat', 'Mobilité', 'Attaque en vol', 'BBA+4'] },
  { nom: 'Frappe précise',                    categorie: 'Combat', description: 'Ignore le bonus d\'armure et de bouclier d\'un adversaire (une attaque)', prerequis: ['Expertise de combat', 'BBA+8'] },
  { nom: 'Combat à deux armes',               categorie: 'Combat', description: 'Réduit les malus pour combattre avec une arme dans chaque main' },
  { nom: 'Combat à deux armes supérieur',     categorie: 'Combat', description: 'Deuxième attaque supplémentaire avec l\'arme secondaire', prerequis: ['Combat à deux armes', 'BBA+6'] },
  { nom: 'Combat à deux armes optimal',       categorie: 'Combat', description: 'Troisième attaque supplémentaire avec l\'arme secondaire', prerequis: ['Combat à deux armes supérieur', 'BBA+11'] },
  { nom: 'Défense à deux armes',              categorie: 'Combat', description: '+1 à la CA quand on tient une arme dans chaque main', prerequis: ['Combat à deux armes'] },
  { nom: 'Maîtrise du bouclier',              categorie: 'Combat', description: 'Utiliser un bouclier sans malus aux jets d\'attaque' },
  { nom: 'Combat monté',                      categorie: 'Combat', description: 'Annule jusqu\'à son mod. d\'Équitation en dégâts sur la monture', prerequis: ['BBA+1'] },
  { nom: 'Piétinement',                       categorie: 'Combat', description: 'Renverser un adversaire lors d\'un piétinement sans attaque d\'opportunité', prerequis: ['Combat monté'] },
  { nom: 'Tir depuis une monture',            categorie: 'Combat', description: 'Réduit le malus de tir à cheval de −4 à −2', prerequis: ['Combat monté'] },
  { nom: 'Coup étourdissant',                 categorie: 'Combat', description: 'Jet de Vigueur ou l\'adversaire est étourdi pendant 1 round', prerequis: ['BBA+8'] },
  { nom: 'Science de la bousculade',          categorie: 'Combat', description: 'Bousculer sans déclencher d\'attaque d\'opportunité, +4 au test' },
  { nom: 'Science du désarmement',            categorie: 'Combat', description: 'Désarmer sans déclencher d\'attaque d\'opportunité', prerequis: ['BBA+1'] },
  { nom: 'Science de la feinte',              categorie: 'Combat', description: 'Feinter en combat comme une action rapide' },
  { nom: 'Science du renversement',           categorie: 'Combat', description: 'Renverser sans déclencher d\'attaque d\'opportunité' },
  { nom: 'Science du croc-en-jambe',          categorie: 'Combat', description: 'Croc-en-jambe sans déclencher d\'attaque d\'opportunité' },
  { nom: 'Combat défensif',                   categorie: 'Combat', description: '+2 à la CA en échange de −4 aux attaques pour le round' },

  // ── TIR ─────────────────────────────────────────────────────────────────────
  { nom: 'Tir à bout portant',                categorie: 'Tir', description: '+1 aux attaques et dégâts à distance à portée ≤ 9 m' },
  { nom: 'Tir de précision',                  categorie: 'Tir', description: 'Attaque supplémentaire à −2 avec une arme à distance par round', prerequis: ['Tir à bout portant', 'BBA+1'] },
  { nom: 'Tir en mêlée',                      categorie: 'Tir', description: 'Tirer ou lancer en mêlée sans déclencher d\'attaque d\'opportunité', prerequis: ['Tir à bout portant'] },
  { nom: 'Tir rapide',                        categorie: 'Tir', description: 'Tirer jusqu\'à 5 flèches en une attaque de plein BBA (1d6 chacune)', prerequis: ['Tir à bout portant', 'BBA+6'] },
  { nom: 'Tir à la volée',                    categorie: 'Tir', description: 'Se déplacer et tirer à chaque tranche de déplacement', prerequis: ['Tir à bout portant', 'Tir de précision', 'BBA+4'] },
  { nom: 'Visée',                             categorie: 'Tir', description: '+1 aux attaques à distance si aucun déplacement ce round', prerequis: ['Tir à bout portant'] },
  { nom: 'Tir de loin',                       categorie: 'Tir', description: 'Augmente la portée des armes à distance de 50 %', prerequis: ['Tir à bout portant'] },

  // ── MAGIE ───────────────────────────────────────────────────────────────────
  { nom: 'Résistance aux sorts',              categorie: 'Magie', description: '+2 aux jets de sauvegarde contre les sorts et effets magiques' },
  { nom: 'Maîtrise des sorts',                categorie: 'Magie', description: 'Lancer un sort de niv. 0 ou 1 sans dépenser d\'emplacement (1/jour)' },
  { nom: 'Science des sorts (Abjuration)',    categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Abjuration' },
  { nom: 'Science des sorts (Divination)',    categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts de Divination' },
  { nom: 'Science des sorts (Enchantement)',  categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Enchantement' },
  { nom: 'Science des sorts (Évocation)',     categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Évocation' },
  { nom: 'Science des sorts (Illusion)',      categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Illusion' },
  { nom: 'Science des sorts (Invocation)',    categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts d\'Invocation' },
  { nom: 'Science des sorts (Nécromancie)',   categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts de Nécromancie' },
  { nom: 'Science des sorts (Transmutation)', categorie: 'Magie', description: '+1 au DD des jets de sauvegarde des sorts de Transmutation' },
  { nom: 'Maîtrise des sorts supérieure',     categorie: 'Magie', description: '+1 au DD pour une école choisie (prérequis : Science des sorts)' },
  { nom: 'Incantation en armure légère',      categorie: 'Magie', description: 'Lancer des sorts en armure légère sans risque d\'échec magique' },
  { nom: 'Incantation en armure intermédiaire', categorie: 'Magie', description: 'Lancer des sorts en armure intermédiaire sans risque d\'échec magique' },

  // ── MÉTAMAGIE ───────────────────────────────────────────────────────────────
  { nom: 'Sort silencieux',  categorie: 'Métamagie', description: 'Lancer sans composante verbale (+1 niveau d\'emplacement)' },
  { nom: 'Sort stationnaire',categorie: 'Métamagie', description: 'Lancer sans composante somatique (+1 niveau d\'emplacement)' },
  { nom: 'Sort discret',     categorie: 'Métamagie', description: 'Lancer sans composante matérielle (+1 niveau d\'emplacement)' },
  { nom: 'Sort étendu',      categorie: 'Métamagie', description: 'Doubler la durée du sort (+1 niveau d\'emplacement)' },
  { nom: 'Sort puissant',    categorie: 'Métamagie', description: '+1 dé de dégâts ou +2 points d\'effet (+1 niveau d\'emplacement)' },
  { nom: 'Sort intensifié',  categorie: 'Métamagie', description: 'Augmenter la limite de dés de dégâts (+2 niveaux d\'emplacement)' },
  { nom: 'Sort maximisé',    categorie: 'Métamagie', description: 'Maximiser tous les effets variables (+3 niveaux d\'emplacement)' },
  { nom: 'Sort rapide',      categorie: 'Métamagie', description: 'Lancer comme action rapide (+4 niveaux d\'emplacement)' },
  { nom: 'Sort persistant',  categorie: 'Métamagie', description: 'Durée = 24 heures (+6 niveaux d\'emplacement)' },

  // ── DIVIN ───────────────────────────────────────────────────────────────────
  { nom: 'Science du renvoi',     categorie: 'Divin', description: '+2 aux jets de renvoi/commandement des morts-vivants' },
  { nom: 'Renvoi renforcé',       categorie: 'Divin', description: '+4 tentatives de renvoi ou commandement par jour' },
  { nom: 'Incantation spontanée', categorie: 'Divin', description: 'Convertir un sort préparé en sort de soins ou d\'affliction' },
]

// Catalogue complet : dons du Manuel des Joueurs + dons des suppléments
// (Codex Divin, Codex Profane, Maîtres de la Nature, Royaumes Oubliés)
export const FEATS_DND35: FeatDef[] = [...FEATS_BASE, ...FEATS_SUPPLEMENTS]

// Vérifie les prérequis d'un don. prerequis peut contenir des noms de dons, "BBA+N", "STATX" (FOR13, INT13...)
export function verifierPrerequisDon(
  feat: FeatDef,
  donsActifs: string[],  // noms des dons déjà pris
  bab: number,
  abilityScores?: { for: number; dex: number; con: number; int: number; sag: number; cha: number }
): string[] {
  const manquants: string[] = []
  for (const req of feat.prerequis ?? []) {
    if (/^BBA\+(\d+)$/.test(req)) {
      const min = parseInt(req.slice(4))
      if (bab < min) manquants.push(`BBA +${min}`)
    } else if (/^(FOR|DEX|CON|INT|SAG|CHA)(\d+)$/.test(req)) {
      const stat = req.slice(0, 3)
      const min = parseInt(req.slice(3))
      const map: Record<string, number | undefined> = {
        FOR: abilityScores?.for, DEX: abilityScores?.dex, CON: abilityScores?.con,
        INT: abilityScores?.int, SAG: abilityScores?.sag, CHA: abilityScores?.cha,
      }
      const val = map[stat]
      if (val == null || val < min) manquants.push(`${stat} ≥ ${min}`)
    } else {
      // Prérequis = nom d'un autre don (avec ou sans arme entre parenthèses — on ignore l'arme)
      const reqNom = req.replace(/\s*\(.*?\)$/, '').trim()
      const hasIt = donsActifs.some(d => d.replace(/\s*\(.*?\)$/, '').trim() === reqNom)
      if (!hasIt) manquants.push(req)
    }
  }
  return manquants
}

// Catégories pertinentes par classe (pour filtrer les onglets dans l'UI)
export const CATEGORIES_PAR_CLASSE: Record<string, FeatCategorie[]> = {
  'Guerrier':    ['Combat', 'Tir'],
  'Barbare':     ['Combat', 'Tir'],
  'Paladin':     ['Combat', 'Divin'],
  'Rôdeur':      ['Combat', 'Tir'],
  'Magicien':    ['Magie', 'Métamagie'],
  'Ensorceleur': ['Magie', 'Métamagie'],
  'Prêtre':      ['Combat', 'Magie', 'Divin'],
  'Druide':      ['Magie', 'Métamagie', 'Divin'],
  'Barde':       ['Combat', 'Magie', 'Métamagie'],
  'Moine':       ['Combat'],
  'Roublard':    ['Combat', 'Tir'],
}

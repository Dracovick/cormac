// Phase 2 — préfixe les titres mot-clé des relevés anneaux/sceptres avec le nom complet officiel VF.
// Produit anneaux-nommes.md et sceptres-nommes.md à côté des originaux (originaux intacts).
import fs from 'fs'

const DIR = 'X:/Claude-Tools/cormac/menage-references/p2-releves'

const ANNEAUX: Record<string, string> = {
  'Amitié avec les animaux': "Anneau d'amitié avec les animaux",
  'Arcanes (premiers)': 'Anneau des premiers arcanes',
  'Arcanes (deuxièmes)': 'Anneau des deuxièmes arcanes',
  'Arcanes (troisièmes)': 'Anneau des troisièmes arcanes',
  'Arcanes (quatrièmes)': 'Anneau des quatrièmes arcanes',
  'Barrière mentale': 'Anneau de barrière mentale',
  'Bélier': 'Anneau du bélier',
  'Bon génie': 'Anneau du bon génie',
  'Bouclier de force': 'Anneau de bouclier de force',
  'Caméléon': 'Anneau de caméléon',
  'Clignotement': 'Anneau de clignotement',
  'Contresort': 'Anneau de contresort',
  'Contrôle des éléments (Air, Eau, Feu ou Terre)': 'Anneau de contrôle des éléments (air, eau, feu ou terre)',
  'Escalade': "Anneau d'escalade",
  'Escalade supérieure': "Anneau d'escalade supérieure",
  'Esquive totale': "Anneau d'esquive totale",
  "Feu d'étoiles": "Anneau de feu d'étoiles",
  'Feuille morte': 'Anneau de feuille morte',
  'Invisibilité': "Anneau d'invisibilité",
  'Liberté de mouvement': 'Anneau de liberté de mouvement',
  "Marche sur l'onde": "Anneau de marche sur l'onde",
  'Nage': 'Anneau de nage',
  'Nage supérieure': 'Anneau de nage supérieure',
  'Protection +1': 'Anneau de protection +1',
  'Protection +2': 'Anneau de protection +2',
  'Protection +3': 'Anneau de protection +3',
  'Protection +4': 'Anneau de protection +4',
  'Protection +5': 'Anneau de protection +5',
  'Protection mutuelle (une paire)': 'Anneau de protection mutuelle (une paire)',
  'Rayons X': 'Anneau de rayons X',
  'Régénération': 'Anneau de régénération',
  'Renvoi des sorts': 'Anneau de renvoi des sorts',
  'Résistance aux énergies destructives, mineur': 'Anneau de résistance aux énergies destructives (mineur)',
  'Résistance aux énergies destructives, majeur': 'Anneau de résistance aux énergies destructives (majeur)',
  'Résistance aux énergies destructives, suprême': 'Anneau de résistance aux énergies destructives (suprême)',
  'Saut': 'Anneau de saut',
  'Saut supérieur': 'Anneau de saut supérieur',
  'Stockage de sorts mineurs': 'Anneau de stockage de sorts mineurs',
  'Stockage de sorts': 'Anneau de stockage de sorts',
  'Stockage de sorts majeurs': 'Anneau de stockage de sorts majeurs',
  'Subsistance': 'Anneau de subsistance',
  'Télékinésie': 'Anneau de télékinésie',
  'Triple souhait': 'Anneau de triple souhait',
}

const SCEPTRES: Record<string, string> = {
  'Absorption': "Sceptre d'absorption",
  'Annulation': "Sceptre d'annulation",
  "Détection de l'hostilité": "Sceptre de détection de l'hostilité",
  'Détection des métaux et des minéraux': 'Sceptre de détection des métaux et des minéraux',
  'Éternelle vigilance': "Sceptre d'éternelle vigilance",
  'Extinction des feux': "Sceptre d'extinction des feux",
  'Flétrissement': 'Sceptre de flétrissement',
  'Grand fléau': 'Sceptre du grand fléau',
  'Inamovible': 'Sceptre inamovible',
  'Merveilleux': 'Sceptre merveilleux',
  'Oblitération': "Sceptre d'oblitération",
  'Orage': "Sceptre d'orage",
  'Prestance': 'Sceptre de prestance',
  'Python': 'Sceptre du python',
  'Sécurité': 'Sceptre de sécurité',
  'Seigneurs de la guerre': 'Sceptre des seigneurs de la guerre',
  'Suzeraineté': 'Sceptre de suzeraineté',
  'Vipère': 'Sceptre de la vipère',
}
// Variantes de métamagie : « Métamagie mineure, Extension de durée » → « Sceptre de métamagie mineure (extension de durée) »
const META = /^Métamagie (mineure|modérée|majeure), (.+)$/

function renommer(fichier: string, table: Record<string, string>, sortie: string) {
  const md = fs.readFileSync(`${DIR}/${fichier}`, 'utf8')
  const inconnus: string[] = []
  const resultat = md.replace(/^### (.+)$/gm, (_tout, titre: string) => {
    const t = titre.trim()
    if (table[t]) return `### ${table[t]}`
    const m = t.match(META)
    if (m) return `### Sceptre de métamagie ${m[1]} (${m[2].charAt(0).toLowerCase()}${m[2].slice(1)})`
    inconnus.push(t)
    return `### ${t}`
  })
  fs.writeFileSync(`${DIR}/${sortie}`, resultat, 'utf8')
  console.log(`${sortie} écrit. Titres sans correspondance : ${inconnus.length ? inconnus.join(' | ') : 'aucun'}`)
}

renommer('anneaux.md', ANNEAUX, 'anneaux-nommes.md')
renommer('sceptres.md', SCEPTRES, 'sceptres-nommes.md')

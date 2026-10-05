/**
 * Semis des potions officielles du Guide du Maître 3.5 — 2026-10-05, GO d'André.
 *
 * Source : Guide du Maître (VF), Table 7-28 « Potions et huiles », pages 263-264
 * (lecture à l'image du PDF scanné — menage-references/, session Dracovick).
 * Périmètre : les POTIONS seulement (marque ² de la table, plus « potion ou
 * huile »). Les huiles (arme magique, bénédiction d'arme, gourdin magique,
 * pierre magique, ténèbres, affûtage, flèches enflammées, panoplie magique,
 * arme magique suprême) sont des enduits d'objets, pas des breuvages — hors
 * de la section Potions des fiches.
 * Omissions assumées (à créer en maison si elles surgissent en partie) :
 * résistance aux énergies 20 et 30 points (700/1 100 po), protection contre
 * les projectiles 15/magie (1 500 po), morsure magique suprême +2 à +5.
 *
 * Déjà au Grimoire, non resemées : Soins légers (= « Potion de soins » [17]),
 * Soins importants [23], Neutralisation du poison [7].
 *
 * Fait aussi le ménage : supprime les orphelines [25] « héro » et [26] « forme »
 * (créées par accident le 2026-10-05 au matin — Entrée en pleine frappe),
 * après vérification qu'aucun personnage ne les porte.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

type Entree = { nom: string; effet: string; niveau: number; desc: string }

const GDM = '[Guide du Maître]'
const P: Entree[] = [
  // ── 50 po (sorts de niveau 1, NLS 1) ──
  { nom: "Potion d'armure de mage", niveau: 1, effet: '+4 CA (armure intangible), 1 h', desc: `Bonus d'armure intangible de +4 à la CA pendant 1 heure (NLS 1) — efficace aussi contre les créatures intangibles. 50 po. ${GDM}` },
  { nom: 'Potion de bouclier de la foi (+2)', niveau: 1, effet: '+2 CA (parade), 1 min', desc: `Bonus de parade de +2 à la CA pendant 1 minute (NLS 1). 50 po. ${GDM}` },
  { nom: "Potion d'endurance aux énergies destructives", niveau: 1, effet: 'Confort par climat extrême, 24 h', desc: `Aucun jet ni dégât non létal dû au climat entre −45 °C et +60 °C pendant 24 heures (NLS 1). 50 po. ${GDM}` },
  { nom: "Potion d'invisibilité pour les animaux", niveau: 1, effet: 'Imperceptible des animaux, 10 min', desc: `Les animaux ne peuvent ni voir, ni entendre, ni flairer le buveur pendant 10 minutes (NLS 1). 50 po. ${GDM}` },
  { nom: "Potion d'invisibilité pour les morts-vivants", niveau: 1, effet: 'Imperceptible des morts-vivants, 10 min', desc: `Les morts-vivants ne perçoivent plus le buveur pendant 10 minutes (NLS 1); les morts-vivants intelligents ont droit à un jet de Volonté (DD 11). Attaquer met fin à l'effet. 50 po. ${GDM}` },
  { nom: 'Potion de morsure magique', niveau: 1, effet: '+1 à une arme naturelle, 1 min', desc: `Une arme naturelle du buveur gagne +1 à l'attaque et aux dégâts pendant 1 minute (NLS 1). 50 po. ${GDM}` },
  { nom: 'Potion de passage sans trace', niveau: 1, effet: 'Ni traces ni odeur, 1 h', desc: `Le buveur ne laisse aucune trace et ne peut être pisté par l'odeur pendant 1 heure (NLS 1). 50 po. ${GDM}` },
  { nom: 'Potion de protection contre le Mal', niveau: 1, effet: '+2 CA et +2 JdS contre les créatures mauvaises, 1 min', desc: `Bonus de parade de +2 à la CA et +2 de résistance aux JdS contre les créatures mauvaises; bloque aussi les contrôles mentaux et tient à distance les créatures convoquées mauvaises. 1 minute (NLS 1). 50 po. ${GDM}` },
  { nom: 'Potion de protection contre le Bien', niveau: 1, effet: '+2 CA et +2 JdS contre les créatures bonnes, 1 min', desc: `Comme protection contre le Mal, mais contre les créatures bonnes. 1 minute (NLS 1). 50 po. ${GDM}` },
  { nom: 'Potion de protection contre la Loi', niveau: 1, effet: '+2 CA et +2 JdS contre les créatures loyales, 1 min', desc: `Comme protection contre le Mal, mais contre les créatures loyales. 1 minute (NLS 1). 50 po. ${GDM}` },
  { nom: 'Potion de protection contre le Chaos', niveau: 1, effet: '+2 CA et +2 JdS contre les créatures chaotiques, 1 min', desc: `Comme protection contre le Mal, mais contre les créatures chaotiques. 1 minute (NLS 1). 50 po. ${GDM}` },
  { nom: "Potion de regain d'assurance", niveau: 1, effet: 'Supprime la peur; +4 contre la peur, 10 min', desc: `Supprime les effets de peur en cours et donne +4 de moral aux JdS contre la peur pendant 10 minutes (NLS 1). 50 po. ${GDM}` },
  { nom: 'Potion de sanctuaire', niveau: 1, effet: 'Les ennemis doivent réussir Volonté DD 11 pour attaquer le buveur, 1 round', desc: `Tout ennemi voulant attaquer le buveur doit réussir un jet de Volonté (DD 11), sinon il ne peut pas; le buveur rompt l'effet s'il attaque. 1 round (NLS 1). 50 po. ${GDM}` },
  { nom: 'Potion de saut', niveau: 1, effet: '+10 aux tests de Saut, 1 min', desc: `+10 d'altération aux tests de Saut pendant 1 minute (NLS 1). 50 po. ${GDM}` },
  // ── 250 po (sorts de niveau 1, NLS 5) ──
  { nom: "Potion d'agrandissement", niveau: 1, effet: 'Taille au-dessus : +2 For, −2 Dex, 5 min', desc: `Le buveur (et son équipement) grandit d'une catégorie de taille : +2 Force, −2 Dextérité, −1 à l'attaque et à la CA. 5 minutes (NLS 5). 250 po. ${GDM}` },
  { nom: 'Potion de rapetissement', niveau: 1, effet: 'Taille au-dessous : +2 Dex, −2 For, 5 min', desc: `Le buveur (et son équipement) rapetisse d'une catégorie de taille : +2 Dextérité, −2 Force, +1 à l'attaque et à la CA. 5 minutes (NLS 5). 250 po. ${GDM}` },
  // ── 300 po (sorts de niveau 2, NLS 3) ──
  { nom: "Potion d'aide", niveau: 2, effet: '+1 attaque et JdS contre la peur, +1d8+3 pv temporaires, 3 min', desc: `+1 de moral à l'attaque et aux JdS contre la peur, et 1d8+3 points de vie temporaires. 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: "Potion d'alignement indétectable", niveau: 2, effet: 'Alignement illisible, 24 h', desc: `Masque l'alignement du buveur à toute détection magique pendant 24 heures (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de bouclier de la foi (+3)', niveau: 1, effet: '+3 CA (parade), 6 min', desc: `Bonus de parade de +3 à la CA pendant 6 minutes (NLS 6). 300 po. ${GDM}` },
  { nom: 'Potion de délivrance de la paralysie', niveau: 2, effet: 'Libère de la paralysie', desc: `Libère le buveur de la paralysie et des effets qui entravent ses mouvements (immobilisation, lenteur). Instantané (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de détection faussée', niveau: 2, effet: 'Brouille les détections visant le buveur, 3 h', desc: `Les sorts de détection et de scrutation visant le buveur sont déroutés vers une autre créature ou un objet proche. 3 heures (NLS 3). 300 po. ${GDM}` },
  { nom: "Potion d'endurance de l'ours", niveau: 2, effet: '+4 Constitution, 3 min', desc: `+4 d'altération en Constitution (et les points de vie qui viennent avec) pendant 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de flou', niveau: 2, effet: 'Camouflage : 20 % d\'échec des attaques, 3 min', desc: `La silhouette du buveur devient floue : 20 % de chances d'échec sur les attaques qui le visent. 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de force de taureau', niveau: 2, effet: '+4 Force, 3 min', desc: `+4 d'altération en Force pendant 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de grâce féline', niveau: 2, effet: '+4 Dextérité, 3 min', desc: `+4 d'altération en Dextérité pendant 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: "Potion d'invisibilité", niveau: 2, effet: 'Invisible 3 min ou jusqu\'à une attaque', desc: `Le buveur devient invisible pendant 3 minutes (NLS 3); attaquer met fin à l'effet. 300 po. ${GDM}` },
  { nom: 'Potion de lévitation', niveau: 2, effet: 'Monte et descend à la verticale sur commande (NLS 3)', desc: `Le buveur peut s'élever ou descendre verticalement à volonté (pas de déplacement latéral). NLS 3 — durée du sort Lévitation. 300 po. ${GDM}` },
  { nom: "Potion de pattes d'araignée", niveau: 2, effet: 'Escalade murs et plafonds, 30 min', desc: `Le buveur escalade les murs et les plafonds comme une araignée (vitesse d'escalade 6 m, mains libres). 30 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: "Potion de peau d'écorce (+2)", niveau: 2, effet: '+2 CA (armure naturelle), 30 min', desc: `La peau durcit comme l'écorce : +2 d'altération à l'armure naturelle pendant 30 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de protection contre les projectiles (10/magie)', niveau: 2, effet: 'RD 10/magie contre les armes à distance, 3 h ou 30 points', desc: `Réduction de dégâts 10/magie contre les projectiles et armes à distance, jusqu'à 30 points absorbés ou 3 heures (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de ralentissement du poison', niveau: 2, effet: 'Suspend les effets d\'un poison, 3 h', desc: `Le poison présent dans le corps du buveur est sans effet pendant 3 heures (NLS 3) — il reprend ensuite son cours. 300 po. ${GDM}` },
  { nom: 'Potion de résistance aux énergies destructives (feu, 10)', niveau: 2, effet: 'Ignore les 10 premiers points de dégâts de feu de chaque attaque, 30 min', desc: `Résistance au feu 10 : chaque attaque de feu inflige 10 points de dégâts de moins. 30 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de résistance aux énergies destructives (froid, 10)', niveau: 2, effet: 'Ignore les 10 premiers points de dégâts de froid de chaque attaque, 30 min', desc: `Résistance au froid 10 : chaque attaque de froid inflige 10 points de dégâts de moins. 30 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de résistance aux énergies destructives (acide, 10)', niveau: 2, effet: 'Ignore les 10 premiers points de dégâts d\'acide de chaque attaque, 30 min', desc: `Résistance à l'acide 10 : chaque attaque d'acide inflige 10 points de dégâts de moins. 30 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de résistance aux énergies destructives (électricité, 10)', niveau: 2, effet: 'Ignore les 10 premiers points de dégâts d\'électricité de chaque attaque, 30 min', desc: `Résistance à l'électricité 10 : chaque attaque d'électricité inflige 10 points de dégâts de moins. 30 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de résistance aux énergies destructives (son, 10)', niveau: 2, effet: 'Ignore les 10 premiers points de dégâts de son de chaque attaque, 30 min', desc: `Résistance au son 10 : chaque attaque sonique inflige 10 points de dégâts de moins. 30 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de restauration partielle', niveau: 2, effet: 'Rend 1d4 points d\'affaiblissement temporaire', desc: `Dissipe un effet magique qui diminue une caractéristique, ou rend 1d4 points d'affaiblissement temporaire à une caractéristique (au choix du buveur). Instantané (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de ruse du renard', niveau: 2, effet: '+4 Intelligence, 3 min', desc: `+4 d'altération en Intelligence pendant 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de sagesse du hibou', niveau: 2, effet: '+4 Sagesse, 3 min', desc: `+4 d'altération en Sagesse pendant 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de soins modérés', niveau: 2, effet: 'Rend 2d8+3 points de vie', desc: `Rend 2d8+3 points de vie (NLS 3). 300 po. ${GDM}` },
  { nom: "Potion de splendeur de l'aigle", niveau: 2, effet: '+4 Charisme, 3 min', desc: `+4 d'altération en Charisme pendant 3 minutes (NLS 3). 300 po. ${GDM}` },
  { nom: 'Potion de vision dans le noir', niveau: 2, effet: 'Vision dans le noir à 18 m (NLS 3)', desc: `Le buveur voit dans le noir total jusqu'à 18 mètres (NLS 3 — durée du sort Vision dans le noir). 300 po. ${GDM}` },
  // ── 600 po ──
  { nom: 'Potion de bouclier de la foi (+4)', niveau: 1, effet: '+4 CA (parade), 12 min', desc: `Bonus de parade de +4 à la CA pendant 12 minutes (NLS 12). 600 po. ${GDM}` },
  { nom: "Potion de peau d'écorce (+3)", niveau: 2, effet: '+3 CA (armure naturelle), 1 h', desc: `+3 d'altération à l'armure naturelle pendant 1 heure (NLS 6). 600 po. ${GDM}` },
  // ── 750 po (sorts de niveau 3, NLS 5) ──
  { nom: "Potion d'antidétection", niveau: 3, effet: 'Protège de la scrutation et des détections, 5 h', desc: `Le buveur devient difficile à détecter par divination et scrutation (boule de cristal, détections…) : test de NLS contre DD 15 requis. 5 heures (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de cercle magique contre le Mal', niveau: 3, effet: 'Protection contre le Mal sur 3 m de rayon, 50 min', desc: `Comme protection contre le Mal (+2 CA, +2 JdS, blocage des contrôles mentaux), sur 3 mètres de rayon autour du buveur. 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de cercle magique contre le Bien', niveau: 3, effet: 'Protection contre le Bien sur 3 m de rayon, 50 min', desc: `Comme protection contre le Bien, sur 3 mètres de rayon autour du buveur. 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de cercle magique contre la Loi', niveau: 3, effet: 'Protection contre la Loi sur 3 m de rayon, 50 min', desc: `Comme protection contre la Loi, sur 3 mètres de rayon autour du buveur. 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de cercle magique contre le Chaos', niveau: 3, effet: 'Protection contre le Chaos sur 3 m de rayon, 50 min', desc: `Comme protection contre le Chaos, sur 3 mètres de rayon autour du buveur. 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de délivrance des malédictions', niveau: 3, effet: 'Lève les malédictions du buveur', desc: `Lève toutes les malédictions qui affectent le buveur (NLS 5). Instantané. 750 po. ${GDM}` },
  { nom: 'Potion de déplacement', niveau: 3, effet: 'Camouflage total : 50 % d\'échec des attaques, 5 rounds', desc: `Le buveur semble être à côté de sa position réelle : 50 % de chances d'échec sur les attaques qui le visent. 5 rounds (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de don des langues', niveau: 3, effet: 'Parle et comprend toutes les langues, 50 min', desc: `Le buveur parle et comprend n'importe quelle langue parlée. 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: "Potion d'état gazeux", niveau: 3, effet: 'Brume : vol 3 m (parfaite), RD 10/magie, 10 min', desc: `Le buveur et son équipement deviennent une brume translucide : vol 3 m (manœuvrabilité parfaite), RD 10/magie, passe par les moindres interstices; impossible d'attaquer ou de lancer des sorts. 10 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de guérison de la cécité/surdité', niveau: 3, effet: 'Guérit la cécité ou la surdité', desc: `Guérit la cécité ou la surdité, qu'elle soit d'origine magique ou non. Instantané (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de guérison des maladies', niveau: 3, effet: 'Guérit toutes les maladies', desc: `Guérit toutes les maladies dont souffre le buveur, y compris la cécité des marais et la lèpre. Instantané (NLS 5). 750 po. ${GDM}` },
  { nom: "Potion d'héroïsme", niveau: 3, effet: '+2 (moral) attaque, JdS et compétences, 50 min', desc: `+2 de moral à l'attaque, aux jets de sauvegarde et aux tests de compétence pendant 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de lumière du jour', niveau: 3, effet: 'Le buveur rayonne une lumière vive sur 18 m, 50 min', desc: `Le buveur émet une lumière équivalente au plein jour sur 18 mètres de rayon pendant 50 minutes (NLS 5) — les créatures que la lumière blesse en subissent les effets. 750 po. ${GDM}` },
  { nom: "Potion de marche sur l'onde", niveau: 3, effet: 'Marche sur l\'eau et les liquides, 50 min', desc: `Le buveur marche sur l'eau, la boue, les sables mouvants et même la lave (la chaleur brûle quand même) comme sur la terre ferme. 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de morsure magique suprême (+1)', niveau: 3, effet: '+1 à toutes les armes naturelles, 5 h', desc: `Toutes les armes naturelles du buveur gagnent +1 à l'attaque et aux dégâts pendant 5 heures (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de protection contre les énergies destructives (feu)', niveau: 3, effet: 'Absorbe les 60 premiers points de dégâts de feu, 50 min', desc: `Absorbe entièrement les dégâts de feu subis, jusqu'à 60 points ou 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de protection contre les énergies destructives (froid)', niveau: 3, effet: 'Absorbe les 60 premiers points de dégâts de froid, 50 min', desc: `Absorbe entièrement les dégâts de froid subis, jusqu'à 60 points ou 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de protection contre les énergies destructives (acide)', niveau: 3, effet: 'Absorbe les 60 premiers points de dégâts d\'acide, 50 min', desc: `Absorbe entièrement les dégâts d'acide subis, jusqu'à 60 points ou 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de protection contre les énergies destructives (électricité)', niveau: 3, effet: 'Absorbe les 60 premiers points de dégâts d\'électricité, 50 min', desc: `Absorbe entièrement les dégâts d'électricité subis, jusqu'à 60 points ou 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de protection contre les énergies destructives (son)', niveau: 3, effet: 'Absorbe les 60 premiers points de dégâts de son, 50 min', desc: `Absorbe entièrement les dégâts soniques subis, jusqu'à 60 points ou 50 minutes (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de rage', niveau: 3, effet: 'Rage : +2 For, +2 Con, +1 Volonté, −2 CA (NLS 5)', desc: `Le buveur entre en rage comme un barbare : +2 de moral en Force et en Constitution, +1 aux jets de Volonté, −2 à la CA (NLS 5 — durée du sort Rage). 750 po. ${GDM}` },
  { nom: 'Potion de rapidité', niveau: 3, effet: 'Action supplémentaire par round, +1 attaque, CA et Réflexes, 5 rounds', desc: `Une attaque supplémentaire lors d'une attaque à outrance, +1 à l'attaque, +1 d'esquive à la CA et aux Réflexes, déplacement augmenté. 5 rounds (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de respiration aquatique', niveau: 3, effet: 'Respire sous l\'eau, 10 h', desc: `Le buveur respire librement sous l'eau pendant 10 heures (NLS 5). 750 po. ${GDM}` },
  { nom: 'Potion de vol', niveau: 3, effet: 'Vol 18 m (manœuvrabilité bonne), 5 min', desc: `Le buveur vole à 18 mètres par round (manœuvrabilité bonne) pendant 5 minutes (NLS 5); si l'effet cesse en plein vol, il descend doucement de 18 m par round. 750 po. ${GDM}` },
  // ── 900 po et plus ──
  { nom: 'Potion de bouclier de la foi (+5)', niveau: 1, effet: '+5 CA (parade), 18 min', desc: `Bonus de parade de +5 à la CA pendant 18 minutes (NLS 18). 900 po. ${GDM}` },
  { nom: "Potion de peau d'écorce (+4)", niveau: 2, effet: '+4 CA (armure naturelle), 90 min', desc: `+4 d'altération à l'armure naturelle pendant 90 minutes (NLS 9). 900 po. ${GDM}` },
  { nom: "Potion d'espoir", niveau: 3, effet: '+2 (moral) attaque, dégâts, JdS et compétences, 7 min', desc: `Un puissant espoir : +2 de moral à l'attaque, aux dégâts, aux jets de sauvegarde et aux tests de compétence pendant 7 minutes (NLS 7). 1 050 po. ${GDM}` },
  { nom: "Potion de peau d'écorce (+5)", niveau: 2, effet: '+5 CA (armure naturelle), 2 h', desc: `+5 d'altération à l'armure naturelle pendant 2 heures (NLS 12). 1 200 po. ${GDM}` },
]

// Comparaison insensible à la casse et aux accents, comme la recherche du site.
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const avant = await sql`select id, nom from potions order by id` as any[]
console.log(`AVANT : ${avant.length} références`)
const existants = new Set(avant.map(p => norm(p.nom)))

const collisions = P.filter(p => existants.has(norm(p.nom)))
if (collisions.length) {
  console.log('⚠️ Déjà en base, sautées :', collisions.map(c => c.nom).join(' | '))
}
const aInserer = P.filter(p => !existants.has(norm(p.nom)))

// Doublons internes à la liste? (erreur de transcription)
const vus = new Set<string>()
for (const p of P) {
  if (vus.has(norm(p.nom))) throw new Error(`Doublon dans la liste : ${p.nom}`)
  vus.add(norm(p.nom))
}

// ── Orphelines « héro » [25] et « forme » [26] : vérifier avant de supprimer ──
const orphelines = await sql`select id, nom, sort_effet from potions where id in (25, 26)` as any[]
const porteurs = await sql`select potion_id, count(*) as n from character_potions where potion_id in (25, 26) group by potion_id` as any[]
console.log('Orphelines trouvées :', JSON.stringify(orphelines))
console.log('Porteurs des orphelines :', JSON.stringify(porteurs))
const okSuppression = porteurs.length === 0
  && orphelines.every(o => (o.nom === 'héro' || o.nom === 'forme') && !o.sort_effet)

if (!okSuppression) {
  console.log('⛔ Les ids 25/26 ne correspondent pas aux orphelines attendues ou ont des porteurs — suppression ANNULÉE.')
} else {
  await sql`delete from potions where id in (25, 26)`
  console.log('✅ Orphelines [25] « héro » et [26] « forme » supprimées (aucun porteur).')
}

for (const p of aInserer) {
  await sql`insert into potions (nom, sort_effet, niveau, charges_max, description)
            values (${p.nom}, ${p.effet}, ${p.niveau}, 1, ${p.desc})`
}
console.log(`✅ ${aInserer.length} potions du Guide du Maître insérées.`)

const apres = await sql`select count(*)::int as n from potions` as any[]
const gaz = await sql`select id, nom, sort_effet from potions where nom ilike '%gazeux%'` as any[]
console.log(`APRÈS : ${apres[0].n} références.`)
console.log('Contrôle état gazeux :', JSON.stringify(gaz))

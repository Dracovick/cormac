/* Nommer le métier de Duncan Darkvale [97], et porter ce nom dans son histoire.
 *
 *   node scripts/nommer-profession-duncan.mjs            (mesure seule, rien n'est écrit)
 *   node scripts/nommer-profession-duncan.mjs --appliquer
 *
 * André, le 2026-11-16 : « Le métier de Duncan est: Joueur professionnel. Un Gambler... »
 *
 * Deux volets.
 *
 * 1. LA FICHE. Sa ligne de compétence pointe sur `skills` 174, « Profession »
 *    tout court — la fiche générique du Manuel, portée aussi par Drakara [70].
 *    ⛔ On ne la RENOMME donc pas : on crée « Profession (joueur) » sur le modèle
 *    des six spécialités qui existent déjà (est_catalogue false, catalogue_id 174)
 *    et on repointe la seule ligne de Duncan.
 *    ⚠ Ce repointage n'est possible que depuis le repli de statut ajouté à
 *    `src/lib/dnd35/skills.ts` : sans lui, une spécialité cesse d'être comptée
 *    comme compétence de classe, et son PLAFOND DE RANGS tombe de N+3 à (N+3)/2.
 *    Les 8 rangs de Duncan sont exactement à N+3.
 *
 * 2. L'HISTOIRE. Un chapitre neuf, inséré après « Tymora », et quatre retouches
 *    aux endroits qui disaient « un métier que sa fiche ne nomme pas encore ».
 *    Chaque retouche exige que son ancre apparaisse EXACTEMENT une fois : un
 *    texte déjà retouché, ou retouché à la main entre-temps, fait échouer le
 *    script au lieu de produire un doublon silencieux.
 *
 * ⛔ Aucun process.exit() au succès : sur Windows, la connexion neon encore
 * ouverte fait sortir Node en 127 — un succès qui ressemble à un échec.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { grasImbriques } from './lib-gras-imbrique.mjs'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APPLIQUER = process.argv.includes('--appliquer')
const PERSONNAGE = 97
const SKILL_GENERIQUE = 174
const NOM_SPECIALITE = 'Profession (joueur)'
const SOURCE_CHAPITRE = process.argv[2]?.startsWith('--') ? null : process.argv[2]
const CHEMIN_CHAPITRE = SOURCE_CHAPITRE ?? 'C:/Users/draco/.buzz/.scratch/draco-duncan-metier.md'
const TITRE_CHAPITRE = 'Le métier — joueur professionnel'
const ORDRE_CHAPITRE = 2 // juste après « Tymora, et les trois pièces »
const MAX_CONTENU = 12_000 // égal à MAX_CONTENU_CHAPITRE de src/lib/histoire.ts

const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const sql = neon(env.match(/DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/)[1].trim())

const dire = (s) => console.log(s)
let fautes = 0
const exiger = (condition, message) => { if (!condition) { fautes++; console.log(`  ❌ ${message}`) } }

// ── Les quatre retouches, ancre -> remplacement ──────────────────────────────
const RETOUCHES = [
  {
    chapitre: 'Vingt et un ans, et déjà « le magnifique »',
    ancre: "Et **Profession 8**. Huit rangs. Un métier appris pour de bon, avant tout ça, et que sa fiche ne nomme pas encore.\n\n*C'est le trou le plus intéressant de sa feuille. Un garçon ne met pas huit rangs dans un métier par accident : il l'a exercé. Lequel ? C'est à son joueur de le dire — et le jour où il le dira, la moitié de son passé sera écrite d'un coup.*",
    vers: "Et **Profession (joueur) 8**. Huit rangs — le plafond exact à son niveau. Un métier appris pour de bon, avant tout le reste : **Duncan est joueur professionnel.**\n\n*C'était le trou le plus intéressant de sa feuille, et il est comblé. Un garçon ne met pas huit rangs dans un métier par accident : il l'a exercé, et il en a vécu. Le chapitre « Le métier » ne parle que de ça.*",
  },
  {
    chapitre: 'Darkvale — ce qui y est arrivé il y a trois ans',
    ancre: "Et un garçon de dix-huit ans, qui avait un métier et des mains habiles et aucune raison particulière de survivre, s'est trouvé utile pendant ces semaines-là.",
    vers: "Et un garçon de dix-huit ans — qui gagnait déjà sa vie assis à une table, qui avait des mains habiles et aucune raison particulière de survivre — s'est trouvé utile pendant ces semaines-là. Un joueur professionnel sait deux choses qui valent cher dans une vallée assiégée : lire un homme qui ment sur ce qu'il a vu, et rester calme longtemps après que tout le monde a cessé de l'être.",
  },
  {
    chapitre: 'Aza — l\'énigme qu\'il ne sous-estime pas',
    ancre: "Duncan Darkvale, vingt et un ans, s'est inscrit à la **course d'obstacles**. Évidemment.\n",
    vers: "Duncan Darkvale, vingt et un ans, s'est inscrit à la **course d'obstacles**. Évidemment.\n\n*Un joueur professionnel voyait parfaitement que les épreuves étaient taillées à l'avantage des hins. C'est exactement pour ça qu'il s'est inscrit : une table honnête ne l'a jamais intéressé.*\n",
  },
  {
    chapitre: 'Aza — l\'énigme qu\'il ne sous-estime pas',
    ancre: "Duncan sous-estime beaucoup de gens. **Il ne la sous-estime pas.**",
    vers: "Duncan sous-estime beaucoup de gens. **Il ne la sous-estime pas.**\n\nEt il y a autre chose, qu'il n'avouerait à personne. Duncan vit de lire les gens : c'est son métier, et il y a mis tous les rangs qu'un homme de son niveau peut y mettre. **Le seul visage qu'il n'a pas su déchiffrer de toute sa vie est celui d'une halfeline de trente-huit ans qu'il a prise pour une enfant perdue.** Ça ne lui arrive pas. Ça lui est arrivé une fois.",
  },
  {
    chapitre: 'Le trio',
    ancre: "- **Quel métier** il a appris avant tout ça — huit rangs de Profession attendent un nom.",
    vers: "- **Où il a appris à jouer**, et avec l'argent de qui il a commencé. Un garçon de Darkvale ne naît pas avec une mise.",
  },
]

// ── Volet 1 : la compétence ──────────────────────────────────────────────────
dire('— LA FICHE')
const generique = (await sql`SELECT id, nom, caracteristique FROM skills WHERE id = ${SKILL_GENERIQUE}`)[0]
exiger(generique?.nom === 'Profession', `skills ${SKILL_GENERIQUE} devrait être « Profession », trouvé ${JSON.stringify(generique?.nom)}`)

const dejaLa = await sql`SELECT id FROM skills WHERE nom = ${NOM_SPECIALITE}`
const ligneDuncan = await sql`
  SELECT cs.id, cs.skill_id, cs.rangs_investis, s.nom
  FROM character_skills cs JOIN skills s ON s.id = cs.skill_id
  WHERE cs.personnage_id = ${PERSONNAGE} AND s.nom ILIKE 'profession%'`
exiger(ligneDuncan.length === 1, `Duncan devrait porter UNE seule ligne de Profession, trouvé ${ligneDuncan.length}`)
exiger(ligneDuncan[0]?.rangs_investis === 8, `ses rangs devraient être 8, trouvé ${ligneDuncan[0]?.rangs_investis}`)
dire(`  ligne actuelle : skills ${ligneDuncan[0]?.skill_id} « ${ligneDuncan[0]?.nom} », ${ligneDuncan[0]?.rangs_investis} rangs`)
dire(`  « ${NOM_SPECIALITE} » existe déjà : ${dejaLa.length > 0 ? `oui (id ${dejaLa[0].id})` : 'non, à créer'}`)

// ── Volet 2 : l'histoire ─────────────────────────────────────────────────────
dire('\n— L\'HISTOIRE')
const contenuChapitre = fs.readFileSync(CHEMIN_CHAPITRE, 'utf8').replace(/\r\n/g, '\n').trim()
exiger(contenuChapitre.length > 0, 'le fichier du chapitre est vide')
exiger(contenuChapitre.length <= MAX_CONTENU, `le chapitre fait ${contenuChapitre.length} car., plafond ${MAX_CONTENU}`)
exiger(grasImbriques(contenuChapitre).length === 0, "gras imbrique dans un italique : le moteur de rendu avale le gras")
dire(`  chapitre à insérer : « ${TITRE_CHAPITRE} », ${contenuChapitre.length} car., ordre ${ORDRE_CHAPITRE}`)

const chapitres = await sql`SELECT id, ordre, titre, contenu FROM character_story_chapters WHERE personnage_id = ${PERSONNAGE} ORDER BY ordre`
exiger(chapitres.length === 8, `Duncan devrait avoir 8 chapitres avant l'opération, trouvé ${chapitres.length}`)
exiger(!chapitres.some(c => c.titre === TITRE_CHAPITRE), 'le chapitre existe déjà — deux passages feraient un doublon')

const aEcrire = []
for (const [i, r] of RETOUCHES.entries()) {
  const cible = chapitres.find(c => c.titre === r.chapitre)
  if (!cible) { fautes++; dire(`  ❌ retouche ${i + 1} : chapitre « ${r.chapitre} » introuvable`); continue }
  const dansCeQuOnVaEcrire = aEcrire.find(a => a.id === cible.id)
  const depart = dansCeQuOnVaEcrire ? dansCeQuOnVaEcrire.contenu : cible.contenu
  const occurrences = depart.split(r.ancre).length - 1
  if (occurrences !== 1) { fautes++; dire(`  ❌ retouche ${i + 1} : l'ancre apparaît ${occurrences} fois dans « ${r.chapitre} » (attendu 1)`); continue }
  const apres = depart.replace(r.ancre, r.vers)
  if (apres.length > MAX_CONTENU) { fautes++; dire(`  ❌ retouche ${i + 1} : dépasserait le plafond (${apres.length} car.)`); continue }
  // ⛔ Le même garde que pour le chapitre neuf, appliqué au RÉSULTAT de la
  // retouche : un `**gras**` glissé à l'intérieur d'un `*italique*` est avalé
  // par le moteur de rendu, sans laisser d'astérisque visible. Mesuré le
  // 2026-11-16 : 109 gras écrits, 104 rendus.
  const avales = grasImbriques(apres)
  if (avales.length > 0) { fautes++; dire(`  X retouche ${i + 1} : ${avales.length} gras imbrique(s) dans un italique`); continue }
  if (dansCeQuOnVaEcrire) dansCeQuOnVaEcrire.contenu = apres
  else aEcrire.push({ id: cible.id, titre: cible.titre, avant: cible.contenu.length, contenu: apres })
  // ⚠ On affiche `depart`, pas `cible.contenu` : deux retouches dans le même
  // chapitre s'enchaînent, et partir de l'original à chaque fois ferait mentir
  // la mesure (la seconde annoncerait 2644 au lieu de 2838).
  dire(`  ✅ retouche ${i + 1} : « ${r.chapitre} » ${depart.length} -> ${apres.length} car.`)
}

if (fautes > 0) { console.error(`\n⛔ ${fautes} faute(s). Rien n'a été écrit.`); process.exit(1) }

if (!APPLIQUER) {
  dire('\n— MESURE SEULE. Rien n\'a été écrit. Relancer avec --appliquer.')
} else {
  dire('\n— ÉCRITURE')
  let skillId = dejaLa[0]?.id
  if (!skillId) {
    const cree = await sql`
      INSERT INTO skills (nom, caracteristique, formation_requise, est_catalogue, catalogue_id, malus_armure)
      VALUES (${NOM_SPECIALITE}, 'SAG', false, false, ${SKILL_GENERIQUE}, false)
      RETURNING id`
    skillId = cree[0].id
    dire(`  skills ${skillId} « ${NOM_SPECIALITE} » créée (catalogue_id ${SKILL_GENERIQUE})`)
  }
  await sql`UPDATE character_skills SET skill_id = ${skillId} WHERE id = ${ligneDuncan[0].id}`
  dire(`  ligne de Duncan repointée sur skills ${skillId}`)

  // Les chapitres à partir d'ORDRE_CHAPITRE descendent d'un rang, puis on insère.
  const decales = await sql`
    UPDATE character_story_chapters SET ordre = ordre + 1
    WHERE personnage_id = ${PERSONNAGE} AND ordre >= ${ORDRE_CHAPITRE} RETURNING id`
  dire(`  ${decales.length} chapitres décalés d'un rang`)
  const insere = await sql`
    INSERT INTO character_story_chapters (personnage_id, titre, contenu, ordre, signature)
    VALUES (${PERSONNAGE}, ${TITRE_CHAPITRE}, ${contenuChapitre}, ${ORDRE_CHAPITRE}, 'Dracovick')
    RETURNING id`
  dire(`  chapitre ${insere[0].id} inséré à l'ordre ${ORDRE_CHAPITRE}`)
  for (const a of aEcrire) {
    await sql`UPDATE character_story_chapters SET contenu = ${a.contenu}, updated_at = now() WHERE id = ${a.id}`
    dire(`  chapitre ${a.id} « ${a.titre} » réécrit (${a.avant} -> ${a.contenu.length} car.)`)
  }

  // ── Relecture, depuis la base, caractère par caractère ─────────────────────
  dire('\n— RELECTURE')
  const relus = await sql`SELECT id, ordre, titre, contenu FROM character_story_chapters WHERE personnage_id = ${PERSONNAGE} ORDER BY ordre`
  let relecture = 0
  const controler = (ok, m) => { if (!ok) { relecture++; dire(`  ❌ ${m}`) } else dire(`  ✅ ${m}`) }
  controler(relus.length === 9, `9 chapitres en base (trouvé ${relus.length})`)
  controler(relus.map(c => c.ordre).join(',') === '0,1,2,3,4,5,6,7,8', `ordres compacts et sans trou : ${relus.map(c => c.ordre).join(',')}`)
  const neuf = relus.find(c => c.titre === TITRE_CHAPITRE)
  controler(neuf?.contenu === contenuChapitre, `le chapitre neuf est identique au fichier source (${neuf?.contenu.length} car.)`)
  controler(neuf?.ordre === ORDRE_CHAPITRE, `il est bien au rang ${ORDRE_CHAPITRE}`)
  for (const a of aEcrire) {
    const r = relus.find(c => c.id === a.id)
    controler(r?.contenu === a.contenu, `chapitre ${a.id} « ${a.titre} » relu identique`)
  }
  for (const r of RETOUCHES) {
    const cible = relus.find(c => c.titre === r.chapitre)
    controler(cible && !cible.contenu.includes(r.ancre), `l'ancien texte de « ${r.chapitre} » a bien disparu`)
  }
  const ligneRelue = await sql`
    SELECT s.nom, cs.rangs_investis FROM character_skills cs JOIN skills s ON s.id = cs.skill_id
    WHERE cs.id = ${ligneDuncan[0].id}`
  controler(ligneRelue[0]?.nom === NOM_SPECIALITE, `la fiche porte « ${ligneRelue[0]?.nom} »`)
  controler(ligneRelue[0]?.rangs_investis === 8, `ses 8 rangs sont intacts (${ligneRelue[0]?.rangs_investis})`)
  const drakara = await sql`SELECT cs.rangs_investis, s.nom FROM character_skills cs JOIN skills s ON s.id = cs.skill_id WHERE cs.personnage_id = 70 AND s.id = ${SKILL_GENERIQUE}`
  controler(drakara[0]?.rangs_investis === 11, `témoin : Drakara [70] garde « Profession » générique à 11 rangs`)
  const aza = await sql`SELECT count(*)::int AS n, sum(length(contenu))::int AS t FROM character_story_chapters WHERE personnage_id = 98`
  controler(aza[0]?.n === 7 && aza[0]?.t === 14561, `témoin : Azadrielle [98] n'a pas bougé (${aza[0]?.n} chapitres, ${aza[0]?.t} car.)`)

  if (relecture > 0) { console.error(`\n⛔ ${relecture} échec(s) à la relecture.`); process.exit(1) }
  dire('\n✅ Tout est écrit et relu.')
}

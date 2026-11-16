/**
 * CONTRÔLES — l'histoire du personnage (drizzle/0018).
 *
 *   npx tsx scripts/controle-histoire.mts
 *
 * Trois sections :
 *   1. les garde-fous de saisie  — ce qui part en base
 *   2. la mise en forme du récit — ce qui s'affiche
 *   3. la base réelle            — la table existe, et ce qu'elle porte
 *
 * ⭐ Les attendus sont écrits À LA MAIN, jamais produits en rappelant la
 * fonction qu'ils contrôlent : un contrôle qui redemande au code ce que le code
 * vient de calculer rend toujours vert.
 * ⭐ Et chaque section porte un TÉMOIN INVERSE — un cas qui doit ÉCHOUER à être
 * reconnu. Sans lui, un découpage qui accepte tout passerait au vert.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MAX_CONTENU_CHAPITRE,
  MAX_SIGNATURE,
  MAX_TITRE_CHAPITRE,
  ancreChapitre,
  blocsHistoire,
  compteMots,
  contenuChapitre,
  dateCourte,
  fragmentsDe,
  texteNu,
  valeursChapitre,
} from '../src/lib/histoire'

let ok = 0
const echecs: string[] = []
function verifier(titre: string, condition: boolean, detail = '') {
  if (condition) ok++
  else echecs.push(`${titre}${detail ? ` — ${detail}` : ''}`)
}
function egal(titre: string, obtenu: unknown, attendu: unknown) {
  verifier(titre, JSON.stringify(obtenu) === JSON.stringify(attendu),
    `obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`)
}

// ─── 1. Les garde-fous de saisie ──────────────────────────────────────────────
egal('titre : espaces écrasés et rognés',
  valeursChapitre({ titre: '  Mon   village  ' }).titre, 'Mon village')
egal('titre : les retours à la ligne deviennent un espace (un titre est une ligne)',
  valeursChapitre({ titre: 'Mon\nvillage' }).titre, 'Mon village')
verifier('titre : tronqué à la longueur de colonne',
  valeursChapitre({ titre: 'x'.repeat(MAX_TITRE_CHAPITRE + 50) }).titre.length === MAX_TITRE_CHAPITRE)
egal('titre absent → chaîne vide, et les actions refusent',
  valeursChapitre({}).titre, '')

egal('⭐ contenu : les lignes vides internes SURVIVENT (elles font les paragraphes)',
  contenuChapitre('un\n\ndeux'), 'un\n\ndeux')
egal('contenu : les espaces en fin de ligne partent (l’Apple Pencil en laisse)',
  contenuChapitre('un   \ndeux\t'), 'un\ndeux')
egal('contenu : les retours en trop au début et à la fin partent',
  contenuChapitre('\n\nun\n\n\n'), 'un')
egal('contenu : les CRLF de Windows deviennent des LF',
  contenuChapitre('un\r\ndeux\rtrois'), 'un\ndeux\ntrois')
verifier('contenu : tronqué à la limite du chapitre',
  contenuChapitre('x'.repeat(MAX_CONTENU_CHAPITRE + 1000)).length === MAX_CONTENU_CHAPITRE)

egal('⭐ signature vide → null, et non la chaîne vide (personne n’a signé)',
  valeursChapitre({ titre: 'T', signature: '   ' }).signature, null)
egal('signature : rognée et écrasée',
  valeursChapitre({ titre: 'T', signature: ' André  B ' }).signature, 'André B')
verifier('signature : tronquée à la longueur de colonne',
  (valeursChapitre({ titre: 'T', signature: 'x'.repeat(MAX_SIGNATURE + 20) }).signature ?? '').length === MAX_SIGNATURE)

egal('ancre bâtie sur l’ID, jamais sur le titre (deux chapitres peuvent se nommer pareil)',
  ancreChapitre(42), 'chapitre-42')

// ─── 2. La mise en forme du récit ─────────────────────────────────────────────
egal('paragraphe simple',
  blocsHistoire('Il était une fois.'),
  [{ sorte: 'paragraphe', fragments: [{ sorte: 'texte', texte: 'Il était une fois.' }] }])

egal('une ligne vide sépare deux paragraphes',
  blocsHistoire('un\n\ndeux').map(b => b.sorte), ['paragraphe', 'paragraphe'])

egal('⭐ un simple retour à la ligne NE coupe PAS le paragraphe, il recolle',
  blocsHistoire('un\ndeux'),
  [{ sorte: 'paragraphe', fragments: [{ sorte: 'texte', texte: 'un deux' }] }])

egal('### fait un intertitre',
  blocsHistoire('### Le clan'),
  [{ sorte: 'titre', fragments: [{ sorte: 'texte', texte: 'Le clan' }] }])
egal('# et ## aussi, rendus du même niveau',
  blocsHistoire('# A\n\n## B').map(b => b.sorte), ['titre', 'titre'])
egal('⭐ témoin inverse : un dièse SANS espace reste du texte (#1, #hashtag)',
  blocsHistoire('#1 au classement').map(b => b.sorte), ['paragraphe'])

egal('> fait une citation',
  blocsHistoire('> Tu as bien couru.'),
  [{ sorte: 'citation', fragments: [{ sorte: 'texte', texte: 'Tu as bien couru.' }] }])
egal('deux lignes de citation n’en font qu’une',
  blocsHistoire('> un\n> deux'),
  [{ sorte: 'citation', fragments: [{ sorte: 'texte', texte: 'un deux' }] }])

egal('- fait une liste de deux items',
  blocsHistoire('- un\n- deux'),
  [{ sorte: 'liste', items: [[{ sorte: 'texte', texte: 'un' }], [{ sorte: 'texte', texte: 'deux' }]] }])
egal('⭐ le tiret cadratin aussi — l’iPad transforme deux tirets tout seul',
  blocsHistoire('— un\n— deux').map(b => b.sorte), ['liste'])
egal('⭐ témoin inverse : un tiret SANS espace reste du texte (« -5 au jet »)',
  blocsHistoire('-5 au jet de dés').map(b => b.sorte), ['paragraphe'])

egal('une liste puis un paragraphe : deux blocs distincts',
  blocsHistoire('- un\ndu texte ensuite').map(b => b.sorte), ['liste', 'paragraphe'])
egal('titre, citation, liste, paragraphe à la suite',
  blocsHistoire('### T\n> c\n- i\np').map(b => b.sorte), ['titre', 'citation', 'liste', 'paragraphe'])
egal('texte vide → aucun bloc', blocsHistoire(''), [])
egal('que des lignes vides → aucun bloc', blocsHistoire('\n\n   \n'), [])

egal('**gras**',
  fragmentsDe('un **mot** fort'),
  [{ sorte: 'texte', texte: 'un ' }, { sorte: 'gras', texte: 'mot' }, { sorte: 'texte', texte: ' fort' }])
egal('*italique*',
  fragmentsDe('un *mot* penché'),
  [{ sorte: 'texte', texte: 'un ' }, { sorte: 'italique', texte: 'mot' }, { sorte: 'texte', texte: ' penché' }])
egal('⭐ LE piège : le gras est cherché AVANT l’italique, sinon ** rend des astérisques orphelines',
  fragmentsDe('**gras**').map(f => f.sorte), ['gras'])
egal('⭐ témoin inverse : une astérisque non refermée reste du TEXTE',
  fragmentsDe('3 * 4 = 12'), [{ sorte: 'texte', texte: '3 * 4 = 12' }])
egal('⭐ témoin inverse : un gras non refermé reste du texte',
  fragmentsDe('**pas fermé'), [{ sorte: 'texte', texte: '**pas fermé' }])
egal('gras et italique dans la même ligne',
  fragmentsDe('**a** et *b*').map(f => f.sorte), ['gras', 'texte', 'italique'])
egal('⛔ aucun HTML interprété : les chevrons restent du texte',
  fragmentsDe('<script>alert(1)</script>'),
  [{ sorte: 'texte', texte: '<script>alert(1)</script>' }])

// ⭐ Rien ne doit se perdre en route : le texte nu des fragments doit redonner
// la ligne, délimiteurs retirés. Ce contrôle-là attrape une boucle qui mange un
// caractère, ce qu'aucun cas particulier ne verrait.
for (const ligne of ['un **deux** trois', 'a *b* c', 'sans rien', '**a**b*c*', '***', '*']) {
  const attendu = ligne.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  egal(`aucun caractère perdu : « ${ligne} »`, texteNu(fragmentsDe(ligne)), attendu)
}

verifier('compteMots : une phrase de 5 mots', compteMots('un deux trois quatre cinq') === 5)
verifier('compteMots : les marques de forme ne comptent pas comme des mots',
  compteMots('### **un** deux') === 2, `obtenu ${compteMots('### **un** deux')}`)
verifier('compteMots : texte vide → 0', compteMots('') === 0)
verifier('dateCourte : une date réelle rend du français',
  dateCourte(new Date('2026-11-15T12:00:00Z')).includes('2026'))
verifier('⭐ témoin inverse : une date invalide rend du vide, pas « Invalid Date »',
  dateCourte('pas une date') === '')
verifier('dateCourte : null rend du vide', dateCourte(null) === '')

// ─── 3. La base réelle ────────────────────────────────────────────────────────
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable')
const sql = neon(url)

const colonnes = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'character_story_chapters'
  ORDER BY ordinal_position`

verifier('la table character_story_chapters existe', colonnes.length > 0,
  `${colonnes.length} colonne(s)`)

const attenduesColonnes = ['id', 'personnage_id', 'titre', 'contenu', 'ordre', 'signature', 'created_at', 'updated_at']
egal('les 8 colonnes attendues, dans l’ordre', colonnes.map(c => c.column_name), attenduesColonnes)
verifier('`signature` est nullable — le Grimoire ne sait pas qui écrit',
  colonnes.find(c => c.column_name === 'signature')?.is_nullable === 'YES')
verifier('`titre` est NOT NULL — un chapitre sans titre ne se navigue pas',
  colonnes.find(c => c.column_name === 'titre')?.is_nullable === 'NO')

const [{ nb_index }] = await sql`
  SELECT count(*)::int AS nb_index FROM pg_indexes
  WHERE tablename = 'character_story_chapters' AND indexname = 'idx_character_story_personnage'`
verifier('l’index (personnage_id, ordre) existe', nb_index === 1)

// La contrainte de clé étrangère : un chapitre orphelin serait invisible et
// indestructible depuis l'écran.
const fk = await sql`
  SELECT conname FROM pg_constraint
  WHERE conrelid = 'character_story_chapters'::regclass AND contype = 'f'`
verifier('la clé étrangère vers characters existe', fk.length === 1, `${fk.length} contrainte(s)`)

const chapitres = await sql`
  SELECT c.id, c.personnage_id, c.titre, c.ordre, length(c.contenu) AS taille, p.nom
  FROM character_story_chapters c JOIN characters p ON p.id = c.personnage_id
  ORDER BY c.personnage_id, c.ordre`

console.log(`\n=== Ce que porte la base ===`)
if (chapitres.length === 0) console.log('  (aucun chapitre)')
for (const c of chapitres) {
  console.log(`  [${c.personnage_id}] ${c.nom} · ${c.ordre} — ${c.titre} (${c.taille} car.)`)
}

// Aucun chapitre ne doit dépasser la limite : la base l'accepterait (c'est un
// `text`), mais l'écran tronquerait à la frappe suivante et le joueur perdrait
// la fin sans un mot.
const tropLongs = chapitres.filter(c => Number(c.taille) > MAX_CONTENU_CHAPITRE)
verifier('aucun chapitre en base ne dépasse la limite de saisie', tropLongs.length === 0,
  tropLongs.map(c => `[${c.personnage_id}] ${c.titre} : ${c.taille}`).join(', '))

// Les rangs d'un même personnage doivent être distincts, sinon l'ordre
// d'affichage dépend du départage par id et peut surprendre.
const parPersonnage = new Map<number, number[]>()
for (const c of chapitres) {
  const liste = parPersonnage.get(Number(c.personnage_id)) ?? []
  liste.push(Number(c.ordre))
  parPersonnage.set(Number(c.personnage_id), liste)
}
const collisions = [...parPersonnage.entries()].filter(([, rangs]) => new Set(rangs).size !== rangs.length)
verifier('aucun rang en double chez un même personnage', collisions.length === 0,
  collisions.map(([id]) => `personnage ${id}`).join(', '))

// ─── Verdict ──────────────────────────────────────────────────────────────────
console.log(`\n${ok} contrôle(s) réussi(s), ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

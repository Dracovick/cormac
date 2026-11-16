/**
 * CONTRÔLES — partager une histoire (drizzle/0019).
 *
 *   npx tsx scripts/controle-partage.mts
 *
 * Cinq sections :
 *   1. la destination de connexion — ce qui répare « le lien amène à l'accueil »
 *   2. le jeton                     — sa forme, son alphabet, son tirage
 *   3. les chemins                  — ce que le middleware exempte, et surtout PAS
 *   4. la base réelle               — la table, ses contraintes, ce qu'elle porte
 *   5. le code lui-même             — trois invariants qu'aucun type ne protège
 *
 * ⭐ Les attendus sont écrits À LA MAIN, jamais produits en rappelant la
 * fonction qu'ils contrôlent.
 * ⭐ Et chaque section porte un TÉMOIN INVERSE — un cas qui doit être REFUSÉ, ou
 * accepté là où un garde-fou trop large refuserait. Sans lui, une validation qui
 * dit « non » à tout passerait au vert.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LONGUEUR_JETON,
  MAX_SUITE,
  PREFIXE_PARTAGE,
  cheminPartage,
  destinationApresConnexion,
  estCheminPartage,
  estCiblePdfPublique,
  estJetonBienForme,
  jetonDeCiblePdf,
  nouveauJeton,
  suiteValide,
} from '../src/lib/partage'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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

// ─── 1. La destination de connexion ───────────────────────────────────────────
// Le défaut qu'André a vu : `/personnage/98/histoire` renvoyait à `/login`, et
// `login()` déposait à `/` en dur. La destination doit survivre au mot de passe.
egal('destination : un chemin interne passe',
  suiteValide('/personnage/98/histoire'), '/personnage/98/histoire')
egal('destination : la chaîne de requête est conservée',
  suiteValide('/bibliotheque?onglet=sorts'), '/bibliotheque?onglet=sorts')
egal('destination : l’ancre aussi',
  suiteValide('/personnage/98/histoire#chapitre-4'), '/personnage/98/histoire#chapitre-4')

// ⛔ Les refus. Chacun est une redirection ouverte s'il passe : un lien portant
// le vrai domaine du Grimoire, qui dépose le joueur sur un faux formulaire.
// Le mot de passe est partagé entre tous les joueurs — il n'y en a qu'un à perdre.
egal('⛔ refusé : adresse absolue', suiteValide('https://ailleurs.test/'), null)
egal('⛔ refusé : protocole-relatif (// est un HÔTE)', suiteValide('//ailleurs.test/'), null)
egal('⛔ refusé : antislash, lu comme / par plusieurs navigateurs',
  suiteValide('/\\ailleurs.test'), null)
egal('⛔ refusé : javascript:', suiteValide('javascript:alert(1)'), null)
egal('⛔ refusé : chemin relatif', suiteValide('personnage/98'), null)
egal('⛔ refusé : saut de ligne (coupe l’en-tête Location)',
  suiteValide('/x\nLocation: https://ailleurs.test'), null)
egal('⛔ refusé : plus long que la limite', suiteValide('/' + 'x'.repeat(MAX_SUITE)), null)
egal('⛔ refusé : /login (la connexion se rebouclerait)', suiteValide('/login'), null)
egal('⛔ refusé : /login avec paramètres', suiteValide('/login?suite=/x'), null)
egal('refusé : vide', suiteValide(''), null)
egal('refusé : absent', suiteValide(null), null)

// ⭐ TÉMOIN INVERSE — le refus de `/login` doit porter sur le SEGMENT, pas sur
// un `startsWith` qui emporterait toute page commençant par ces lettres.
egal('⭐ témoin : /logins-du-donjon n’est PAS /login et passe',
  suiteValide('/logins-du-donjon'), '/logins-du-donjon')

egal('sans destination, on atterrit à l’accueil', destinationApresConnexion(null), '/')
egal('destination refusée → accueil, jamais l’adresse fournie',
  destinationApresConnexion('https://ailleurs.test/'), '/')
egal('destination valide → elle est suivie',
  destinationApresConnexion('/personnage/98/histoire'), '/personnage/98/histoire')

// ─── 2. Le jeton ──────────────────────────────────────────────────────────────
const TIRAGE = 2000
const jetons = Array.from({ length: TIRAGE }, () => nouveauJeton())

verifier('jeton : longueur attendue', jetons.every(j => j.length === LONGUEUR_JETON))
verifier('jeton : aucun caractère ambigu (l, o, 0, 1, majuscule)',
  jetons.every(j => !/[lo01A-Z]/.test(j)))
verifier('jeton : deux tirages ne se répètent pas', new Set(jetons).size === TIRAGE,
  `${new Set(jetons).size} distincts sur ${TIRAGE}`)

// ⭐ Les 32 caractères de l'alphabet doivent TOUS sortir. Un repli de l'alphabet
// (une faute d'un caractère dans la constante, un `% 16`) laisserait la moitié
// des lettres absentes — et le contrôle de longueur, lui, resterait vert.
const vus = new Set([...jetons.join('')])
verifier('⭐ jeton : les 32 caractères de l’alphabet sortent tous', vus.size === 32,
  `${vus.size} caractères distincts observés`)

const jetonTemoin = jetons[0]
verifier('forme : un jeton généré est reconnu', estJetonBienForme(jetonTemoin))
verifier('⛔ forme : un caractère de trop est refusé', !estJetonBienForme(jetonTemoin + 'a'))
verifier('⛔ forme : un caractère de moins est refusé', !estJetonBienForme(jetonTemoin.slice(1)))
verifier('⛔ forme : une lettre hors alphabet est refusée',
  !estJetonBienForme('o'.repeat(LONGUEUR_JETON)))
verifier('⛔ forme : les majuscules sont refusées',
  !estJetonBienForme('A'.repeat(LONGUEUR_JETON)))
verifier('⛔ forme : vide refusé', !estJetonBienForme(''))
verifier('⛔ forme : absent refusé', !estJetonBienForme(null))
verifier('⛔ forme : une injection SQL ne ressemble pas à un jeton',
  !estJetonBienForme("' or 1=1 --"))

// ─── 3. Les chemins ───────────────────────────────────────────────────────────
egal('chemin de partage', cheminPartage('abc'), '/histoire/abc')
verifier('le préfixe public est reconnu', estCheminPartage(`${PREFIXE_PARTAGE}${jetonTemoin}`))

// ⭐⭐ LE TÉMOIN QUI COMPTE LE PLUS DE TOUT CE LOT. Si celui-ci devient vrai, la
// page d'histoire INTERNE — celle qui porte les boutons d'écriture — sort de
// derrière le mot de passe.
verifier('⭐⭐ témoin : /personnage/98/histoire n’est PAS une page publique',
  !estCheminPartage('/personnage/98/histoire'))
verifier('⭐ témoin : /histoires-du-donjon non plus (le préfixe porte son /)',
  !estCheminPartage('/histoires-du-donjon'))
verifier('⛔ l’accueil n’est pas public', !estCheminPartage('/'))
verifier('⛔ la bibliothèque n’est pas publique', !estCheminPartage('/bibliotheque'))

// ─── 3 bis. La cible du PDF public ────────────────────────────────────────────
// `/api/pdf` rend une page avec Chromium, et le middleware le laisse passer sans
// cookie pour les pages de partage. Ce prédicat est donc une PORTE : chacun de
// ses refus est un chemin que la route refuserait de rendre sans mot de passe.
verifier('PDF public : la page de partage est une cible valide',
  estCiblePdfPublique(`/histoire/${jetonTemoin}`))
verifier('PDF public : sa page imprimable aussi',
  estCiblePdfPublique(`/histoire/${jetonTemoin}/imprimer`))
egal('PDF public : le jeton est bien extrait',
  jetonDeCiblePdf(`/histoire/${jetonTemoin}/imprimer`), jetonTemoin)

verifier('⭐⭐ ⛔ la FICHE n’est pas une cible de PDF public',
  !estCiblePdfPublique('/personnage/98/imprimer'),
  'sinon n’importe qui sortirait la fiche d’un personnage en PDF, sans mot de passe')
verifier('⛔ la page interne d’histoire non plus',
  !estCiblePdfPublique('/personnage/98/histoire/imprimer'))
verifier('⛔ aucune chaîne de requête admise',
  !estCiblePdfPublique(`/histoire/${jetonTemoin}?x=1`))
verifier('⛔ une remontée de chemin est refusée',
  !estCiblePdfPublique(`/histoire/${jetonTemoin}/../personnage/98/imprimer`))
verifier('⛔ un jeton mal formé est refusé',
  !estCiblePdfPublique('/histoire/trop-court/imprimer'))
verifier('⛔ une page quelconque est refusée',
  !estCiblePdfPublique('/bibliotheque'))
egal('⛔ et aucun jeton n’en sort', jetonDeCiblePdf('/personnage/98/imprimer'), null)

// ─── 4. La base réelle ────────────────────────────────────────────────────────
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()
  .replace(/\r/g, '')
  .replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

const colonnes = await sql`
  select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema = 'public' and table_name = 'character_story_shares'
  order by ordinal_position`

verifier('base : la table character_story_shares existe', colonnes.length > 0,
  `${colonnes.length} colonne(s)`)

if (colonnes.length > 0) {
  const noms = colonnes.map(c => c.column_name).sort()
  egal('base : les colonnes attendues, et pas d’autres',
    noms, ['cree_le', 'id', 'jeton', 'personnage_id'])
  verifier('base : jeton non nul',
    colonnes.find(c => c.column_name === 'jeton')?.is_nullable === 'NO')
  verifier('base : personnage_id non nul',
    colonnes.find(c => c.column_name === 'personnage_id')?.is_nullable === 'NO')

  // Les deux contraintes UNIQUE sont la mécanique même du partage : une adresse
  // = une histoire, et un lien actif par histoire. Sans elles, « Partager »
  // deux fois fabriquerait deux liens et la révocation n'en couperait qu'un.
  const uniques = await sql`
    select tc.constraint_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'character_story_shares'
      and tc.constraint_type = 'UNIQUE'`
  const colUniques = uniques.map(u => u.column_name).sort()
  verifier('base : UNIQUE sur jeton', colUniques.includes('jeton'), colUniques.join(', '))
  verifier('base : UNIQUE sur personnage_id', colUniques.includes('personnage_id'), colUniques.join(', '))

  // Ce que la table porte vraiment, aujourd'hui.
  const partages = await sql`
    select s.jeton, s.personnage_id, c.id as personnage_existe
    from character_story_shares s
    left join characters c on c.id = s.personnage_id`

  const malFormes = partages.filter(p => !estJetonBienForme(p.jeton as string))
  verifier('base : tout jeton en base est bien formé', malFormes.length === 0,
    malFormes.map(p => `[${p.personnage_id}] ${p.jeton}`).join(', '))

  const orphelins = partages.filter(p => p.personnage_existe === null)
  verifier('base : aucun partage vers un personnage disparu', orphelins.length === 0,
    orphelins.map(p => String(p.personnage_id)).join(', '))

  console.log(`\n   ${partages.length} lien(s) de partage en base.`)
}

// ─── 5. Le code lui-même ──────────────────────────────────────────────────────
// Trois invariants qu'aucun type ne protège et qu'une refonte casserait en
// silence. Ils se lisent dans le fichier, faute de pouvoir se lancer.
const lire = (p: string) => fs.readFileSync(path.join(RACINE, p), 'utf8')

/**
 * ⚠⚠ Le code SANS ses commentaires, et ce n'est pas un raffinement : le premier
 * jet de ce contrôle a déclaré `auth.ts` fautif parce que le COMMENTAIRE qui
 * explique le défaut corrigé cite `redirect('/')` entre guillemets. Le code,
 * lui, était juste. Un contrôle qui lit la prose au lieu de l'instruction rend
 * un verdict sincère sur le mauvais morceau du fichier — et si je l'avais cru,
 * j'aurais « réparé » du code qui marchait en effaçant son explication.
 */
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n')
}

const middleware = sansCommentaires(lire('src/middleware.ts'))
verifier('⭐⭐ code : le préfixe public n’est exempté qu’en GET ou HEAD',
  /estCheminPartage\(pathname\)\s*&&\s*\(request\.method === 'GET' \|\| request\.method === 'HEAD'\)/.test(middleware),
  'une Server Action est un POST, et le manifeste des actions de Next est global : exempter toutes méthodes ouvrirait l’écriture du Grimoire à qui détient un lien de lecture')

// ⛔ Les polices. Leur protection ne protégeait rien et faisait rendre un 500 au
// PDF d'une histoire partagée : `document.fonts.load()` rejette avec
// « NetworkError » quand le fichier répond par une redirection vers /login.
verifier('⭐ code : les polices d’impression sont servies sans mot de passe',
  middleware.includes("pathname.startsWith('/polices/')"),
  'sinon /api/pdf échoue sur NetworkError pour toute cible publique')

const auth = sansCommentaires(lire('src/app/actions/auth.ts'))
verifier('code : la connexion ne redirige plus vers l’accueil en dur',
  !/redirect\('\/'\)/.test(auth) && auth.includes('destinationApresConnexion'))

// ⭐ TÉMOIN du dépouillement : l'explication du défaut doit, elle, SURVIVRE dans
// le fichier. Sans ce témoin, un `sansCommentaires` qui renverrait la chaîne
// vide rendrait la ligne ci-dessus verte pour toujours.
verifier('⭐ témoin : le commentaire qui cite le défaut corrigé est toujours là',
  lire('src/app/actions/auth.ts').includes("redirect('/')"))

// ⛔ La page publique et son rendu ne doivent importer AUCUNE action serveur :
// elles s'affichent pour un visiteur anonyme.
for (const fichier of [
  'src/app/histoire/[jeton]/page.tsx',
  'src/app/histoire/[jeton]/imprimer/page.tsx',
  'src/components/histoire/HistoireLecture.tsx',
  'src/components/histoire/HistoireImprimable.tsx',
]) {
  verifier(`⭐ code : ${path.basename(fichier)} n’importe aucune action serveur`,
    !sansCommentaires(lire(fichier)).includes('@/app/actions'))
}

// ⛔ La liste blanche de `/api/pdf`. Elle se périme à chaque page imprimable
// qu'on ajoute, et elle le fait EN SILENCE : le bouton « Sauvegarder en PDF » de
// l'histoire a rendu un 400 en production du 2026-11-15 au 2026-11-16 sans que
// rien ne le signale. Mesuré avec témoin positif (la fiche rendait ses 201 Ko).
const routePdf = sansCommentaires(lire('src/app/api/pdf/route.ts'))
verifier('⭐ code : /api/pdf autorise la page d’histoire interne',
  routePdf.includes(String.raw`/^\/personnage\/\d+\/histoire\/imprimer$/`),
  'sans cette entrée, le bouton « Sauvegarder en PDF » rend un 400')
verifier('⭐ code : /api/pdf autorise la page d’histoire partagée',
  routePdf.includes(String.raw`/^\/histoire\/[a-z2-9]{24}\/imprimer$/`))
verifier('⭐ code : /api/pdf vérifie que le jeton EXISTE avant de lancer Chromium',
  routePdf.includes('if (!(await partageExiste(jetonPartage)))'),
  'le middleware laisse passer sur la seule FORME du jeton — et un NOM présent ' +
  'ne prouve pas qu’il est appelé : la ligne d’import suffisait à rendre vert ' +
  'un contrôle qui cherchait « partageExiste »')
verifier('⭐ code : le cookie n’est posé dans Chromium que s’il y en a un',
  /if \(jeton\) \{/.test(routePdf))

// ⭐ TÉMOIN INVERSE du contrôle ci-dessus : la page INTERNE, elle, DOIT en
// importer. Sans ce témoin, un `includes` cassé rendrait les quatre lignes
// ci-dessus vertes sur n'importe quoi.
verifier('⭐ témoin : la page d’histoire interne, elle, importe bien des actions',
  lire('src/components/histoire/PartageHistoire.tsx').includes('@/app/actions/partage'))

// ─── Verdict ──────────────────────────────────────────────────────────────────
console.log(`\n${ok} contrôle(s) réussi(s), ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

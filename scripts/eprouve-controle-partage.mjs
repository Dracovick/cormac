/* ÉPROUVER LES CONTRÔLES DU PARTAGE PAR MUTATION.
 *
 *   node scripts/eprouve-controle-partage.mjs
 *
 * Un contrôle qui passe au vert ne prouve rien tant qu'on n'a pas vu ce qui le
 * fait rougir. Ce script casse le code d'une façon précise, relance
 * `controle-partage.mts`, et EXIGE qu'il échoue. Puis il restaure les fichiers.
 *
 * Chaque mutation vise un vrai défaut, pas une faute improbable — et les deux
 * premières sont des trous de sécurité, pas des erreurs d'affichage :
 *   1. `//ailleurs` accepté comme destination — redirection ouverte, sous le
 *      vrai nom de domaine du Grimoire, vers un faux formulaire de mot de passe;
 *   2. la page d'histoire INTERNE devient publique — avec ses boutons d'écriture;
 *   3. le préfixe public exempté toutes méthodes confondues — donc les Server
 *      Actions, donc l'écriture du Grimoire entier pour qui a un lien de lecture;
 *   4. la connexion redépose à l'accueil en dur — le défaut qu'André a signalé;
 *   5. le refus de `/login` devient un `startsWith` — une page qui commence par
 *      ces lettres deviendrait inatteignable après connexion;
 *   6. l'alphabet du jeton se replie de moitié — moins d'entropie, en silence;
 *   7. la forme du jeton ne vérifie plus que sa longueur.
 *
 * ⛔ Les fichiers sont restaurés dans un `finally` : une épreuve qui laisse du
 * code muté derrière elle est pire que pas d'épreuve.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const FICHIERS = {
  partage: path.join(RACINE, 'src', 'lib', 'partage.ts'),
  middleware: path.join(RACINE, 'src', 'middleware.ts'),
  auth: path.join(RACINE, 'src', 'app', 'actions', 'auth.ts'),
  pdf: path.join(RACINE, 'src', 'app', 'api', 'pdf', 'route.ts'),
}
const ORIGINAUX = Object.fromEntries(
  Object.entries(FICHIERS).map(([k, p]) => [k, fs.readFileSync(p, 'utf8')])
)

const MUTATIONS = [
  {
    nom: '1. ⛔ « //ailleurs » accepté comme destination (redirection ouverte)',
    cible: 'partage',
    de: `  if (suite.startsWith('//')) return null`,
    vers: `  // muté`,
  },
  {
    nom: '2. ⛔ la page d’histoire INTERNE devient publique',
    cible: 'partage',
    de: `  return pathname.startsWith(PREFIXE_PARTAGE)`,
    vers: `  return pathname.includes('histoire')`,
  },
  {
    nom: '3. ⛔ le préfixe public exempté en POST aussi (Server Actions ouvertes)',
    cible: 'middleware',
    de: `  if (estCheminPartage(pathname) && (request.method === 'GET' || request.method === 'HEAD')) {`,
    vers: `  if (estCheminPartage(pathname)) {`,
  },
  {
    nom: '4. la connexion redépose à l’accueil en dur (le défaut signalé)',
    cible: 'auth',
    de: `  redirect(destinationApresConnexion(suite))`,
    vers: `  redirect('/')`,
  },
  {
    nom: '5. le refus de /login devient un startsWith trop large',
    cible: 'partage',
    de: `  if (chemin === '/login' || chemin.startsWith('/login/')) return null`,
    vers: `  if (chemin.startsWith('/login')) return null`,
  },
  {
    nom: '6. l’alphabet du jeton se replie de moitié (entropie perdue en silence)',
    cible: 'partage',
    de: `  for (const o of octets) jeton += ALPHABET[o % ALPHABET.length]`,
    vers: `  for (const o of octets) jeton += ALPHABET[o % 16]`,
  },
  {
    nom: '7. la forme du jeton ne vérifie plus que sa longueur',
    cible: 'partage',
    de: `  for (const c of jeton) if (!ALPHABET.includes(c)) return false`,
    vers: `  // muté`,
  },
  {
    // ⛔ La porte la plus sensible du lot : ce prédicat décide ce que `/api/pdf`
    // accepte de rendre SANS mot de passe. Permissif, il sort la fiche d'un
    // personnage en PDF pour n'importe qui.
    nom: '8. ⛔ la cible du PDF public accepte n’importe quelle page',
    cible: 'partage',
    de: `  const m = /^\\/histoire\\/([^/]+)(?:\\/imprimer)?$/.exec(cible)`,
    vers: `  const m = /^\\/.*\\/([^/]+)(?:\\/imprimer)?$/.exec(cible)`,
  },
  {
    nom: '9. ⛔ /api/pdf ne vérifie plus que le jeton existe (Chromium pour rien)',
    cible: 'pdf',
    de: `    if (!(await partageExiste(jetonPartage))) {`,
    vers: `    if (false) {`,
  },
]

function lanceControles() {
  try {
    const sortie = execFileSync('npx', ['tsx', 'scripts/controle-partage.mts'], {
      cwd: RACINE, encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, sortie }
  } catch (e) {
    return { code: e.status ?? 1, sortie: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

function restaureTout() {
  for (const [k, p] of Object.entries(FICHIERS)) fs.writeFileSync(p, ORIGINAUX[k], 'utf8')
}

const resultats = []
try {
  // Référence : le code intact doit passer. Sans ce point de départ, une épreuve
  // « le code muté échoue » serait satisfaite par un contrôle cassé en permanence.
  const ref = lanceControles()
  const nbRef = /(\d+) contrôle\(s\) réussi\(s\), (\d+) échec/.exec(ref.sortie)
  console.log(`RÉFÉRENCE  code=${ref.code} · ${nbRef ? `${nbRef[1]} réussis, ${nbRef[2]} échecs` : 'illisible'}`)
  resultats.push({ nom: '0. code intact (doit PASSER)', attendu: 'vert', obtenu: ref.code === 0 ? 'vert' : 'rouge' })

  for (const m of MUTATIONS) {
    const original = ORIGINAUX[m.cible]
    if (!original.includes(m.de)) {
      resultats.push({ nom: m.nom, attendu: 'rouge', obtenu: 'MOTIF INTROUVABLE' })
      continue
    }
    fs.writeFileSync(FICHIERS[m.cible], original.replace(m.de, m.vers), 'utf8')
    const r = lanceControles()
    const n = /(\d+) contrôle\(s\) réussi\(s\), (\d+) échec/.exec(r.sortie)
    console.log(`MUTATION   ${m.nom}`)
    console.log(`           code=${r.code} · ${n ? `${n[1]} réussis, ${n[2]} échecs` : 'illisible'}`)
    resultats.push({ nom: m.nom, attendu: 'rouge', obtenu: r.code === 0 ? 'vert' : 'rouge', echecs: n?.[2] })
    restaureTout()
  }
} finally {
  restaureTout()
  const intacts = Object.entries(FICHIERS).every(([k, p]) => fs.readFileSync(p, 'utf8') === ORIGINAUX[k])
  console.log(`\nFichiers restaurés à l’identique : ${intacts}`)
  if (!intacts) {
    console.error('⛔ UN FICHIER N’EST PAS RESTAURÉ — à vérifier à la main avant tout commit.')
    process.exitCode = 1
  }
}

console.log('')
let rates = 0
for (const r of resultats) {
  const bon = r.obtenu === r.attendu
  if (!bon) rates++
  console.log(`${bon ? '✅' : '⛔'} ${r.nom} — attendu ${r.attendu}, obtenu ${r.obtenu}${r.echecs ? ` (${r.echecs} échecs)` : ''}`)
}
console.log(`\n${resultats.length - rates} épreuve(s) sur ${resultats.length} concluante(s).`)
if (rates) process.exitCode = 1

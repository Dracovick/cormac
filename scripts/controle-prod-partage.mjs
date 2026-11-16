/* CONTRÔLES EN PRODUCTION — partager une histoire (drizzle/0019).
 *
 *   node scripts/controle-prod-partage.mjs
 *
 * Ce que seul un contrôle en production peut dire : le middleware tourne sur le
 * runtime Edge de Vercel, et aucun test local ne prouve ce qu'il fait là-bas.
 *
 * Sept choses à établir, et trois sont des garde-fous de sécurité :
 *   1. un lien profond sans cookie renvoie à /login EN PORTANT sa destination;
 *   2. l'adresse à jeton répond 200 SANS cookie, et affiche le récit;
 *   3. ⭐ un POST sur cette adresse est REFUSÉ — c'est ce qui empêche une
 *      Server Action de s'exécuter pour un visiteur anonyme;
 *   4. un jeton inconnu, mal formé, ou RÉVOQUÉ rend 404;
 *   5. la page publique ne fuit rien de la fiche;
 *   6. elle porte bien `noindex`;
 *   7. ⭐ le reste du Grimoire est TOUJOURS fermé (témoin : sans ce contrôle,
 *      un middleware désactivé rendrait les six premiers verts).
 *
 * ⚠ Le cookie de session est en clair dans src/app/actions/auth.ts. Une page
 * protégée demandée sans cookie rend la page de connexion avec un 200 après
 * redirection — un contrôle qui ne regarde que le code HTTP passerait au vert
 * sur l'écran de login. D'où `redirect: 'manual'` partout où la redirection EST
 * le sujet, et des témoins négatifs ailleurs.
 *
 * ⛔ Le partage d'essai est créé en base puis SUPPRIMÉ dans un `finally` : un
 * lien de lecture publique laissé derrière un contrôle serait un trou ouvert.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://www.dracovick.com'
const COOKIE = 'cormac_auth=granted'
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

let ok = 0
const echecs = []
function verifier(titre, condition, detail = '') {
  if (condition) ok++
  else echecs.push(`${titre}${detail ? ` — ${detail}` : ''}`)
}

/** Le HTML d'une page Next porte DEUX FOIS le contenu : le rendu, et le payload
 *  RSC qui transmet les props brutes. Chercher un mot dans le HTML entier le
 *  trouve donc dans les DONNÉES même s'il n'est pas affiché — c'est ce qui a
 *  fait rougir six contrôles justes le 2026-11-15. On ne garde que le rendu. */
function visible(html) {
  return html
    .replace(/<script>self\.__next_f\.push\(\[[\s\S]*?\]\)<\/script>/g, '')
    .replace(/<!-- -->/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

async function demande(chemin, { cookie = false, methode = 'GET', suivre = false } = {}) {
  const r = await fetch(BASE + chemin, {
    method: methode,
    headers: cookie ? { Cookie: COOKIE } : {},
    redirect: suivre ? 'follow' : 'manual',
  })
  const brut = methode === 'GET' ? await r.text() : ''
  return { statut: r.status, lieu: r.headers.get('location'), html: visible(brut), brut }
}

// ─── Le témoin : un personnage réel et son histoire ──────────────────────────
const [cible] = await sql`
  select c.id, c.nom
  from characters c
  join character_story_chapters ch on ch.personnage_id = c.id
  group by c.id, c.nom
  order by count(*) desc
  limit 1`
if (!cible) throw new Error('aucun personnage avec une histoire : contrôle impossible')
console.log(`Témoin : [${cible.id}] ${cible.nom}\n`)

const ALPHABET_JETON = 'abcdefghijkmnpqrstuvwxyz23456789'
const PREFIXE_ESSAI = 'zzcprd'
let jeton = PREFIXE_ESSAI
while (jeton.length < 24) {
  jeton += ALPHABET_JETON[Math.floor(Math.random() * ALPHABET_JETON.length)]
}
// ⭐ Le jeton d'essai doit respecter l'alphabet, sinon la page rend 404 et huit
// contrôles accusent un code sain (payé le 2026-11-16 : « zzcontroleprod »
// contient l et o, exclus de l'alphabet).
if (jeton.length !== 24 || [...jeton].some(c => !ALPHABET_JETON.includes(c))) {
  throw new Error(`jeton d'essai hors alphabet : ${jeton}`)
}

// ⚠ Le partage d'essai écrase temporairement celui du personnage s'il en a un :
// on relève l'ancien pour le remettre à l'identique à la fin.
const [ancien] = await sql`select jeton from character_story_shares where personnage_id = ${cible.id}`

try {
  await sql`delete from character_story_shares where personnage_id = ${cible.id}`
  await sql`insert into character_story_shares (personnage_id, jeton) values (${cible.id}, ${jeton})`

  // ─── 1. Le lien profond garde sa destination ────────────────────────────────
  const profond = await demande(`/personnage/${cible.id}/histoire`)
  verifier('sans cookie, la page d’histoire redirige', profond.statut === 307 || profond.statut === 302,
    `statut ${profond.statut}`)
  verifier('⭐ la redirection PORTE la destination demandée',
    (profond.lieu ?? '').includes(`suite=%2Fpersonnage%2F${cible.id}%2Fhistoire`) ||
    (profond.lieu ?? '').includes(`suite=/personnage/${cible.id}/histoire`),
    `Location = ${profond.lieu}`)

  const login = await demande(`/login?suite=/personnage/${cible.id}/histoire`)
  verifier('la page de connexion répond 200', login.statut === 200, `statut ${login.statut}`)
  verifier('⭐ et elle annonce où elle va déposer',
    login.html.includes(`/personnage/${cible.id}/histoire`))

  // ─── 2. L'adresse publique, SANS cookie ─────────────────────────────────────
  const publique = await demande(`/histoire/${jeton}`)
  verifier('⭐⭐ l’adresse à jeton répond 200 SANS cookie', publique.statut === 200,
    `statut ${publique.statut}`)
  verifier('la page porte le nom du personnage', publique.html.includes(cible.nom))
  verifier('la page porte le mot « Histoire »', publique.html.includes('Histoire'))
  verifier('elle se dit en lecture seule', publique.html.includes('Lecture seule'))

  // ⭐ TÉMOIN NÉGATIF — si le middleware avait renvoyé à /login, le code serait
  // 200 après redirection et tout ce qui précède pourrait passer sur l'écran de
  // connexion. Ce motif n'existe QUE sur /login.
  verifier('⭐ témoin : ce n’est pas l’écran de connexion déguisé',
    !publique.html.includes('Accès restreint') && !publique.brut.includes('name="password"'))

  // ─── 3. Le POST est refusé — le garde-fou des Server Actions ────────────────
  const post = await demande(`/histoire/${jeton}`, { methode: 'POST' })
  verifier('⭐⭐ un POST sur l’adresse publique est redirigé vers la connexion',
    post.statut === 307 || post.statut === 302,
    `statut ${post.statut} — une Server Action est un POST, et le manifeste des actions de Next est global`)
  verifier('⭐⭐ et il mène bien à /login', (post.lieu ?? '').includes('/login'),
    `Location = ${post.lieu}`)

  // ─── 4. Le PDF public ───────────────────────────────────────────────────────
  const pdf = await demande(`/histoire/${jeton}/imprimer`)
  verifier('le PDF de l’histoire partagée répond 200 sans cookie', pdf.statut === 200,
    `statut ${pdf.statut}`)
  verifier('le PDF porte le nom du personnage', pdf.html.includes(cible.nom))

  // ─── 4 bis. Le PDF téléchargeable, les deux régimes ─────────────────────────
  // ⛔ Mesuré le 2026-11-16 : `/api/pdf?cible=/personnage/98/histoire/imprimer`
  // rendait « Page non autorisée pour l'export PDF » (400) depuis la livraison
  // de l'histoire la veille — la liste blanche de la route ne la connaissait
  // pas. Témoin positif dans la même mesure : la fiche rendait bien ses 201 Ko.
  const pdfInterne = await fetch(
    `${BASE}/api/pdf?cible=${encodeURIComponent(`/personnage/${cible.id}/histoire/imprimer`)}&nom=essai`,
    { headers: { Cookie: COOKIE } })
  verifier('⭐ le PDF de l’histoire interne est produit (défaut du 2026-11-15 réparé)',
    pdfInterne.status === 200 && (pdfInterne.headers.get('content-type') ?? '').includes('pdf'),
    `statut ${pdfInterne.status}, type ${pdfInterne.headers.get('content-type')}`)
  const octetsInterne = (await pdfInterne.arrayBuffer()).byteLength
  verifier('et il pèse quelque chose', octetsInterne > 20_000, `${octetsInterne} octets`)

  const pdfPublic = await fetch(
    `${BASE}/api/pdf?cible=${encodeURIComponent(`/histoire/${jeton}/imprimer`)}&nom=essai`)
  verifier('⭐⭐ le PDF d’une histoire partagée est produit SANS cookie',
    pdfPublic.status === 200 && (pdfPublic.headers.get('content-type') ?? '').includes('pdf'),
    `statut ${pdfPublic.status}, type ${pdfPublic.headers.get('content-type')}`)
  const octetsPublic = (await pdfPublic.arrayBuffer()).byteLength
  verifier('et il pèse quelque chose', octetsPublic > 20_000, `${octetsPublic} octets`)

  // ⭐⭐ Les deux refus qui comptent : la porte ouverte pour le PDF partagé ne
  // doit rien ouvrir d'autre.
  const pdfFiche = await fetch(
    `${BASE}/api/pdf?cible=${encodeURIComponent(`/personnage/${cible.id}/imprimer`)}&nom=essai`,
    { redirect: 'manual' })
  verifier('⭐⭐ sans cookie, le PDF de la FICHE est refusé',
    pdfFiche.status === 307 || pdfFiche.status === 302 || pdfFiche.status === 401,
    `statut ${pdfFiche.status} — une fiche n'est pas publique`)

  const pdfInvente = await fetch(
    `${BASE}/api/pdf?cible=${encodeURIComponent('/histoire/abcdefghijkmnpqrstuvwxyz'.slice(0, 33) + '/imprimer')}&nom=essai`,
    { redirect: 'manual' })
  verifier('⭐ un jeton inventé ne fait PAS tourner Chromium',
    pdfInvente.status === 404 || pdfInvente.status === 307,
    `statut ${pdfInvente.status}`)

  // ─── 4 ter. Les polices du PDF ──────────────────────────────────────────────
  // ⛔ Mesuré le 2026-11-16 : `/polices/Arimo-Regular.ttf` rendait 307 vers
  // /login sans cookie, et c'est ce qui faisait échouer le PDF partagé —
  // `document.fonts.load()` rejette, Chromium remonte « NetworkError ».
  const police = await fetch(`${BASE}/polices/Arimo-Regular.ttf`, { redirect: 'manual' })
  verifier('⭐ la police d’impression est servie SANS cookie', police.status === 200,
    `statut ${police.status} — sinon /api/pdf rend 500 sur toute cible publique`)
  verifier('et c’est bien une police', (police.headers.get('content-type') ?? '').includes('font'),
    police.headers.get('content-type') ?? 'sans type')

  // ─── 5. Les jetons qui ne valent rien ───────────────────────────────────────
  const inconnu = await demande('/histoire/' + 'abcdefghijkmnpqrstuvwxyz'.slice(0, 24))
  verifier('un jeton bien formé mais inconnu rend 404', inconnu.statut === 404,
    `statut ${inconnu.statut}`)

  const malForme = await demande('/histoire/trop-court')
  verifier('un jeton mal formé rend 404', malForme.statut === 404, `statut ${malForme.statut}`)

  const injection = await demande("/histoire/' or 1=1 --")
  verifier('une tentative d’injection rend 404', injection.statut === 404,
    `statut ${injection.statut}`)

  // ─── 6. Rien de la fiche ne fuit ────────────────────────────────────────────
  verifier('⭐ la page publique ne mène PAS à la fiche',
    !publique.html.includes(`href="/personnage/${cible.id}"`))
  verifier('⭐ aucun lien vers le reste du Grimoire',
    !publique.html.includes('href="/bibliotheque"') && !publique.html.includes('href="/partie"'))
  verifier('elle porte noindex', /noindex/.test(publique.brut), 'un lien privé indexé n’est plus privé')

  // ─── 7. Le reste du Grimoire est toujours fermé ─────────────────────────────
  // ⭐⭐ LE TÉMOIN QUI VALIDE TOUS LES AUTRES : si le middleware était hors
  // service, les six sections ci-dessus seraient vertes et le site serait ouvert.
  for (const chemin of ['/', '/bibliotheque', '/partie', `/personnage/${cible.id}`,
                        `/personnage/${cible.id}/modifier`]) {
    const r = await demande(chemin)
    verifier(`⭐⭐ témoin : ${chemin} reste fermé sans mot de passe`,
      r.statut === 307 || r.statut === 302, `statut ${r.statut}`)
  }

  // ─── 8. Et la page interne, avec cookie, porte bien le bloc de partage ──────
  const interne = await demande(`/personnage/${cible.id}/histoire`, { cookie: true })
  verifier('avec cookie, la page d’histoire répond 200', interne.statut === 200,
    `statut ${interne.statut}`)
  verifier('elle porte le bloc de partage', interne.html.includes('Voir le lien de partage') ||
    interne.html.includes('Partager cette histoire'))

  // ─── 9. La révocation mord pour de vrai ─────────────────────────────────────
  await sql`delete from character_story_shares where jeton = ${jeton}`
  const revoque = await demande(`/histoire/${jeton}`)
  verifier('⭐⭐ après révocation, l’adresse rend 404', revoque.statut === 404,
    `statut ${revoque.statut} — une révocation qui ne coupe pas ne révoque rien`)
} finally {
  await sql`delete from character_story_shares where jeton = ${jeton}`
  if (ancien) {
    await sql`
      insert into character_story_shares (personnage_id, jeton) values (${cible.id}, ${ancien.jeton})
      on conflict (personnage_id) do update set jeton = ${ancien.jeton}`
    console.log(`\nPartage d’origine de [${cible.id}] remis à l’identique.`)
  }
  const reste = await sql`select count(*)::int n from character_story_shares where jeton like 'zzcprd%'`
  if (reste[0].n !== 0) {
    console.error('⛔ UN PARTAGE D’ESSAI SURVIT EN BASE — à supprimer à la main.')
    process.exitCode = 1
  }
}

console.log(`\n${ok} contrôle(s) réussi(s) en production, ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

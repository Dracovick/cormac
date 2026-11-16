// ─── Partager une histoire : la destination de connexion, et le jeton ───────
// André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire.
// Lorsque je copie le lien de la page ce lien amène à l'accueil du site. »
//
// Deux défauts distincts derrière ce symptôme, et deux remèdes qui vivent ici :
//
//   1. LA DESTINATION PERDUE. Tout le Grimoire est derrière un mot de passe.
//      Un visiteur sans cookie était renvoyé à `/login` — qui ressemble à
//      l'accueil — puis déposé à `/` en dur par `actions/auth.login()`. Même un
//      joueur qui a le mot de passe n'arrivait donc jamais sur la page
//      demandée. Désormais le middleware écrit la destination dans `?suite=`
//      et la connexion y conduit. Vaut pour TOUT lien profond du site.
//
//   2. PARTAGER HORS DU CERCLE. Un lien à jeton, en lecture seule, qui ouvre
//      une histoire SANS mot de passe — et qui se révoque.
//
// ⛔ Ce module ne doit dépendre de RIEN : il est importé par le middleware, qui
// tourne sur le runtime Edge (pas de `node:crypto`, pas de `Buffer`), par une
// action serveur et par un script de contrôle.

// ─── 1. La destination de connexion ──────────────────────────────────────────

/** Le paramètre qui porte la destination sur `/login`. */
export const PARAM_SUITE = 'suite'

/**
 * Plus long qu'un chemin du Grimoire ne sera jamais, assez court pour qu'un
 * paramètre fabriqué ne serve pas à bourrer l'URL de connexion.
 */
export const MAX_SUITE = 512

/**
 * La destination est-elle une page interne de CE site ?
 *
 * ⛔ Le cœur du garde-fou, et il ne se devine pas : `suite` arrive de l'URL,
 * donc de n'importe qui. Rediriger sans vérifier, c'est une redirection
 * ouverte — un lien `…/login?suite=https://ailleurs` qui porte le vrai nom de
 * domaine du Grimoire et dépose le joueur sur un faux formulaire. Le mot de
 * passe est partagé entre tous les joueurs : il n'y en a qu'un à perdre.
 *
 * Les cinq refus, chacun pour une raison mesurée :
 *   - ne commence pas par `/`      → `https://…`, `javascript:…`, chemin relatif
 *   - commence par `//`            → protocole-relatif : `//ailleurs` EST un hôte
 *   - contient `\`                 → plusieurs navigateurs le lisent comme `/`,
 *                                    donc `/\ailleurs` vaut `//ailleurs`
 *   - caractère de contrôle        → coupe l'en-tête `Location` en deux
 *   - mène à `/login`              → la connexion se rebouclerait sur elle-même
 */
export function suiteValide(suite: string | null | undefined): string | null {
  if (!suite) return null
  if (suite.length > MAX_SUITE) return null
  if (!suite.startsWith('/')) return null
  if (suite.startsWith('//')) return null
  if (suite.includes('\\')) return null
  if (/[\u0000-\u001f\u007f]/.test(suite)) return null

  // `/login`, `/login?x=1`, mais PAS `/logins-du-donjon` : on compare le segment.
  const chemin = suite.split(/[?#]/)[0]
  if (chemin === '/login' || chemin.startsWith('/login/')) return null

  return suite
}

/** Où déposer quelqu'un après le mot de passe : sa destination, ou l'accueil. */
export function destinationApresConnexion(suite: string | null | undefined): string {
  return suiteValide(suite) ?? '/'
}

// ─── 2. Le jeton de partage ──────────────────────────────────────────────────

/**
 * 32 caractères exactement, et c'est voulu : un octet tiré au hasard vaut
 * 0..255, et 256 est un multiple exact de 32 — `octet % 32` est donc uniforme,
 * sans le biais qu'introduit un alphabet de taille quelconque.
 *
 * Ni `l` ni `o` ni `0` ni `1` : André lira ce jeton dans une URL, et peut avoir
 * à le dicter.
 */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

/** 24 caractères × 5 bits = 120 bits. Un lien privé ne se devine pas. */
export const LONGUEUR_JETON = 24

export function nouveauJeton(): string {
  const octets = new Uint8Array(LONGUEUR_JETON)
  crypto.getRandomValues(octets)
  let jeton = ''
  for (const o of octets) jeton += ALPHABET[o % ALPHABET.length]
  return jeton
}

/**
 * ⚠ Vérifié AVANT toute requête : un segment d'URL quelconque ne doit pas
 * partir en `where` sur la base, et une adresse mal formée est un 404 immédiat
 * plutôt qu'un aller-retour en base.
 */
export function estJetonBienForme(jeton: string | null | undefined): boolean {
  if (!jeton || jeton.length !== LONGUEUR_JETON) return false
  for (const c of jeton) if (!ALPHABET.includes(c)) return false
  return true
}

/** Le préfixe public, en un seul endroit : le middleware et les pages le partagent. */
export const PREFIXE_PARTAGE = '/histoire/'

export function cheminPartage(jeton: string): string {
  return `${PREFIXE_PARTAGE}${jeton}`
}

/**
 * Le chemin est-il une page de partage public ?
 *
 * ⛔ Ne matche PAS `/personnage/98/histoire` : la page interne reste derrière le
 * mot de passe, c'est seulement l'adresse à jeton qui s'ouvre.
 */
export function estCheminPartage(pathname: string): boolean {
  return pathname.startsWith(PREFIXE_PARTAGE)
}

/**
 * La cible demandée à `/api/pdf` est-elle une page de partage PUBLIQUE ?
 *
 * ⚠ Ce prédicat ouvre une porte : il sert au middleware à laisser passer
 * `/api/pdf` SANS cookie. Il doit donc être strict, et il l'est — le jeton doit
 * être bien formé, le chemin exactement l'une des deux pages de partage, et
 * aucune chaîne de requête n'est admise. Un `/histoire/<jeton>/../personnage/98`
 * ne passe pas : le chemin est comparé en entier, pas par préfixe.
 *
 * ⛔ Et la route refait la vérification de son côté, puis confirme que le jeton
 * EXISTE en base avant de lancer Chromium : sans ça, n'importe qui ferait
 * tourner un navigateur serverless avec 24 caractères inventés.
 */
export function estCiblePdfPublique(cible: string | null | undefined): boolean {
  if (!cible) return false
  if (cible.includes('?') || cible.includes('#')) return false
  const jeton = jetonDeCiblePdf(cible)
  return jeton !== null
}

/** Le jeton porté par une cible de PDF publique, ou null. */
export function jetonDeCiblePdf(cible: string | null | undefined): string | null {
  if (!cible) return null
  const m = /^\/histoire\/([^/]+)(?:\/imprimer)?$/.exec(cible)
  if (!m) return null
  return estJetonBienForme(m[1]) ? m[1] : null
}

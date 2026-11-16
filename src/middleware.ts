import { NextRequest, NextResponse } from 'next/server'
import { PARAM_SUITE, estCheminPartage, estCiblePdfPublique } from '@/lib/partage'

const COOKIE = 'cormac_auth'
const TOKEN = 'granted'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    // ⛔⛔ Les quatre fichiers de police d'Arimo, servis depuis `public/polices/`.
    // Mesuré le 2026-11-16 : sans cookie, `/polices/Arimo-Regular.ttf` rendait
    // un 307 vers /login — et `/api/pdf` échouait sur
    // « NetworkError: A network error occurred. », parce que
    // `document.fonts.load()` REJETTE quand la police ne se charge pas. Le PDF
    // d'une histoire partagée rendait donc un 500, alors que la page, elle,
    // s'affichait très bien. Ces fichiers ne portent aucune donnée du Grimoire :
    // les protéger ne protégeait rien et cassait le seul rendu qui s'en passe.
    pathname.startsWith('/polices/') ||
    // Ressources PWA : le téléphone les récupère sans cookie à l'installation
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png'
  ) {
    return NextResponse.next()
  }

  // ─── Les histoires partagées : lisibles sans mot de passe, EN LECTURE SEULE ─
  // André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire. »
  // `/histoire/<jeton>` s'ouvre à qui a le lien; le jeton est vérifié par la
  // page, qui rend 404 s'il est faux ou révoqué (`lib/partage.ts`).
  //
  // ⛔⛔ GET et HEAD SEULEMENT, et ce n'est pas un détail de forme. Une Server
  // Action de Next est un POST vers l'URL de la page courante, et le manifeste
  // des actions est GLOBAL à l'application : rien n'empêche de POSTer vers
  // n'importe quelle route pour en déclencher une. Exempter cette adresse
  // toutes méthodes confondues ouvrirait donc l'ÉCRITURE du Grimoire entier à
  // quiconque détient un lien de lecture. Le verbe est le garde-fou.
  if (estCheminPartage(pathname) && (request.method === 'GET' || request.method === 'HEAD')) {
    return NextResponse.next()
  }

  // ─── Le PDF d'une histoire partagée ────────────────────────────────────────
  // `/api/pdf` rend un document avec Chromium. Il reste fermé, SAUF pour les
  // deux pages de partage public — sinon le bouton « Sauvegarder en PDF » de
  // l'histoire partagée téléchargerait l'écran de connexion sous un nom en
  // `.pdf`, sans rien dire.
  //
  // ⛔ La cible est validée en ENTIER (`estCiblePdfPublique`), pas par préfixe :
  // cette route reçoit un chemin de l'extérieur, et l'ouvrir largement en
  // ferait un lecteur de n'importe quelle page du Grimoire. La route refait la
  // vérification et confirme que le jeton existe avant de lancer le navigateur.
  if (
    request.method === 'GET' &&
    pathname === '/api/pdf' &&
    estCiblePdfPublique(request.nextUrl.searchParams.get('cible'))
  ) {
    return NextResponse.next()
  }

  if (request.cookies.get(COOKIE)?.value === TOKEN) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''

  // ─── La destination, retenue pour après le mot de passe ──────────────────────
  // Le défaut qu'André a vu : un lien profond renvoyait à `/login`, puis
  // `actions/auth.login()` déposait à `/` en dur — « ce lien amène à l'accueil
  // du site ». La page demandée était simplement oubliée en route.
  //
  // ⚠ Seulement sur un GET de document : un POST ou un appel d'API n'a pas de
  // « page où revenir », et sa charge utile serait perdue de toute façon. Le
  // paramètre n'est posé que là où il sert.
  if (request.method === 'GET' && pathname !== '/' && !pathname.startsWith('/api/')) {
    url.searchParams.set(PARAM_SUITE, `${pathname}${search}`)
  }

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}

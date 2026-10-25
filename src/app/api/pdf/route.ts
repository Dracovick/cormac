/**
 * GÉNÉRATION DE PDF — le bouton « Sauvegarder en PDF » doit rendre un fichier,
 * pas la boîte de dialogue d'impression.
 *
 * Aucune API de navigateur ne sait écrire un PDF : `window.print()` ouvre la
 * boîte système, où la destination « Enregistrer au format PDF » reste un choix
 * à faire à la main. On rend donc le document côté serveur, avec le même moteur
 * que celui qui l'imprimerait — Chromium — et on renvoie les octets en pièce
 * jointe.
 *
 * Pourquoi Chromium et pas une bibliothèque de PDF : la fiche existe déjà en
 * HTML + CSS d'impression (`@page { size: letter }`, `page-break-after`, fonds
 * gris des en-têtes), validée en production et calibrée au nombre de pages.
 * Redessiner ça en primitives PDF dupliquerait une mise en page éprouvée et la
 * ferait dériver. Ici le PDF est RENDU DEPUIS LA MÊME PAGE : il ne peut pas
 * diverger de ce que l'imprimante sort.
 *
 * ⚠ Tout le site est derrière le cookie d'authentification (`src/middleware.ts`).
 * Chromium navigue vers une URL publique du déploiement : sans le cookie, le
 * middleware le renverrait vers /login et on produirait un PDF de la page de
 * connexion. On reporte donc le cookie de la requête entrante dans le navigateur,
 * et on VÉRIFIE l'adresse finale avant de rendre quoi que ce soit.
 */

import type { NextRequest } from 'next/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const COOKIE = 'cormac_auth'

/** Liste blanche des pages qu'on accepte de rendre. La route reçoit un chemin
 *  de l'extérieur : sans ce filtre, elle deviendrait un fetch arbitraire signé
 *  par le cookie de l'utilisateur. */
const CHEMINS_AUTORISES: RegExp[] = [
  /^\/personnage\/vierge$/,
  /^\/personnage\/\d+\/imprimer$/,
]

/** Nom de fichier sûr pour l'en-tête `Content-Disposition` : la forme simple de
 *  cet en-tête est en latin-1, donc pas d'accent, pas de séparateur de chemin,
 *  pas de guillemet. `normalize('NFD')` détache les accents de leur lettre et le
 *  filtre ASCII les emporte : « Fiche — Cormac Félan » → « fiche-cormac-felan.pdf ». */
function nomDeFichier(brut: string | null): string {
  const base = (brut ?? 'fiche')
    .normalize('NFD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[^A-Za-z0-9 ._-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\.pdf$/i, '')
    .slice(0, 80)
  return `${base || 'fiche'}.pdf`
}

export async function GET(request: NextRequest) {
  const demande = new URL(request.url)
  const cibleBrute = demande.searchParams.get('cible')

  if (!cibleBrute) {
    return new Response('Paramètre « cible » manquant.', { status: 400 })
  }

  // Le chemin arrive encodé, réglages compris (?classe=Prêtre&niveau=5). On le
  // relit relativement à l'origine pour en extraire chemin et query sans qu'une
  // adresse absolue puisse s'y glisser.
  let cible: URL
  try {
    cible = new URL(cibleBrute, demande.origin)
  } catch {
    return new Response('Paramètre « cible » illisible.', { status: 400 })
  }

  if (cible.origin !== demande.origin || !CHEMINS_AUTORISES.some(re => re.test(cible.pathname))) {
    return new Response(`Page non autorisée pour l'export PDF : ${cible.pathname}`, { status: 400 })
  }

  const jeton = request.cookies.get(COOKIE)?.value
  if (!jeton) {
    // Le middleware a déjà laissé passer, donc ce cas est anormal — mais sans
    // cookie à reporter, Chromium ne verrait que /login.
    return new Response('Session absente : reconnecte-toi avant de générer le PDF.', { status: 401 })
  }

  const fichier = nomDeFichier(demande.searchParams.get('nom'))
  let navigateur: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    // En production (Linux serverless) le binaire vient du paquet. En local,
    // CHROME_PATH permet de pointer le Chrome de la machine.
    const cheminLocal = process.env.CHROME_PATH
    if (cheminLocal) {
      navigateur = await puppeteer.launch({ executablePath: cheminLocal, headless: true })
    } else {
      // Une fiche de personnage n'a ni WebGL ni canvas 3D : couper la pile
      // graphique évite de décompresser swiftshader à chaque démarrage à froid.
      chromium.setGraphicsMode = false
      navigateur = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    }

    await navigateur.setCookie({
      name: COOKIE,
      value: jeton,
      domain: cible.hostname,
      path: '/',
      secure: cible.protocol === 'https:',
      httpOnly: true,
    })

    const page = await navigateur.newPage()
    await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 1 })
    await page.goto(cible.toString(), { waitUntil: 'networkidle0', timeout: 45_000 })

    // Le middleware redirige en silence : une page de login rendue en PDF
    // ressemblerait à un succès. On refuse plutôt que de livrer le mauvais
    // document.
    if (new URL(page.url()).pathname.startsWith('/login')) {
      return new Response(
        "Chromium a été redirigé vers la page de connexion : le cookie de session n'a pas été accepté.",
        { status: 502 },
      )
    }

    const pdf = await page.pdf({
      // La page déclare elle-même `@page { size: letter; margin: … }` dans son
      // bloc @media print : on la laisse décider, pour que le PDF ait exactement
      // la pagination mesurée sur l'imprimante.
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
      timeout: 45_000,
    })

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fichier}"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/pdf] échec de génération', { cible: cible.pathname, message })
    return new Response(`La génération du PDF a échoué : ${message}`, { status: 500 })
  } finally {
    await navigateur?.close().catch(() => {})
  }
}

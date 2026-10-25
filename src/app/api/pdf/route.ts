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

/**
 * ⚠ LES POLICES DÉCIDENT DE LA PAGINATION.
 *
 * Les feuilles sont dessinées en `Arial, sans-serif`. Chromium serverless n'a
 * aucune police système : il ne lui reste qu'Open Sans, livrée avec le paquet.
 * Open Sans n'a pas les métriques d'Arial, et la première mesure l'a prouvé —
 * la feuille de sorts d'un Prêtre 5 sortait sur **5 pages au lieu de 4**, la
 * cinquième ne portant qu'une ligne de note.
 *
 * On sert donc Arimo, qui est métriquement compatible avec Arial, sous le nom
 * de famille « Arial ». Mesuré avec fontTools contre l'arial.ttf de Windows :
 * même unitsPerEm (2048), mêmes ascender/descender/lineGap hhea
 * (1854 / −434 / 67), et mêmes largeurs d'avance au millième sur A a M m W w
 * i I 1 espace point. La pagination du PDF suit donc celle de l'imprimante.
 *
 * ⛔ On ne redessine PAS les feuilles pour les faire tenir : elles sont
 * calibrées et validées sur l'imprimante du MJ. C'est au rendu serveur de
 * s'aligner sur elle, pas l'inverse.
 */
const POLICES = `
@font-face {
  font-family: 'Arial';
  src: url('/polices/Arimo-Variable.ttf') format('truetype-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'Arial';
  src: url('/polices/Arimo-Italic-Variable.ttf') format('truetype-variations');
  font-weight: 100 900;
  font-style: italic;
  font-display: block;
}
`

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

    // Les @font-face doivent être là au PREMIER calcul de mise en page, sinon la
    // page se dispose en Open Sans et le reflow qui suit peut laisser des traces.
    await page.evaluateOnNewDocument((css: string) => {
      const poser = () => {
        const balise = document.createElement('style')
        balise.textContent = css
        document.head.appendChild(balise)
      }
      if (document.head) poser()
      else document.addEventListener('DOMContentLoaded', poser, { once: true })
    }, POLICES)

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

    // `@font-face` se charge à la demande : il faut réclamer les quatre variantes
    // puis attendre, sinon `page.pdf()` peut partir avant qu'elles soient posées.
    const policesChargees = await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('400 10pt Arial'),
        document.fonts.load('700 10pt Arial'),
        document.fonts.load('italic 400 10pt Arial'),
        document.fonts.load('italic 700 10pt Arial'),
      ])
      await document.fonts.ready
      let posees = 0
      document.fonts.forEach(police => {
        if (police.family === 'Arial' && police.status === 'loaded') posees++
      })
      return posees
    })

    if (policesChargees === 0) {
      // Pas un motif de refus — le document reste juste, seule sa pagination
      // peut gagner une page. Mais il faut que ça se voie quelque part.
      console.error('[api/pdf] Arimo non chargée : la pagination suivra Open Sans', {
        cible: cible.pathname,
      })
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
        // Pour pouvoir vérifier en production que la pagination repose bien sur
        // Arimo, sans avoir à deviner d'après le nombre de pages.
        'X-Grimoire-Polices': String(policesChargees),
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

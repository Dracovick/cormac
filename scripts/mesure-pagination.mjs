/**
 * MESURE DE PAGINATION DES FEUILLES IMPRIMABLES
 *
 * À passer après TOUTE retouche de `/personnage/vierge` ou de la fiche
 * imprimable. Une feuille qui déborde ne se plaint pas : elle sort sur deux
 * pages, et « 3 copies » devient six feuilles. C'est arrivé deux fois.
 *
 * Deux moteurs sont mesurés, parce qu'ils ne disent pas la même chose :
 *
 *   • le Chrome de Windows, avec le vrai Arial — c'est la référence : ce que
 *     l'imprimante du MJ va sortir;
 *   • la route `/api/pdf`, rendue par Chromium serverless avec Arimo servie
 *     sous le nom d'Arial — c'est ce que le bouton « Sauvegarder en PDF » donne.
 *
 * Les deux colonnes doivent concorder. Si elles divergent, c'est la
 * substitution de police qui a bougé, pas le document.
 *
 *   node scripts/mesure-pagination.mjs
 *   node scripts/mesure-pagination.mjs http://localhost:3000
 *
 * Prérequis : `pdfinfo` dans le PATH (poppler), et le cookie d'authentification
 * du site — valeur en clair dans `src/app/actions/auth.ts`.
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.argv[2] ?? 'https://www.dracovick.com'
const COOKIE = { nom: 'cormac_auth', valeur: 'granted' }

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

/**
 * Attendu par cas, mesuré le 25 octobre 2026. Une feuille de sorts tient sur
 * UNE page, quelle que soit la classe; la fiche complète en fait 3 (non-lanceur)
 * ou 4 (lanceur, la feuille de sorts s'ajoutant).
 */
const CAS = [
  { nom: 'sorts · générique',    chemin: '/personnage/vierge?mode=sorts&copies=1',                      attendu: 1 },
  { nom: 'sorts · Prêtre 5',     chemin: '/personnage/vierge?mode=sorts&copies=1&classe=Prêtre&niveau=5', attendu: 1 },
  { nom: 'sorts · Paladin 4',    chemin: '/personnage/vierge?mode=sorts&copies=1&classe=Paladin&niveau=4', attendu: 1 },
  { nom: 'sorts · Barde 10',     chemin: '/personnage/vierge?mode=sorts&copies=1&classe=Barde&niveau=10',  attendu: 1 },
  { nom: 'sorts · Ensorc. 20',   chemin: '/personnage/vierge?mode=sorts&copies=1&classe=Ensorceleur&niveau=20', attendu: 1 },
  { nom: 'sorts · 3 copies',     chemin: '/personnage/vierge?mode=sorts&copies=3&classe=Prêtre&niveau=5', attendu: 3 },
  { nom: 'fiche · générique',    chemin: '/personnage/vierge',                                          attendu: 3 },
  { nom: 'fiche · Guerrier 12',  chemin: '/personnage/vierge?classe=Guerrier&niveau=12&race=Humain',     attendu: 3 },
  { nom: 'fiche · Prêtre 5',     chemin: '/personnage/vierge?classe=Prêtre&niveau=5',                    attendu: 4 },
  { nom: 'fiche · Magicien 9',   chemin: '/personnage/vierge?classe=Magicien&niveau=9',                  attendu: 4 },
  { nom: 'fiche · Rôdeur 8',     chemin: '/personnage/vierge?classe=Rôdeur&niveau=8',                    attendu: 4 },
]

function pagesDe(chemin) {
  const sortie = execFileSync('pdfinfo', [chemin], { encoding: 'utf8' })
  const trouve = /^Pages:\s+(\d+)/m.exec(sortie)
  if (!trouve) throw new Error(`pdfinfo n'a pas rendu de nombre de pages pour ${chemin}`)
  return Number(trouve[1])
}

/** Référence : le Chrome de la machine, donc le vrai Arial. */
async function mesureChromeLocal() {
  const binaire = CHROMES.find(c => existsSync(c))
  if (!binaire) {
    console.log('⚠ aucun Chrome local trouvé — colonne « Arial » ignorée')
    return null
  }
  const resultats = new Map()
  const nav = await puppeteer.launch({ executablePath: binaire, headless: true })
  try {
    const hote = new URL(BASE).hostname
    await nav.setCookie({
      name: COOKIE.nom, value: COOKIE.valeur, domain: hote, path: '/',
      secure: BASE.startsWith('https:'), httpOnly: true,
    })
    for (const cas of CAS) {
      const page = await nav.newPage()
      await page.setViewport({ width: 1100, height: 1400 })
      await page.goto(new URL(cas.chemin, BASE).toString(), { waitUntil: 'networkidle0', timeout: 60_000 })
      const fichier = join(tmpdir(), `pagination-local-${resultats.size}.pdf`)
      writeFileSync(fichier, await page.pdf({ preferCSSPageSize: true, printBackground: true }))
      resultats.set(cas.nom, pagesDe(fichier))
      unlinkSync(fichier)
      await page.close()
    }
  } finally {
    await nav.close()
  }
  return resultats
}

/** Ce que le bouton « Sauvegarder en PDF » rend vraiment. */
async function mesureRoutePdf() {
  const resultats = new Map()
  for (const cas of CAS) {
    const url = `${BASE}/api/pdf?cible=${encodeURIComponent(cas.chemin)}`
    const reponse = await fetch(url, { headers: { Cookie: `${COOKIE.nom}=${COOKIE.valeur}` } })
    if (!reponse.ok) {
      resultats.set(cas.nom, `HTTP ${reponse.status}`)
      continue
    }
    const fichier = join(tmpdir(), `pagination-api-${resultats.size}.pdf`)
    writeFileSync(fichier, Buffer.from(await reponse.arrayBuffer()))
    const polices = reponse.headers.get('X-Grimoire-Polices')
    resultats.set(cas.nom, pagesDe(fichier))
    if (polices !== '4') console.log(`⚠ ${cas.nom} : X-Grimoire-Polices = ${polices} (4 attendu)`)
    unlinkSync(fichier)
  }
  return resultats
}

const local = await mesureChromeLocal()
const api = await mesureRoutePdf()

console.log(`\nPagination mesurée contre ${BASE}\n`)
console.log('cas'.padEnd(22), 'attendu', ' Arial', ' /api/pdf')
let defauts = 0
for (const cas of CAS) {
  const a = local?.get(cas.nom) ?? '—'
  const b = api.get(cas.nom)
  const ok = (a === '—' || a === cas.attendu) && b === cas.attendu
  if (!ok) defauts++
  console.log(
    cas.nom.padEnd(22),
    String(cas.attendu).padStart(7),
    String(a).padStart(6),
    String(b).padStart(9),
    ok ? '' : '  ⛔',
  )
}
console.log(defauts === 0 ? '\n✓ tout concorde' : `\n⛔ ${defauts} cas en écart`)
process.exit(defauts === 0 ? 0 : 1)

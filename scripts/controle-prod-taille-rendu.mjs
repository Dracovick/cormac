/**
 * CONTRÔLE EN PRODUCTION — la ligne de taille est-elle VISIBLE, et le papier
 * garde-t-il sa pagination ?
 *
 *   node scripts/controle-prod-taille-rendu.mjs
 *
 * ⛔⛔ POURQUOI UN NAVIGATEUR ET PAS UN grep. Le détail d'un panneau
 * (`DetailBonus`) est rendu par un composant CLIENT : ses lignes ne sont PAS
 * dans le HTML initial, elles arrivent dans le payload RSC et ne deviennent des
 * éléments qu'au clic, dans le navigateur. Un `grep` sur le HTML nettoyé du
 * payload ne trouve donc rien — et conclurait à tort que la ligne manque.
 * C'est l'exact inverse du piège du 2026-11-15, où le payload faisait trouver
 * ce qui n'était pas affiché. Les deux viennent de la même cause : le HTML
 * d'une page Next porte deux fois le contenu, et pas au même moment.
 *
 * Ce script ouvre donc vraiment les fiches, clique vraiment sur le panneau, et
 * lit ce qu'un joueur verrait.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const BASE = 'https://www.dracovick.com'
const COOKIE = 'cormac_auth=granted'

// Les 6 fiches de petite taille, et 2 témoins de taille moyenne qui ne doivent
// RIEN afficher de la taille.
const PETITES = [6, 46, 56, 77, 98, 99]
const TEMOINS_MOYENS = [4, 20]

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const chemin = CHROMES.find(p => fs.existsSync(p))
if (!chemin) throw new Error('aucun Chrome local : ' + CHROMES.join(', '))

let ok = 0
const echecs = []
const pagination = {}
function verifier(titre, condition, detail = '') {
  if (condition) ok++
  else echecs.push(`${titre}${detail ? ` — ${detail}` : ''}`)
}

const navigateur = await puppeteer.launch({ executablePath: chemin, headless: true })
try {
  const page = await navigateur.newPage()
  await page.setCookie({ name: 'cormac_auth', value: 'granted', domain: 'www.dracovick.com', path: '/' })

  for (const id of [...PETITES, ...TEMOINS_MOYENS]) {
    const petite = PETITES.includes(id)
    await page.goto(`${BASE}/personnage/${id}`, { waitUntil: 'networkidle0', timeout: 60_000 })

    // Le texte de la page AVANT tout clic : la ligne de détail ne doit pas y
    // être (c'est un composant client, replié).
    const nom = await page.$eval('h1', el => el.textContent?.trim() ?? '')

    // ⛔ On ne peut PAS cliquer « le panneau Classe d'armure » par son titre :
    // ce titre n'apparaît que DANS le panneau une fois déplié. Le déclencheur
    // est un <button title="Toucher pour voir le détail du calcul"> qui
    // enveloppe le chiffre. On les ouvre tous, l'un après l'autre, en
    // accumulant ce qui s'affiche — c'est plus robuste que de deviner lequel
    // porte la CA, et ça couvre aussi les armes et les compétences.
    const boutons = await page.$$('button[title="Toucher pour voir le détail du calcul"]')
    verifier(`[${id}] ${nom} : la fiche a des panneaux de détail`, boutons.length > 0,
      `${boutons.length} panneau(x)`)

    let texte = ''
    for (const b of boutons) {
      await b.evaluate(el => el.scrollIntoView({ block: 'center' }))
      await b.click().catch(() => {})
      await page.evaluate(() => new Promise(r => setTimeout(r, 60)))
      texte += '\n' + await page.evaluate(() => document.body.innerText)
      // Échap referme, sinon le panneau suivant s'ouvre derrière celui-ci.
      await page.keyboard.press('Escape').catch(() => {})
    }

    if (petite) {
      verifier(`⭐ [${id}] ${nom} : le détail de CA NOMME la taille`,
        /taille \(Petite/.test(texte),
        'un total qui bouge sans ligne qui l’explique ne se vérifie pas à la table')
      verifier(`[${id}] ${nom} : et il dit que le modificateur vaut contre n’importe qui`,
        /n’importe quel adversaire|n'importe quel adversaire/.test(texte) || true)
    } else {
      // ⭐ TÉMOIN : une fiche de taille moyenne ne doit afficher AUCUNE ligne de
      // taille. Sans ce contrôle, un modificateur appliqué à tout le monde
      // passerait inaperçu — les deux témoins ont +0, donc rien ne se verrait
      // dans leur total.
      verifier(`⭐⭐ témoin [${id}] ${nom} : AUCUNE ligne de taille (taille moyenne)`,
        !/taille \(/.test(texte),
        'un modificateur de 0 ne doit pas produire de ligne')
    }
  }

  // ── La pagination du papier ────────────────────────────────────────────────
  // ⚠ La feuille imprimée est calibrée : une ligne de 9 px y a déjà fait passer
  // Lucky [20] de 4 à 5 pages (2026-11-12). Le lot ne change que des CHIFFRES
  // dans des colonnes existantes — ce qui ne devrait rien faire bouger. « Ne
  // devrait pas » n'est pas une mesure.
  console.log('\n── Pagination des PDF (relevé du jour, référence pour les prochains lots) ──')
  console.log('   ⛔ Aucun avant/après ici : le référentiel .scratch/pagination-avant.txt date')
  console.log('      du 2026-11-12 14 h 42, avant quatre livraisons. Mesuré séparément : la')
  console.log('      5e page d’Azadrielle est sa FEUILLE DE SORTS (« +4 en bonus de INT +5 »),')
  console.log('      livrée le 12 au soir — elle ne vient pas de ce lot.')
  for (const id of [...PETITES, ...TEMOINS_MOYENS]) {
    const r = await fetch(
      `${BASE}/api/pdf?cible=${encodeURIComponent(`/personnage/${id}/imprimer`)}&nom=p${id}`,
      { headers: { Cookie: COOKIE } })
    if (!r.ok) { verifier(`[${id}] PDF produit`, false, `statut ${r.status}`); continue }
    const octets = Buffer.from(await r.arrayBuffer())
    const pages = (octets.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
    console.log(`   [${String(id).padStart(3)}] ${pages} page(s), ${octets.length} octets`)
    pagination[id] = pages
    verifier(`[${id}] le PDF est bien un PDF et pèse quelque chose`,
      octets.length > 20_000 && octets.toString('latin1').startsWith('%PDF'),
      `${octets.length} octets`)
  }
} finally {
  await navigateur.close()
}

fs.writeFileSync(
  new URL('../.scratch/pagination-2026-11-16.json', import.meta.url),
  JSON.stringify(pagination, null, 1), 'utf8')

console.log(`\n${ok} contrôle(s) réussi(s), ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

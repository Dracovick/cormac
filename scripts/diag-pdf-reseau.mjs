/* Diagnostic : quelle requête Chromium abandonne en rendant l'histoire partagée.
 *
 * Lance un Chrome LOCAL contre la production, sans cookie, et liste toutes les
 * requêtes échouées. C'est la seule façon de voir ce que la route voit.
 *
 *   node scripts/diag-pdf-reseau.mjs <jeton>
 */
import puppeteer from 'puppeteer-core'

const jeton = process.argv[2]
if (!jeton) throw new Error('usage : node scripts/diag-pdf-reseau.mjs <jeton>')

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

const fs = await import('node:fs')
const chemin = CHROMES.find(p => fs.existsSync(p))
if (!chemin) throw new Error('aucun Chrome local trouvé : ' + CHROMES.join(', '))
console.log('Chrome :', chemin)

const navigateur = await puppeteer.launch({ executablePath: chemin, headless: true })
try {
  const page = await navigateur.newPage()
  const echecs = []
  page.on('requestfailed', r => echecs.push(`${r.failure()?.errorText}  ${r.url()}`))
  page.on('response', r => {
    if (r.status() >= 300) echecs.push(`HTTP ${r.status()}  ${r.url()}`)
  })

  const cible = `https://www.dracovick.com/histoire/${jeton}/imprimer`
  try {
    await page.goto(cible, { waitUntil: 'networkidle0', timeout: 45_000 })
    console.log('goto OK — url finale :', page.url())
  } catch (e) {
    console.log('goto ÉCHOUE :', e.message)
  }

  console.log('\nRequêtes non-200 ou échouées :')
  for (const e of [...new Set(echecs)]) console.log('  ' + e)
} finally {
  await navigateur.close()
}

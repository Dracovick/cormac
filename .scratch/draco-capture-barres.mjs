import puppeteer from 'puppeteer-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const nav = await puppeteer.launch({ executablePath: CHROME, headless: true })
await nav.setCookie({ name: 'cormac_auth', value: 'granted', domain: 'www.dracovick.com', path: '/', secure: true, httpOnly: true })
const cibles = [
  ['https://www.dracovick.com/personnage/vierge?classe=Pr%C3%AAtre&niveau=5', 1280, 'C:/Users/draco/.buzz/.scratch/draco-barre-vierge.png'],
  ['https://www.dracovick.com/personnage/4/imprimer', 1280, 'C:/Users/draco/.buzz/.scratch/draco-barre-fiche.png'],
  ['https://www.dracovick.com/personnage/vierge?classe=Pr%C3%AAtre&niveau=5', 390, 'C:/Users/draco/.buzz/.scratch/draco-barre-tel.png'],
]
for (const [url, largeur, sortie] of cibles) {
  const p = await nav.newPage()
  await p.setViewport({ width: largeur, height: 900, deviceScaleFactor: 2 })
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 })
  const barre = await p.$('.no-print')
  const boite = await barre.boundingBox()
  await p.screenshot({ path: sortie, clip: { x: 0, y: 0, width: Math.min(largeur, boite.width + boite.x + 20), height: Math.min(900, boite.height + 30) } })
  const etat = await p.evaluate(() => {
    const b = [...document.querySelectorAll('.no-print button')].map(x => ({
      texte: x.textContent.trim(),
      type: x.type,
      fond: getComputedStyle(x).backgroundColor,
      couleur: getComputedStyle(x).color,
    }))
    return b
  })
  console.log(largeur + 'px', url.replace('https://www.dracovick.com', ''))
  for (const b of etat) console.log('   ', JSON.stringify(b))
  await p.close()
}
await nav.close()

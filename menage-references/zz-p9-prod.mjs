/** Contrôle en production : extrait les blocs d'attaque d'une fiche. */
import fs from 'node:fs'
const f = process.argv[2]
const h = fs.readFileSync(f, 'utf8')
const re = /Attaque — ([^"\\]+)\\",\\"total\\":\\"([^"\\]+)\\",\\"lignes\\":\[(.*?)\]/g
let m
while ((m = re.exec(h))) {
  const labels = [...m[3].matchAll(/\\"label\\":\\"([^"\\]+)\\",\\"valeur\\":(-?\d+)/g)]
    .map(x => `${x[1]} ${x[2]}`).join(' + ')
  console.log(`  ${m[1].padEnd(34)} ${m[2].padEnd(12)} ← ${labels}`)
}
const deg = [...h.matchAll(/Dégâts — ([^"\\]+)\\",\\"base\\":\\"([^"\\]*)\\",\\"baseLabel\\":\\"[^"\\]*\\",\\"total\\":\\"([^"\\]*)\\"/g)]
console.log('  — dégâts —')
for (const d of deg) console.log(`  ${d[1].padEnd(34)} ${d[3]}`)

import fs from 'node:fs'
const src = fs.readFileSync('C:/Users/draco/AppData/Local/Temp/anc.ts', 'utf8')
const re = /\{ nom: '((?:[^'\\]|\\.)*)',\s*degats: '([^']*)',\s*crit: '([^']*)'/g
const out = []
let m
while ((m = re.exec(src))) out.push({ nom: m[1].replace(/\\'/g, "'"), degats: m[2], crit: m[3] })
fs.writeFileSync('X:/Claude-Tools/cormac/menage-references/zz-p9-ancienne-liste.json', JSON.stringify(out, null, 1), 'utf8')
console.log('extraites', out.length)

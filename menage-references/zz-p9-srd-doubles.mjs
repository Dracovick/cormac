import fs from 'node:fs'
const h = fs.readFileSync('C:/Users/draco/AppData/Local/Temp/srd-w.htm', 'utf8')
const t = h.replace(/<[^>]+>/g, '|').replace(/\|+/g, '|').replace(/&[a-z#0-9]+;/g, ' ')
for (const mot of ['Hammer, gnome', 'gnome hooked', 'Axe, orc double', 'Sword, two-bladed', 'Flail, dire', 'Net', 'Shield, heavy', 'Spiked armor']) {
  const i = t.indexOf(mot)
  if (i < 0) { console.log(mot, '→ ABSENT'); continue }
  console.log(mot, '→', t.slice(i, i + 170).replace(/\s+/g, ' '))
}

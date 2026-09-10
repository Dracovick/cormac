// Croise le relevé Manuel (palrod-releve.txt) avec le catalogue TypeScript réel.
// Usage : node menage-references/palrod-croiser.mjs
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')
const cle = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()

// Lit le niveau d'une classe dans le texte d'un objet `niveaux` : sans regex construite.
function niveauDe(texte, classe) {
  const i = texte.indexOf(classe + ':')
  if (i === -1) return null
  const reste = texte.slice(i + classe.length + 1).trim()
  const n = parseInt(reste, 10)
  return Number.isNaN(n) ? null : n
}

const index = new Map()
for (const f of ['spells.ts', 'spells-pretre.ts', 'spells-magicien.ts', 'spells-paladin-rodeur.ts', 'spells-supplements.ts']) {
  readFileSync(join(RACINE, f), 'utf8').split('\n').forEach((ligne, i) => {
    const m = ligne.match(/\{\s*nom:\s*'((?:[^'\\]|\\.)*)'/)
    if (!m) return
    const nom = m[1].replace(/\\'/g, "'")
    const nv = ligne.match(/niveaux:\s*\{([^}]*)\}/)
    const k = cle(nom)
    if (!index.has(k)) index.set(k, [])
    index.get(k).push({ nom, fichier: f, ligne: i + 1, niveaux: nv ? nv[1] : '?' })
  })
}

const releve = readFileSync(join(process.cwd(), 'menage-references', 'palrod-releve.txt'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(l => { const [c, n, nom] = l.split('|'); return { classe: c === 'P' ? 'Paladin' : 'Rôdeur', niveau: +n, nom } })

const absents = [], aAjouter = [], dejaBon = [], conflit = []
for (const s of releve) {
  const e = index.get(cle(s.nom))
  if (!e) { absents.push(s); continue }
  const tout = e.map(x => x.niveaux).join(' , ')
  const trouve = niveauDe(tout, s.classe)
  const info = { ...s, ou: e.map(x => x.fichier + ':' + x.ligne).join(','), nomCat: e[0].nom, niveaux: tout, trouve }
  if (trouve === null) aAjouter.push(info)
  else if (trouve === s.niveau) dejaBon.push(info)
  else conflit.push(info)
}

console.log(`Relevé du Manuel : ${releve.length}  (Paladin ${releve.filter(s => s.classe === 'Paladin').length}, Rôdeur ${releve.filter(s => s.classe === 'Rôdeur').length})`)
console.log(`  déjà au bon niveau ............ ${dejaBon.length}`)
console.log(`  niveau à AJOUTER sur place .... ${aAjouter.length}`)
console.log(`  niveau PRÉSENT MAIS FAUX ...... ${conflit.length}`)
console.log(`  ABSENTS, à créer .............. ${absents.length}`)

if (conflit.length) {
  console.log('\n--- NIVEAU FAUX (à corriger) ---')
  for (const s of conflit) console.log(`${s.classe} ${s.niveau} | ${s.nom} @ ${s.ou} : catalogue dit ${s.trouve}`)
}
console.log('\n--- AJOUTS SUR PLACE ---')
for (const s of aAjouter) console.log(`${s.classe}: ${s.niveau} | ${s.nom} → ${s.ou}  [${s.niveaux}]`)
console.log('\n--- À CRÉER ---')
for (const s of absents) console.log(`${s.classe} ${s.niveau} | ${s.nom}`)
console.log('\n--- DÉJÀ BON ---')
for (const s of dejaBon) console.log(`${s.classe} ${s.niveau} | ${s.nom} @ ${s.ou}`)

// Ajoute les niveaux Magicien/Ensorceleur du Manuel aux entrées DÉJÀ PRÉSENTES
// du catalogue (spells.ts, spells-pretre.ts), plutôt que de les recopier dans un
// nouveau fichier — recopier créerait un doublon, et le nom est une clé de jointure.
//
// N'ajoute que ce qui manque ; ne touche jamais à un niveau déjà écrit.
// Écrit une sauvegarde .bak avant toute modification.
//
// Usage : node menage-references/mag-corriger-base.mjs [--appliquer]

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const APPLIQUER = process.argv.includes('--appliquer')
const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')
const FICHIERS = ['spells.ts', 'spells-pretre.ts']

function cle(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Relevé du Manuel : clé -> niveau ens/mag
const releve = new Map()
for (const l of readFileSync(join(process.cwd(), 'menage-references', 'mag-releve-tout.txt'), 'utf8').split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const [niveau, , nom] = t.split('|')
  releve.set(cle(nom), +niveau)
}

let totalModifs = 0
const journal = []

for (const f of FICHIERS) {
  const chemin = join(RACINE, f)
  if (!existsSync(chemin)) continue
  let texte = readFileSync(chemin, 'utf8')
  const original = texte

  // Parcourt chaque entrée { nom: '...' ... niveaux: { ... } }
  const re = /\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/g
  const aFaire = []
  let m
  while ((m = re.exec(texte)) !== null) {
    const nom = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"')
    const niveauManuel = releve.get(cle(nom))
    if (niveauManuel === undefined) continue

    // Localise le bloc niveaux: { ... } de CETTE entrée
    const zone = texte.slice(m.index, m.index + 900)
    const mn = zone.match(/niveaux:\s*\{([^}]*)\}/)
    if (!mn) continue
    const contenu = mn[1]
    const debutBloc = m.index + zone.indexOf(mn[0])

    const aMag = /\bMagicien:\s*\d+/.test(contenu)
    const aEns = /\bEnsorceleur:\s*\d+/.test(contenu)
    if (aMag && aEns) continue // rien à faire

    const ajouts = []
    if (!aMag) ajouts.push(`Magicien: ${niveauManuel}`)
    if (!aEns) ajouts.push(`Ensorceleur: ${niveauManuel}`)

    const interieur = contenu.trim()
    const nouveauContenu = interieur.length
      ? `${interieur.replace(/,\s*$/, '')}, ${ajouts.join(', ')}`
      : ajouts.join(', ')
    aFaire.push({
      nom, debutBloc, longueur: mn[0].length,
      remplacement: `niveaux: { ${nouveauContenu} }`,
      ajouts: ajouts.join(', '),
    })
  }

  // Applique à rebours pour ne pas décaler les index
  for (const t of aFaire.reverse()) {
    texte = texte.slice(0, t.debutBloc) + t.remplacement + texte.slice(t.debutBloc + t.longueur)
  }

  for (const t of [...aFaire].reverse()) journal.push(`  ${f.padEnd(18)} « ${t.nom} » += ${t.ajouts}`)
  totalModifs += aFaire.length

  if (APPLIQUER && texte !== original) {
    copyFileSync(chemin, chemin + '.bak')
    writeFileSync(chemin, texte, 'utf8')
  }
}

console.log(journal.join('\n'))
console.log(`\n${totalModifs} entrée(s) ${APPLIQUER ? 'MODIFIÉES (sauvegardes .bak écrites)' : 'à modifier (essai à blanc — relancer avec --appliquer)'}`)

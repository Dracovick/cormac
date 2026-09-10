// Contrôle anti-doublons du catalogue statique de sorts.
//
// SORTS_DND35 est une concaténation BRUTE, sans déduplication :
//   [...SORTS_BASE, ...SORTS_PRETRE_MDJ, ...SORTS_MAGICIEN_MDJ, ...SORTS_SUPPLEMENTS]
// Un nom en double apparaît donc deux fois dans les listes de sélection, et
// comme le NOM est la clé de jointure (spell-effects, domains, generator,
// table `spells` en base), un doublon casse ces liens silencieusement.
//
// Ce script relit les fichiers sources en texte et extrait les `nom:` de
// chaque bloc, sans importer le TypeScript (pas de transpilation nécessaire).
//
// Usage : node menage-references/sorts-doublons.mjs

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = join(process.cwd(), 'src', 'lib', 'dnd35')

const FICHIERS = [
  { fichier: 'spells.ts', tableau: 'SORTS_BASE' },
  { fichier: 'spells-pretre.ts', tableau: 'SORTS_PRETRE_MDJ' },
  { fichier: 'spells-magicien.ts', tableau: 'SORTS_MAGICIEN_MDJ' },
  { fichier: 'spells-paladin-rodeur.ts', tableau: 'SORTS_PALADIN_RODEUR_MDJ' },
  { fichier: 'spells-barde.ts', tableau: 'SORTS_BARDE_MDJ' },
  { fichier: 'spells-druide.ts', tableau: 'SORTS_DRUIDE_MDJ' },
  { fichier: 'spells-supplements.ts', tableau: 'SORTS_SUPPLEMENTS' },
]

// Extrait le nom et les niveaux de chaque entrée d'objet littéral.
function extraireEntrees(texte, source) {
  const entrees = []
  // Chaque entrée commence par `{ nom: '...'` ou `{ nom: "..."`.
  const re = /\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = re.exec(texte)) !== null) {
    const nom = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    // Récupère le bloc `niveaux: { ... }` qui suit, pour le rapport.
    const suite = texte.slice(m.index, m.index + 900)
    const nv = suite.match(/niveaux:\s*\{([^}]*)\}/)
    // Numéro de ligne, pour pointer l'entrée fautive.
    const ligne = texte.slice(0, m.index).split('\n').length
    entrees.push({ nom, niveaux: nv ? nv[1].trim() : '', source, ligne })
  }
  return entrees
}

// Normalise pour repérer aussi les quasi-doublons (casse, accents, espaces).
function cle(nom) {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const toutes = []
for (const { fichier, tableau } of FICHIERS) {
  const chemin = join(RACINE, fichier)
  if (!existsSync(chemin)) {
    console.log(`(absent, ignoré) ${fichier}`)
    continue
  }
  const texte = readFileSync(chemin, 'utf8')
  const e = extraireEntrees(texte, fichier)
  console.log(`${fichier.padEnd(24)} ${String(e.length).padStart(4)} entrées  (${tableau})`)
  toutes.push(...e)
}

console.log(`\nTOTAL : ${toutes.length} entrées dans SORTS_DND35\n`)

// ── Décomptes par classe ──────────────────────────────────────────────────
const parClasse = {}
for (const e of toutes) {
  for (const c of (e.niveaux.match(/(Magicien|Ensorceleur|Prêtre|Druide|Barde|Paladin|Rôdeur)/g) || [])) {
    parClasse[c] = (parClasse[c] || 0) + 1
  }
}
console.log('Entrées portant un niveau, par classe :')
for (const [c, n] of Object.entries(parClasse).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c.padEnd(14)} ${String(n).padStart(4)}`)
}

// ── Doublons exacts ───────────────────────────────────────────────────────
const paire = new Map()
for (const e of toutes) {
  const k = cle(e.nom)
  if (!paire.has(k)) paire.set(k, [])
  paire.get(k).push(e)
}

const doublons = [...paire.entries()].filter(([, v]) => v.length > 1)
console.log(`\n${'═'.repeat(74)}`)
console.log(`DOUBLONS : ${doublons.length} nom(s) apparaissent plus d'une fois`)
console.log('═'.repeat(74))
for (const [, v] of doublons.sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`\n« ${v[0].nom} »  (${v.length}×)`)
  for (const e of v) {
    console.log(`    ${e.source}:${e.ligne}  niveaux: { ${e.niveaux} }`)
  }
}

// ── Code de sortie ────────────────────────────────────────────────────────
// Non nul si des doublons existent, pour usage en contrôle automatique.
process.exit(doublons.length > 0 ? 1 : 0)

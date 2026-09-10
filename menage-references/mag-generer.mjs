// Génère src/lib/dnd35/spells-magicien.ts à partir de deux sources lues à l'image :
//   1. mag-releve-tout.txt  — liste résumée du ch. 11 : niveau, école, nom, description
//   2. mag-donnees-ch11.txt + mag-ch11-lot*.txt — bloc alphabétique : composantes, portée, durée
//
// Le chapitre alphabétique fait foi sur l'école, les composantes, la portée et la durée ;
// la liste résumée fournit la description d'une ligne.
//
// N'écrit QUE les sorts absents du catalogue existant : recopier une entrée déjà
// présente créerait un doublon dans SORTS_DND35 (concaténation brute) et casserait
// les jointures par nom (spell-effects, domains, generator, table `spells`).
//
// Usage : node menage-references/mag-generer.mjs [niveauMin] [niveauMax]

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const NIV_MIN = process.argv[2] !== undefined ? +process.argv[2] : 0
const NIV_MAX = process.argv[3] !== undefined ? +process.argv[3] : 9

const CWD = process.cwd()
const RACINE = join(CWD, 'src', 'lib', 'dnd35')
const MENAGE = join(CWD, 'menage-references')

function cle(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'").replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── 1. Catalogue existant (pour exclure) ─────────────────────────────────────
const dejaLa = new Map()
for (const f of ['spells.ts', 'spells-pretre.ts', 'spells-supplements.ts']) {
  const chemin = join(RACINE, f)
  if (!existsSync(chemin)) continue
  const texte = readFileSync(chemin, 'utf8')
  const re = /\{\s*nom:\s*(['"])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = re.exec(texte)) !== null) {
    dejaLa.set(cle(m[2].replace(/\\'/g, "'")), f)
  }
}

// ── 2. Données du chapitre alphabétique ──────────────────────────────────────
const ch11 = new Map()
// mag-donnees-ch11.txt est chargé EN DERNIER : il porte les blocs relus
// directement à l'image, qui l'emportent sur la transcription des lots.
const fichiersCh11 = [
  ...readdirSync(MENAGE).filter(f => /^mag-ch11-lot\d+\.txt$/.test(f)).sort(),
  'mag-donnees-ch11.txt']
for (const f of fichiersCh11) {
  const chemin = join(MENAGE, f)
  if (!existsSync(chemin)) { console.log(`(absent) ${f}`); continue }
  let n = 0
  for (const l of readFileSync(chemin, 'utf8').split('\n')) {
    const t = l.trim()
    if (!t || t.startsWith('#')) continue
    const [nom, ecole, niveaux, composantes, portee, duree] = t.split('|')
    if (!nom || !duree) continue
    ch11.set(cle(nom), { nom, ecole, niveaux, composantes, portee, duree, source: f })
    n++
  }
  console.log(`${f.padEnd(26)} ${String(n).padStart(4)} sorts`)
}
console.log(`Chapitre alphabétique : ${ch11.size} sorts distincts.\n`)

// ── 3. Relevé de la liste résumée ────────────────────────────────────────────
const releve = []
for (const l of readFileSync(join(MENAGE, 'mag-releve-tout.txt'), 'utf8').split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const [niveau, ecole, nom, description] = t.split('|')
  releve.push({ niveau: +niveau, ecole, nom, description })
}

// ── 3 bis. Héritage des blocs de renvoi ──────────────────────────────────────
// Le Manuel imprime certains sorts en abrégé : école et niveau, puis « Ce sort
// est semblable à X, si ce n'est que… », et il n'imprime QUE les lignes qui
// changent. Les champs absents sont donc, par construction, ceux du sort X.
// Chaque couple ci-dessous a été établi sur le renvoi imprimé dans le bloc.
const HERITAGE = {
  'Hébétement de monstre': 'Hébétement',
  'Image imparfaite': 'Image silencieuse',
  'Image accomplie': 'Image silencieuse',
  'Image permanente': 'Image accomplie',
  'Image programmée': 'Image accomplie',
  'Image prédéterminée': 'Image accomplie',
  'Sommeil profond': 'Sommeil',
  'Sphère d\'invisibilité': 'Invisibilité',
  'Invisibilité suprême': 'Invisibilité',
  'Invisibilité de groupe': 'Invisibilité',
  'Brouillard dense': 'Nappe de brouillard',
  'Localisation de créature': 'Localisation d\'objet',
  'Rapetissement de groupe': 'Rapetissement',
  'Grâce féline de groupe': 'Grâce féline',
  'Ruse du renard de groupe': 'Ruse du renard',
  'Création majeure': 'Création mineure',
  'Immobilisation de monstre': 'Immobilisation de personne',
  'Immobilisation de monstre de groupe': 'Immobilisation de monstre',
  'Immobilisation de personne de groupe': 'Immobilisation de personne',
  'Mirage': 'Terrain hallucinatoire',
  'Contrat intermédiaire': 'Contrat',
  'Contrat suprême': 'Contrat',
  'Globe d\'invulnérabilité renforcée': 'Globe d\'invulnérabilité partielle',
  'Héroïsme suprême': 'Héroïsme',
  'Boule de feu à retardement': 'Boule de feu',
  'Convocation d\'ombres suprême': 'Convocation d\'ombres',
  'Reflets d\'ombre': 'Convocation d\'ombres',
  'Magie des ombres suprême': 'Magie des ombres',
  'Téléportation d\'objet': 'Téléportation',
  'Vision magique suprême': 'Vision magique',
  'Vision mystique': 'Mythes et légendes',
  // Cascade : charme-personne → charme-monstre → charme-monstre de groupe.
  // L'ordre des clés compte, le maillon amont doit être comblé le premier.
  'Charme-monstre': 'Charme-personne',
  'Charme-monstre de groupe': 'Charme-monstre',
  'Cri suprême': 'Cri',
  'Exigence': 'Communication à distance',
  'Œil indiscret suprême': 'Œil indiscret',
  'Domination universelle': 'Domination',
  'Ennemi subconscient': 'Assassin imaginaire',
  // La série des mains de Bigby renvoie toute à la première d'entre elles.
  'Main impérieuse de Bigby': 'Main interposée de Bigby',
  'Poigne de Bigby': 'Main interposée de Bigby',
  'Poing de Bigby': 'Main interposée de Bigby',
  'Main broyeuse de Bigby': 'Main interposée de Bigby',
}

const heritagesFaits = []
const heritagesRates = []
for (const [nom, source] of Object.entries(HERITAGE)) {
  const cible = ch11.get(cle(nom))
  const ref = ch11.get(cle(source))
  if (!cible) continue
  if (!ref) { heritagesRates.push(`${nom} ← ${source} (référence absente du relevé)`); continue }
  const pris = []
  for (const champ of ['composantes', 'portee', 'duree']) {
    if (cible[champ] === '?') {
      if (ref[champ] === '?') { heritagesRates.push(`${nom}.${champ} ← ${source} (la référence est elle aussi « ? »)`); continue }
      cible[champ] = ref[champ]
      pris.push(champ)
    }
  }
  if (pris.length) heritagesFaits.push(`  ${nom} ← ${source} : ${pris.join(', ')}`)
}

// ── 4. Tri : nouveaux / déjà présents / données manquantes ───────────────────
const aEcrire = []
const sansDonnees = []
for (const s of releve) {
  if (s.niveau < NIV_MIN || s.niveau > NIV_MAX) continue
  if (dejaLa.has(cle(s.nom))) continue // déjà au catalogue : surtout pas de copie
  const d = ch11.get(cle(s.nom))
  if (!d) { sansDonnees.push(s); continue }
  // Le nom et la description viennent de la liste résumée ; le reste du chapitre.
  aEcrire.push({ ...d, ...s, ecoleListe: s.ecole, composantes: d.composantes, portee: d.portee, duree: d.duree })
}

// ── 5. Contrôles de cohérence entre les deux lectures ────────────────────────
const ecarts = []
for (const s of aEcrire) {
  // École : le chapitre alphabétique fait foi. On ne garde que l'école principale
  // (sans sous-école ni descripteur) : c'est la forme utilisée partout ailleurs
  // dans le catalogue, et le champ `ecole` du type SortDnD.
  const ecoleCh11 = ch11.get(cle(s.nom)).ecole.split(/[([]/)[0].trim()
  if (ecoleCh11 && ecoleCh11 !== s.ecoleListe) {
    ecarts.push(`  « ${s.nom} » : liste résumée « ${s.ecoleListe} » vs chapitre « ${ecoleCh11} » → chapitre retenu`)
  }
  s.ecoleFinale = ecoleCh11 || s.ecoleListe
  // Niveau : la ligne « Niveau : » du chapitre doit porter le même Ens/Mag.
  const mn = (ch11.get(cle(s.nom)).niveaux || '').match(/Ens\/Mag\s*(\d)/)
  if (mn && +mn[1] !== s.niveau) ecarts.push(`  ⚠ « ${s.nom} » : liste niveau ${s.niveau} vs chapitre Ens/Mag ${mn[1]} — À TRANCHER`)
}

// ── 6. Génération ────────────────────────────────────────────────────────────
const ech = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

// Normalisation d'AFFICHAGE seulement (le sens n'est pas touché) : le Manuel
// écrit « instantanée » en accord avec « Durée », le catalogue existant écrit
// « Instantané ». On s'aligne sur le catalogue, et on met une majuscule initiale
// partout, pour que le livre 📖 de la fiche présente une colonne homogène.
const norm = (v) => {
  if (!v || v === '?') return v
  const t = v.trim()
  if (/^instantanée?$/i.test(t)) return 'Instantané'
  if (/^permanente?$/i.test(t)) return 'Permanente'
  if (/^concentration$/i.test(t)) return 'Concentration'
  return t.charAt(0).toUpperCase() + t.slice(1)
}
for (const s of aEcrire) { s.portee = norm(s.portee); s.duree = norm(s.duree) }
const lignes = []
let niveauCourant = -1
for (const s of aEcrire.sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom, 'fr'))) {
  if (s.niveau !== niveauCourant) {
    niveauCourant = s.niveau
    lignes.push(`\n  // ─── ENSORCELEUR / MAGICIEN, NIVEAU ${s.niveau} ───`)
  }
  // Deux sorts du Manuel sont réservés au MAGICIEN : leur ligne « Niveau » porte
  // « Mag N » et non « Ens/Mag N ». L'ensorceleur ne prépare pas ses sorts, ils
  // n'ont donc pas de sens pour lui. Ils ne reçoivent que le niveau Magicien.
  const ligneNiveaux = ch11.get(cle(s.nom)).niveaux || ''
  const magSeul = !/Ens\/Mag/.test(ligneNiveaux) && /\bMag\s*\d/.test(ligneNiveaux)
  const niveaux = magSeul
    ? `{ Magicien: ${s.niveau} }`
    : `{ Magicien: ${s.niveau}, Ensorceleur: ${s.niveau} }`
  // La liste résumée porte déjà la mention pour ces deux sorts : ne pas la doubler.
  if (magSeul && !/Magiciens uniquement/i.test(s.description)) s.description += ' Magiciens uniquement.'
  lignes.push(`  { nom: '${ech(s.nom)}', ecole: '${ech(s.ecoleFinale)}', niveaux: ${niveaux}, composantes: '${ech(s.composantes)}', portee: '${ech(s.portee)}', duree: '${ech(s.duree)}', description: '${ech(s.description)}' },`)
}

// Champs restés « ? » : le Manuel n'imprime, dans un bloc de renvoi, que les
// lignes qui changent. Il faut les hériter du sort de référence.
const troues = aEcrire.filter(s => [s.composantes, s.portee, s.duree].includes('?'))
if (troues.length) {
  console.log(`\nCHAMPS « ? » À COMPLÉTER PAR HÉRITAGE — ${troues.length} sorts :`)
  for (const s of troues) {
    const q = []
    if (s.composantes === '?') q.push('composantes')
    if (s.portee === '?') q.push('portée')
    if (s.duree === '?') q.push('durée')
    console.log(`  niv.${s.niveau}  ${s.nom.padEnd(38)} ${q.join(', ')}`)
  }
}

console.log(`\nÀ écrire : ${aEcrire.length} sorts (niveaux ${NIV_MIN} à ${NIV_MAX}).`)
if (ecarts.length) console.log(`\nÉCARTS entre les deux lectures :\n${ecarts.join('\n')}`)
if (sansDonnees.length) {
  console.log(`\nDONNÉES DU CHAPITRE MANQUANTES — ${sansDonnees.length} sorts, NON écrits :`)
  for (const s of sansDonnees) console.log(`  niv.${s.niveau}  ${s.nom}`)
}

// ── 7. Écriture du fichier source ────────────────────────────────────────────
const couverts = [...new Set(aEcrire.map(s => s.niveau))].sort((a, b) => a - b)
const restants = [...new Set(releve.map(s => s.niveau))].sort((a, b) => a - b).filter(n => !couverts.includes(n))

const entete = `import type { SortDnD } from './spells'

// ─────────────────────────────────────────────────────────────────────────────
// Sorts d'ensorceleur/magicien du Manuel des Joueurs 3.5 (édition française)
//
// En 3.5, le magicien et l'ensorceleur partagent UNE SEULE liste — la « liste de
// sorts d'ensorceleur ou de magicien ». Chaque entrée porte donc les deux niveaux,
// toujours identiques.
//
// Relevés page par page dans le PDF du Manuel : la liste résumée (p. 185 à 189)
// pour les noms, les niveaux et la description d'une ligne, et le chapitre 11
// « Les sorts » (p. 196 à 303) pour l'école, les composantes, la portée et la
// durée. Le PDF n'a aucune couche texte : tout a été lu à l'image.
//
// Quand le résumé et le chapitre alphabétique divergent, c'est le chapitre qui
// fait foi — même choix que pour la liste de prêtre (voir spells-pretre.ts).
//
// La liste du Manuel compte ${releve.length} sorts. Ce fichier n'en contient qu'une partie :
// les sorts DÉJÀ présents dans SORTS_BASE (spells.ts), dans SORTS_PRETRE_MDJ ou
// dans SORTS_SUPPLEMENTS n'y sont PAS recopiés. SORTS_DND35 est une concaténation
// brute, sans déduplication, et le nom d'un sort sert de clé de jointure
// (spell-effects.ts, domains.ts, generator.ts, table \`spells\` en base) : une
// seconde entrée du même nom casserait ces liens. Ces sorts-là ont reçu leurs
// niveaux Magicien/Ensorceleur directement dans leur entrée d'origine.
//
// Deux lignes de la liste résumée couvrent chacune quatre sorts distincts
// (« Protection contre la Loi/le Bien/le Chaos/le Mal » et le « Cercle magique »
// correspondant) : elles sont développées en quatre entrées, conformément au
// chapitre 11 qui les décrit séparément.
//
// AVANCEMENT : niveaux ${couverts.join(', ')} relevés${restants.length ? ` ; niveaux ${restants.join(', ')} À FAIRE` : ' — liste complète, du niveau 0 au niveau 9'}.
// ─────────────────────────────────────────────────────────────────────────────

export const SORTS_MAGICIEN_MDJ: SortDnD[] = [
${lignes.join('\n').replace(/^\n/, '')}
]
`

writeFileSync(join(RACINE, 'spells-magicien.ts'), entete, 'utf8')
console.log(`\nspells-magicien.ts écrit : ${aEcrire.length} entrées, niveaux ${couverts.join(', ')}.`)

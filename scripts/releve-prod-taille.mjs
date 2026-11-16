/**
 * RELEVÉ EN PRODUCTION — tous les totaux affichés sur chaque fiche.
 *
 *   node scripts/releve-prod-taille.mjs avant
 *   node scripts/releve-prod-taille.mjs apres
 *   node scripts/releve-prod-taille.mjs --comparer
 *
 * Le modificateur de taille (demandé par André le 2026-11-16) touche la CA, les
 * jets d'attaque, la Discrétion et les seuils de charge. Ce qu'il faut prouver
 * n'est pas seulement que les 6 fiches de petite taille changent : c'est que
 * les 68 AUTRES ne changent pas d'un point.
 *
 * ⚠ Les totaux sont lus dans le payload RSC (`self.__next_f.push`), là où chaque
 * panneau `DetailBonus` transmet `{titre, base, total}`. C'est la MÊME donnée
 * que celle affichée — le composant la rend telle quelle — mais c'est bien le
 * payload : ne pas en conclure quoi que ce soit sur la mise en page. Pour le
 * rendu visible, voir `controle-prod-*.mjs`, qui le nettoie.
 *
 * ⭐ Instrument éprouvé : c'est ce relevé générique (et non une liste de motifs
 * choisis) qui a donné « 444 panneaux, 0 écart » les 12 et 15 novembre. Il voit
 * ce que je n'ai pas pensé à chercher.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const COOKIE = 'cormac_auth=granted'
const BASE = 'https://www.dracovick.com'
const fichier = e => path.join(RACINE, '.scratch', `prod-taille-${e}.json`)

const arg = process.argv[2] ?? 'releve'

if (arg === '--comparer') {
  const avant = JSON.parse(fs.readFileSync(fichier('avant'), 'utf8'))
  const apres = JSON.parse(fs.readFileSync(fichier('apres'), 'utf8'))

  const ids = [...new Set([...Object.keys(avant), ...Object.keys(apres)])]
    .map(Number).sort((a, b) => a - b)

  let bougent = 0, stables = 0, panneaux = 0
  const lignes = []
  for (const id of ids) {
    const a = avant[id], b = apres[id]
    if (!a || !b) { lignes.push(`[${id}] ⛔ présent d'un seul côté`); bougent++; continue }
    const cles = [...new Set([...Object.keys(a.totaux), ...Object.keys(b.totaux)])]
    const ecarts = cles.filter(k => a.totaux[k] !== b.totaux[k])
    panneaux += cles.length
    if (ecarts.length === 0) { stables++; continue }
    bougent++
    lignes.push(`[${id}] ${a.nom}`)
    for (const k of ecarts) lignes.push(`      ${k} : ${a.totaux[k]} → ${b.totaux[k]}`)
  }
  console.log(`${ids.length} fiche(s) · ${panneaux} panneau(x) comparé(s)`)
  console.log(`${stables} fiche(s) INCHANGÉE(S) · ${bougent} qui bougent\n`)
  for (const l of lignes) console.log(l)
  process.exit(0)
}

// ─── Le relevé ───────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(RACINE, '.scratch'), { recursive: true })
const resultat = {}

// On balaie large et on ignore les 404 : 74 fiches, mais les id ne sont pas
// contigus (des fiches ont été supprimées).
for (let id = 1; id <= 110; id++) {
  const r = await fetch(`${BASE}/personnage/${id}`, { headers: { Cookie: COOKIE }, redirect: 'follow' })
  if (!r.ok) continue
  const html = await r.text()

  // ⭐ Témoin de l'instrument : la page doit porter le mot « Classe d'armure ».
  // Sans lui, un relevé vide serait pris pour « aucun total » au lieu de
  // « je n'ai pas lu la bonne chose ».
  if (!html.includes("Classe d'armure") && !html.includes('Classe d\\u0027armure')) continue

  const nom = (/"nom":"([^"]{1,80})"/.exec(html) ?? [, `fiche ${id}`])[1]

  // Chaque panneau : {"titre":"…","base":N,"total":N} ou {"titre":"…","total":"+5"}
  const totaux = {}
  for (const m of html.matchAll(/\\"titre\\":\\"((?:[^"\\]|\\.){1,60}?)\\"[^}]{0,80}?\\"total\\":(?:\\")?([+-]?\d+)/g)) {
    const titre = m[1].replace(/\\u0027/g, "'").replace(/\\\\/g, '')
    // Un même titre peut revenir (deux compétences homonymes) : on numérote.
    let cle = titre, n = 2
    while (cle in totaux) cle = `${titre} #${n++}`
    totaux[cle] = Number(m[2])
  }

  // Les séquences d'attaque des lignes d'armes : « +7 / +2 ».
  const sequences = [...html.matchAll(/\\"sequence\\":\\"([^"\\]{1,30})\\"/g)].map(m => m[1])

  resultat[id] = { nom, totaux, sequences }
}

fs.writeFileSync(fichier(arg), JSON.stringify(resultat, null, 1), 'utf8')
const nbFiches = Object.keys(resultat).length
const nbTotaux = Object.values(resultat).reduce((s, f) => s + Object.keys(f.totaux).length, 0)
console.log(`${nbFiches} fiche(s), ${nbTotaux} total(aux) relevé(s) → ${fichier(arg)}`)
if (nbFiches === 0) {
  console.error('⛔ AUCUNE fiche relevée : l’instrument est en cause, pas la production.')
  process.exitCode = 1
}

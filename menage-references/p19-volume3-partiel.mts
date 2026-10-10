/**
 * La SECONDE COPIE DU VOLUME 3 — et les notes des cinq fiches du rayon.
 *
 * Mesuré le 2026-10-10, après qu'André a trouvé « tsr02157 - Encyclopedia
 * Magica Vol III.pdf » :
 *
 *   · sa couche texte est EXCELLENTE là où celle du volume 3 d'origine est
 *     cassée (26 % de mots nets, « charges » introuvable sur 417 pages) ;
 *   · mais elle est TRONQUÉE : 140 pages au lieu de 417. Sa table des matières
 *     annonce P p.835, Q p.923, R p.931, S p.1049 ; le fichier s'arrête au
 *     milieu des Ring. Toute la section S manque, et la fin de R aussi.
 *
 * ⛔ Donc on ne remplace PAS : remplacer ferait perdre les deux tiers du volume.
 * Les deux copies coexistent, chacune pour ce qu'elle sait faire — la complète
 * pour lire, la partielle pour chercher — et chaque fiche renvoie à l'autre.
 *
 * 🎯 C'est cette copie qui contient le carquois de Cormac, et son texte confirme
 * au mot près ce qu'André a dicté : « Quiver of Arrow Storing · XP Value: 1,000 ·
 * GP Value: 4,000 · DRAGON Magazine 133 · This quiver appears to be a normal
 * quiver, although it has magical properties much like a bag of holding. Up to
 * 200 arrows can be held in… »
 *
 * Usage : ./node_modules/.bin/tsx menage-references/p19-volume3-partiel.mts [--ecrire]
 */
import { put } from '@vercel/blob'
import { neon } from '@neondatabase/serverless'
import { readFileSync, statSync } from 'fs'
import { resolve } from 'path'
import { execFileSync } from 'child_process'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (!k?.trim() || k.startsWith('#')) continue
  process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL!)
const ECRIRE = process.argv.includes('--ecrire')

const FICHIER = 'Livres de jeu en PDF/tsr02157 - Encyclopedia Magica Vol III.pdf'
const SLUG = 'encyclopedia-magica-3-partiel'

function pages(chemin: string): number {
  const out = execFileSync('pdfinfo', [chemin], { encoding: 'latin1' })
  return Number(out.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0)
}

/** Échantillon PROPORTIONNEL : 10 pages réparties, quel que soit le nombre de
 *  pages. L'échantillon fixe 20..380 ne lisait que 4 pages d'un livre de 140,
 *  et aurait rendu un taux calculé sur moins de données que pour les autres. */
function qualiteRecherche(chemin: string, n: number): { taux: number; verdict: string } {
  let alpha = 0
  let nets = 0
  for (let i = 1; i <= 10; i++) {
    const p = Math.max(1, Math.round((n * i) / 11))
    let t = ''
    try {
      t = execFileSync('pdftotext', ['-f', String(p), '-l', String(p), chemin, '-'], {
        encoding: 'utf-8', maxBuffer: 8 * 1024 * 1024,
      })
    } catch { continue }
    for (const tok of t.split(/\s+/)) {
      if (!/[A-Za-z]/.test(tok)) continue
      alpha++
      if (/^[A-Za-z]{3,}[.,;:!?)"']?$/.test(tok)) nets++
    }
  }
  const taux = alpha ? Math.round((100 * nets) / alpha) : 0
  return { taux, verdict: taux >= 60 ? 'fiable' : taux >= 45 ? 'partielle' : 'inutilisable' }
}

const chemin = resolve(process.cwd(), FICHIER)
const taille = statSync(chemin).size
const n = pages(chemin)
const q = qualiteRecherche(chemin, n)

console.log(`── ${FICHIER}`)
console.log(`   ${(taille / 1024 / 1024).toFixed(1)} Mo · ${n} pages · couche texte ${q.taux} % → recherche ${q.verdict}`)

const NOTE_PARTIEL = `⚠️ **Cette copie est incomplète.** Elle ne contient que **${n} pages sur les 417** du volume : sa table des matières annonce les entrées **P** (page 835), **Q** (923), **R** (931) et **S** (1049), mais le fichier s'arrête au milieu des *Ring*. **Toute la section S manque**, et la fin des R aussi.

**Pourquoi elle est là quand même** : sa reconnaissance de caractères est bonne, là où celle du volume 3 complet est cassée. C'est donc la seule copie du volume 3 dans laquelle la **recherche** fonctionne — pour les entrées P, Q et le début des R.

**Pour lire le volume 3 en entier**, prenez *Encyclopedia Magica — Volume 3* : il a ses 417 pages, et ses images de pages sont nettes. Seule sa recherche est hors d'usage.

🎯 C'est dans cette copie que se trouve le **Quiver of Arrow Storing** — le carquois de Cormac (*Dragon Magazine* 133, 4 000 po, 1 000 XP).`

const NOTE_COMPLET = `✅ **Volume complet** : 417 pages, les entrées *Pick of Earth Parting* à *Thesis on Conditional Ruptures*.

⚠️ **Mais sa reconnaissance de caractères est cassée** — 26 % de mots nets contre 75 % pour les volumes 1 et 2. Mesure faite en cherchant des mots qui **doivent** y être : « charges » donne **zéro** résultat sur 417 pages, et « value » seulement 10, alors que chaque entrée de l'encyclopédie en porte une. Son texte reconnu ressemble à ceci : *« intu the .uid and fo= I.,..,. If. [H>I'MhI~ »*.

**Les images des pages, elles, sont nettes** : ce volume se lit et se feuillette normalement. C'est uniquement la recherche qui est hors d'usage.

**Pour chercher dans les entrées P, Q et le début des R**, prenez la *copie partielle (P–R)* : son texte est propre, mais elle n'a que 140 pages.`

const NOTES: Record<string, string> = {
  'encyclopedia-magica-1': `Les entrées **A** à **D**, 417 pages. Reconnaissance de caractères **bonne** (75 % de mots nets) : la recherche y est fiable.`,
  'encyclopedia-magica-2': `Les entrées **D** à **P**, 416 pages. Reconnaissance de caractères **bonne** (75 % de mots nets) : la recherche y est fiable.`,
  'encyclopedia-magica-3': NOTE_COMPLET,
  'encyclopedia-magica-4': `Les entrées **S** à **Z**, 418 pages. Reconnaissance de caractères **correcte** (66 % de mots nets) : la recherche y est fiable, avec quelques mots mal reconnus.`,
  [SLUG]: NOTE_PARTIEL,
}

if (!ECRIRE) {
  console.log('\n(blanc : relancer avec --ecrire)')
  process.exit(0)
}

const blob = await put(`livres/${SLUG}.pdf`, readFileSync(chemin), {
  access: 'public',
  contentType: 'application/pdf',
  allowOverwrite: true,
  addRandomSuffix: false,
})
console.log(`   ✓ téléversé → ${blob.url}`)

await sql`
  INSERT INTO game_books
    (slug, titre, volume, tranche, langue, pages, taille_octets, url,
     qualite_recherche, taux_ocr, collection, ordre)
  VALUES
    (${SLUG}, 'Encyclopedia Magica — Volume 3 (copie partielle, P–R)', 3,
     'P – R seulement', 'en', ${n}, ${taille}, ${blob.url},
     ${q.verdict}, ${q.taux}, 'encyclopedia-magica', 5)
  ON CONFLICT (slug) DO UPDATE SET
    titre = EXCLUDED.titre, volume = EXCLUDED.volume, tranche = EXCLUDED.tranche,
    pages = EXCLUDED.pages, taille_octets = EXCLUDED.taille_octets,
    url = EXCLUDED.url, qualite_recherche = EXCLUDED.qualite_recherche,
    taux_ocr = EXCLUDED.taux_ocr, collection = EXCLUDED.collection, ordre = EXCLUDED.ordre
`

// Les tranches des quatre volumes d'origine, lues dans leurs tables des matières
// plutôt que devinées : le volume 1 va de A à D, le 2 de D à P, le 3 de P à S,
// le 4 de S à Z.
const TRANCHES: Record<string, string> = {
  'encyclopedia-magica-1': 'A – D',
  'encyclopedia-magica-2': 'D – P',
  'encyclopedia-magica-3': 'P – S',
  'encyclopedia-magica-4': 'S – Z',
}
for (const [slug, note] of Object.entries(NOTES)) {
  const tranche = TRANCHES[slug]
  if (tranche) {
    await sql`UPDATE game_books SET note = ${note}, tranche = ${tranche} WHERE slug = ${slug}`
  } else {
    await sql`UPDATE game_books SET note = ${note} WHERE slug = ${slug}`
  }
}

const etat = (await sql`
  SELECT slug, titre, volume, tranche, pages, taille_octets, qualite_recherche,
         taux_ocr, collection, LENGTH(note) AS len_note
  FROM game_books ORDER BY ordre
`) as any[]
console.log('\n── Le rayon ──')
for (const r of etat) {
  console.log(
    `  ${r.slug.padEnd(30)} ${String(r.pages).padStart(3)} p · ` +
    `${(r.taille_octets / 1024 / 1024).toFixed(1).padStart(5)} Mo · ` +
    `recherche ${String(r.qualite_recherche).padEnd(13)} (${String(r.taux_ocr).padStart(2)} %) · ` +
    `${r.tranche} · note ${r.len_note} car.`,
  )
}

/**
 * Le VOLUME 3 RÉPARÉ remplace l'ancien, et la copie partielle quitte le rayon.
 *
 * Décision d'André, 2026-10-10 : « répare le bon volume 3 et enlève l'autre qui
 * est incomplet ». Le « bon » est le volume complet (417 pages) ; l'incomplet
 * est la copie « vol III » (140 pages, arrêtée au milieu des Ring).
 *
 * ── Pourquoi le volume 3 était cassé ───────────────────────────────────────
 * Ce n'est pas l'OCR qui avait raté, c'est le SCAN. Résolution des images
 * mesurée dans chaque fichier (pdfimages -list), et le taux de reconnaissance
 * la suit exactement :
 *
 *     volume 1 : 300 ppp → 75 %      volume 3 : 100 ppp → 26 %
 *     volume 2 : 300 ppp → 75 %      volume 4 : 150 ppp → 66 %
 *     copie partielle « vol III » : 300 ppp → 75 %
 *
 * À 100 ppp, le corps de texte de l'encyclopédie fait six pixels de haut :
 * Acrobat Paper Capture (2015) ne pouvait pas s'en sortir. Les IMAGES, elles,
 * restent lisibles — vérifié à l'œil sur un agrandissement de la page 100.
 *
 * ── Ce qu'on a refait ──────────────────────────────────────────────────────
 * Chaque page rendue en haute résolution et repassée à RapidOCR (PP-OCRv4,
 * ONNX — aucune installation sur le poste), puis :
 *   · l'ancienne couche texte RETIRÉE (sinon les deux se superposent et le
 *     copier-coller rend de la bouillie mêlée au texte neuf) ;
 *   · le texte neuf écrit en invisible, à la place et à la largeur mesurées sur
 *     l'image, pour que le surlignage de la recherche tombe sur le bon mot ;
 *   · les espaces manqués par le modèle rouverts d'après l'écart entre boîtes de
 *     caractères, seuil 0,25 × la hauteur de ligne — calibré contre un lexique
 *     tiré des volumes 1, 2 et de la copie partielle, pas choisi à l'œil.
 * Les images des pages ne sont pas touchées : on lit exactement le même scan.
 * Atelier : .scratch/draco-ocr-v3 (ocr-lot.py, couche-texte.py, calibre-seuil.py).
 *
 * Usage : ./node_modules/.bin/tsx menage-references/p20-volume3-repare.mts <pdf> [--ecrire]
 */
import { put, del } from '@vercel/blob'
import { neon } from '@neondatabase/serverless'
import { readFileSync, statSync } from 'fs'
import { resolve } from 'path'
import { execFileSync } from 'child_process'
import { createHash } from 'crypto'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (!k?.trim() || k.startsWith('#')) continue
  // ⚠ BLOB_READ_WRITE_TOKEN est ENTRE GUILLEMETS dans .env.local, contrairement
  // à DATABASE_URL : les laisser fait répondre « Access denied ».
  process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL!)
const ECRIRE = process.argv.includes('--ecrire')
const FICHIER = process.argv[2]
if (!FICHIER || FICHIER.startsWith('--')) {
  console.error('usage : p20-volume3-repare.mts <pdf réparé> [--ecrire]')
  process.exit(1)
}

const SLUG = 'encyclopedia-magica-3'
const SLUG_PARTIEL = 'encyclopedia-magica-3-partiel'

function pages(chemin: string): number {
  const out = execFileSync('pdfinfo', [chemin], { encoding: 'latin1' })
  return Number(out.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0)
}

/** Même instrument que p19 : dix pages réparties proportionnellement, part des
 *  tokens alphabétiques qui sont des mots nets de 3 lettres ou plus. Changer la
 *  mesure en même temps que le fichier rendrait l'avant/après incomparable. */
function qualiteRecherche(chemin: string, n: number): { taux: number; verdict: string } {
  let alpha = 0
  let nets = 0
  for (let i = 1; i <= 10; i++) {
    const p = Math.max(1, Math.round((n * i) / 11))
    let t = ''
    try {
      t = execFileSync('pdftotext', ['-f', String(p), '-l', String(p), chemin, '-'], {
        encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024,
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

/** L'épreuve qui compte : des mots qui DOIVENT être là, cherchés dans le volume
 *  entier. Un taux ne dit pas si la recherche trouvera ; ceci le dit. */
function temoins(chemin: string): Record<string, number> {
  const tout = execFileSync('pdftotext', [chemin, '-'], {
    encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024,
  }).toLowerCase()
  const r: Record<string, number> = {}
  for (const mot of ['charges', 'value', 'quiver', 'arrow storing', 'ring', 'potion', 'magic']) {
    r[mot] = tout.split(mot).length - 1
  }
  return r
}

const chemin = resolve(process.cwd(), FICHIER)
const taille = statSync(chemin).size
const n = pages(chemin)
const q = qualiteRecherche(chemin, n)
const t = temoins(chemin)

console.log(`── ${FICHIER}`)
console.log(`   ${(taille / 1024 / 1024).toFixed(1)} Mo · ${n} pages · couche texte ${q.taux} % → recherche ${q.verdict}`)
console.log(`   témoins : ${Object.entries(t).map(([m, c]) => `${m} ${c}×`).join(', ')}`)

const manquants = Object.entries(t).filter(([, c]) => c === 0).map(([m]) => m)
if (manquants.length) {
  console.error(`⛔ témoins introuvables : ${manquants.join(', ')} — on ne remplace pas`)
  process.exit(1)
}
if (n !== 417) {
  console.error(`⛔ ${n} pages au lieu de 417 — le fichier réparé n'est pas complet, on ne remplace pas`)
  process.exit(1)
}

const NOTE = `✅ **Volume complet** : 417 pages, les entrées *Pick of Earth Parting* à *Thesis on Conditional Ruptures*.

🔧 **Sa reconnaissance de caractères a été refaite le 10 octobre 2026.** Elle était cassée — 26 % de mots nets, « charges » introuvable sur 417 pages — parce que ce volume a été **numérisé à 100 ppp**, trois fois moins finement que les volumes 1 et 2, puis déchiffré par un moteur de 2015. Les pages ont été repassées à un moteur moderne : la recherche y est désormais **${q.verdict}** (${q.taux} % de mots nets).

**Les images des pages n'ont pas changé** : c'est le même scan, seule la couche de texte invisible qui sert à la recherche a été remplacée.

⚠️ Le scan d'origine reste moins fin que celui des volumes 1 et 2 : quelques mots restent mal lus. Si une recherche ne rend rien, essayez un mot plus court ou une autre orthographe avant de conclure que l'objet n'est pas dans le livre.

🎯 C'est dans ce volume que se trouve le **Quiver of Arrow Storing** — le carquois de Cormac (*Dragon Magazine* 133, 4 000 po, 1 000 XP), à l'entrée *Quiver*.`

if (!ECRIRE) {
  console.log('\n(blanc : relancer avec --ecrire)')
  process.exit(0)
}

const octets = readFileSync(chemin)
const version = createHash('sha256').update(octets).digest('hex').slice(0, 12)
const blob = await put(`livres/${SLUG}.pdf`, octets, {
  access: 'public',
  contentType: 'application/pdf',
  allowOverwrite: true,
  addRandomSuffix: false,
})
console.log(`   ✓ téléversé → ${blob.url}  (version ${version})`)

await sql`
  UPDATE game_books SET
    pages = ${n}, taille_octets = ${taille}, url = ${blob.url},
    qualite_recherche = ${q.verdict}, taux_ocr = ${q.taux},
    version = ${version}, note = ${NOTE}
  WHERE slug = ${SLUG}
`
console.log('   ✓ fiche du volume 3 mise à jour')

// ── La copie partielle quitte le rayon ────────────────────────────────────
// Le fichier source reste sur X: (« tsr02157 - Encyclopedia Magica Vol III.pdf ») :
// la remettre est une commande, pas une récupération.
const [partiel] = (await sql`SELECT url FROM game_books WHERE slug = ${SLUG_PARTIEL}`) as any[]
if (partiel) {
  await sql`DELETE FROM game_books WHERE slug = ${SLUG_PARTIEL}`
  console.log('   ✓ fiche de la copie partielle retirée')
  try {
    await del(partiel.url)
    console.log('   ✓ son PDF retiré du stockage')
  } catch (e) {
    console.error('   ⚠ PDF non retiré du stockage :', (e as Error).message)
  }
} else {
  console.log('   (pas de copie partielle en base)')
}

const etat = (await sql`
  SELECT slug, titre, pages, taille_octets, qualite_recherche, taux_ocr, version,
         LENGTH(note) AS len_note
  FROM game_books ORDER BY ordre
`) as any[]
console.log('\n── Le rayon ──')
for (const r of etat) {
  console.log(
    `  ${r.slug.padEnd(26)} ${String(r.pages).padStart(3)} p · ` +
    `${(r.taille_octets / 1024 / 1024).toFixed(1).padStart(5)} Mo · ` +
    `recherche ${String(r.qualite_recherche).padEnd(12)} (${String(r.taux_ocr).padStart(2)} %) · ` +
    `v${r.version} · note ${r.len_note} car.`,
  )
}

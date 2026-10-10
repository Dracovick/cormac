/**
 * TÉLÉVERSE les 4 volumes de l'Encyclopedia Magica vers Vercel Blob.
 *
 * Pourquoi pas `public/` : les quatre fichiers pèsent 180 Mo ensemble, très
 * au-delà de ce qu'un déploiement Vercel accepte d'embarquer. Le Blob est déjà
 * utilisé par le Grimoire pour les portraits et les photos de partie.
 *
 * ⚠ REJOUABLE ET REMPLAÇABLE, et ça compte : le volume 3 a un OCR cassé (26 %
 * de mots nets, cf. p19-ocr-encyclopedia) et André cherche une meilleure copie.
 * Relancer le script avec un fichier remplacé réécrit le blob au MÊME chemin
 * (`allowOverwrite`) et met à jour la taille, le nombre de pages et la qualité
 * de recherche en base. Rien d'autre à toucher.
 *
 * Usage : ./node_modules/.bin/tsx menage-references/p19-televerser-encyclopedia.mts [--ecrire] [--volume N]
 */
import { put } from '@vercel/blob'
import { neon } from '@neondatabase/serverless'
import { readFileSync, statSync } from 'fs'
import { resolve } from 'path'
import { execFileSync } from 'child_process'
import { createHash } from 'crypto'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (!k?.trim() || k.startsWith('#')) continue
  // ⚠ BLOB_READ_WRITE_TOKEN est ENTRE GUILLEMETS dans .env.local, contrairement
  // à DATABASE_URL. Les laisser fait répondre au Blob « Access denied, please
  // provide a valid token » — un refus qui accuse le jeton, pas sa mise en forme.
  process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL!)
const ECRIRE = process.argv.includes('--ecrire')
const SEUL = process.argv.includes('--volume')
  ? Number(process.argv[process.argv.indexOf('--volume') + 1])
  : null

const DOSSIER = 'Livres de jeu en PDF'

/** Les quatre volumes, dans l'ordre de la collection. */
const VOLUMES = [
  {
    slug: 'encyclopedia-magica-1', volume: 1,
    fichier: 'Encyclopedia Magica Volume 1.pdf',
    titre: 'Encyclopedia Magica — Volume 1',
    tranche: 'A – D',
  },
  {
    slug: 'encyclopedia-magica-2', volume: 2,
    fichier: 'Encyclopedia Magica Volume 2 D-P.pdf',
    titre: 'Encyclopedia Magica — Volume 2',
    tranche: 'D – P',
  },
  {
    slug: 'encyclopedia-magica-3', volume: 3,
    fichier: 'Encyclopedia Magica Volume 3.pdf',
    titre: 'Encyclopedia Magica — Volume 3',
    tranche: 'P – S',
  },
  {
    slug: 'encyclopedia-magica-4', volume: 4,
    fichier: 'Encyclopedia Magica Volume 4.pdf',
    titre: 'Encyclopedia Magica — Volume 4',
    tranche: 'S – Z',
  },
]

/** Nombre de pages, lu dans le fichier — jamais supposé. */
function pages(chemin: string): number | null {
  try {
    const out = execFileSync('pdfinfo', [chemin], { encoding: 'latin1' })
    const m = out.match(/^Pages:\s+(\d+)/m)
    return m ? Number(m[1]) : null
  } catch {
    return null
  }
}

/**
 * Qualité de la couche texte, donc de la recherche : part des tokens contenant
 * une lettre qui sont des mots alphabétiques de 3 lettres ou plus, sur dix pages
 * réparties. Même mesure que p19-ocr-encyclopedia.py, pour que le chiffre affiché
 * au lecteur vienne du fichier réellement téléversé.
 */
function qualiteRecherche(chemin: string): { taux: number; verdict: string } {
  let alpha = 0
  let nets = 0
  for (const p of [20, 60, 100, 140, 180, 220, 260, 300, 340, 380]) {
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

for (const v of VOLUMES) {
  if (SEUL !== null && v.volume !== SEUL) continue
  const chemin = resolve(process.cwd(), DOSSIER, v.fichier)
  let taille: number
  try {
    taille = statSync(chemin).size
  } catch {
    console.error(`⛔ ${v.fichier} introuvable — volume ${v.volume} ignoré`)
    continue
  }
  const n = pages(chemin)
  const q = qualiteRecherche(chemin)
  console.log(
    `\n── ${v.titre} (${v.tranche})\n   ${v.fichier}` +
    `\n   ${(taille / 1024 / 1024).toFixed(1)} Mo · ${n ?? '?'} pages` +
    `\n   couche texte ${q.taux} % → recherche ${q.verdict}`,
  )

  if (!ECRIRE) {
    console.log('   (blanc : relancer avec --ecrire)')
    continue
  }

  const octets = readFileSync(chemin)
  // Empreinte du contenu : elle sert de « ?v= » aux liens du lecteur. Sans elle,
  // remplacer un volume resterait invisible jusqu'à 30 jours (le Blob met en
  // cache et le retéléversement écrit au même chemin).
  const version = createHash('sha256').update(octets).digest('hex').slice(0, 12)
  const blob = await put(`livres/${v.slug}.pdf`, octets, {
    access: 'public',
    contentType: 'application/pdf',
    allowOverwrite: true,
    addRandomSuffix: false,
  })
  console.log(`   ✓ téléversé → ${blob.url}  (version ${version})`)

  await sql`
    INSERT INTO game_books
      (slug, titre, volume, tranche, langue, pages, taille_octets, url,
       qualite_recherche, taux_ocr, collection, version, ordre)
    VALUES
      (${v.slug}, ${v.titre}, ${v.volume}, ${v.tranche}, 'en', ${n}, ${taille},
       ${blob.url}, ${q.verdict}, ${q.taux}, 'encyclopedia-magica', ${version}, ${v.volume})
    ON CONFLICT (slug) DO UPDATE SET
      titre = EXCLUDED.titre, volume = EXCLUDED.volume, tranche = EXCLUDED.tranche,
      pages = EXCLUDED.pages, taille_octets = EXCLUDED.taille_octets,
      url = EXCLUDED.url, qualite_recherche = EXCLUDED.qualite_recherche,
      taux_ocr = EXCLUDED.taux_ocr, collection = EXCLUDED.collection,
      version = EXCLUDED.version, ordre = EXCLUDED.ordre
  `
  console.log('   ✓ fiche en base')
}

if (ECRIRE) {
  const etat = (await sql`
    SELECT slug, volume, pages, taille_octets, qualite_recherche, taux_ocr, LEFT(url, 60) AS url
    FROM game_books ORDER BY ordre
  `) as any[]
  console.log('\n── État du rayon ──')
  for (const r of etat) {
    console.log(
      `  v${r.volume} ${r.slug} · ${r.pages} p · ${(r.taille_octets / 1024 / 1024).toFixed(1)} Mo` +
      ` · recherche ${r.qualite_recherche} (${r.taux_ocr} %) · ${r.url}…`,
    )
  }
}

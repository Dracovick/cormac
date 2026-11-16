/* CONTRÔLES EN PRODUCTION — la page d'histoire, telle que servie à André.
 *
 *   node scripts/controle-prod-histoire.mjs
 *
 * ⚠ `-L` implicite : www.dracovick.com répond 308 vers www. Le cookie de session
 * est en clair dans src/app/actions/auth.ts — une page protégée non authentifiée
 * rendrait la page de connexion avec un 200, donc un contrôle qui ne regarde que
 * le code HTTP passerait au vert sur l'écran de login.
 * ⭐ D'où le témoin négatif : un motif qui NE DOIT PAS être trouvé.
 */
const BASE = 'https://www.dracovick.com'
const COOKIE = 'cormac_auth=granted'

let ok = 0
const echecs = []
function verifier(titre, condition, detail = '') {
  if (condition) ok++
  else echecs.push(`${titre}${detail ? ` — ${detail}` : ''}`)
}

/**
 * ⛔⛔ DEUX pièges qui ont fait rougir quatre contrôles justes, le 2026-11-15.
 *
 * 1. Le HTML d'une page Next porte DEUX FOIS le contenu : le rendu visible, et
 *    le payload RSC (`self.__next_f.push`) qui transmet les props brutes au
 *    composant client. Chercher `**Fonteclaire**` dans le HTML entier le trouve
 *    donc TOUJOURS — dans les données, pas dans l'affichage — et un contrôle
 *    « le gras est interprété » échoue alors que la page est juste.
 * 2. React insère un `<!-- -->` entre deux text nodes adjacents en SSR :
 *    `{n} chapitre{s}` sort en `7<!-- --> chapitre<!-- -->s`. Une chaîne
 *    littérale comme « 7 chapitres » ne s'y retrouve jamais.
 * 3. React échappe l'apostrophe DROITE en `&#x27;` dans le texte rendu :
 *    « Tolliver l'Aller-simple » sort en « Tolliver l&#x27;Aller-simple ».
 *    Deux titres sur sept ont échoué là-dessus, et eux seuls — les cinq autres
 *    n'ont pas d'apostrophe. Mesuré en prod avant de toucher à quoi que ce soit.
 *
 * `page()` rend donc le HTML nettoyé des trois. C'est le rendu, et seulement lui.
 * ⛔ Les chevrons `&lt;` `&gt;` ne sont PAS décodés, délibérément : c'est la
 * seule différence qui reste entre du HTML rendu et du texte échappé, et un
 * contrôle d'injection en aurait besoin.
 */
function visible(html) {
  return html
    .replace(/<script>self\.__next_f\.push\(\[[\s\S]*?\]\)<\/script>/g, '')
    .replace(/<!-- -->/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

async function page(chemin) {
  const r = await fetch(BASE + chemin, { headers: { Cookie: COOKIE }, redirect: 'follow' })
  const brut = await r.text()
  return { statut: r.status, html: visible(brut), brut }
}

// ─── 0. Le nettoyeur lui-même ────────────────────────────────────────────────
// ⛔ `visible()` RETIRE du HTML. S'il en retirait trop — ou tout —, chaque
// contrôle de la forme « ne contient PAS » passerait au vert sur du vide. Les
// deux contrôles qui suivent gardent cette porte-là fermée.
const brutAza = await (await fetch(BASE + '/personnage/98/histoire', { headers: { Cookie: COOKIE } })).text()
const netAza = visible(brutAza)
verifier('témoin de présence : le HTML nettoyé garde l’essentiel du document',
  netAza.length > brutAza.length * 0.3 && netAza.length > 20_000,
  `${brutAza.length} octets bruts → ${netAza.length} nettoyés`)
verifier('témoin de présence : le nettoyage conserve bien le rendu',
  netAza.includes('<strong') && netAza.includes('Azadrielle'))

// ─── 1. La page d'histoire d'Azadrielle ──────────────────────────────────────
const aza = await page('/personnage/98/histoire')
verifier('/personnage/98/histoire répond 200', aza.statut === 200, `statut ${aza.statut}`)
verifier('⭐ témoin négatif : ce n’est PAS l’écran de connexion',
  !aza.html.includes('name="password"') && !aza.html.includes('Mot de passe'))
verifier('le bandeau porte son nom', aza.html.includes('Azadrielle Pétales de Lune'))
verifier('le bandeau porte son surnom', aza.html.includes('La Créatrice'))

const TITRES = [
  'Fonteclaire, et le pays qui ne retient personne',
  'Le clan Pétales de Lune, et Tolliver l’Aller-simple',
  'Trente-huit ans, quatre-vingt-quatorze centimètres',
  'Les autres plans, et Sel',
  'Pourquoi le village la bénit au lieu de la surveiller',
  'Bram et Aza — six ans d’écart et la même fenêtre',
  'Duncan — comment ils se sont rencontrés',
]
// ⚠ La base porte l'apostrophe DROITE, et `visible()` a redonné sa forme droite
// à l'entité `&#x27;` du HTML : on compare donc les deux formes, sans supposer
// laquelle a survécu au trajet.
for (const t of TITRES) {
  const droite = t.replace(/’/g, "'")
  verifier(`titre servi : « ${droite} »`, aza.html.includes(t) || aza.html.includes(droite))
}

verifier('le sommaire est dressé (7 chapitres > 1)', aza.html.includes('Sommaire'))
verifier('les ancres de chapitre existent', /id="chapitre-\d+"/.test(aza.html))
verifier('le compte de mots est affiché', aza.html.includes('mots'))

// La mise en forme doit avoir été INTERPRÉTÉE, pas servie telle quelle.
verifier('⭐ le gras est rendu en <strong>, pas en astérisques',
  aza.html.includes('<strong') && !aza.html.includes('**Fonteclaire**'))
verifier('⭐ les intertitres sont rendus en <h3>, pas en dièses',
  aza.html.includes('<h3') && !aza.html.includes('### Un pays'))
verifier('⭐ les répliques sont rendues en <blockquote>', aza.html.includes('<blockquote'))
verifier('⭐ les listes sont rendues en <ul>', aza.html.includes('<ul'))
verifier('le texte du récit est bien là (phrase témoin)',
  aza.html.includes('on ne demande à personne de rester'))
verifier('la signature est affichée', aza.html.includes('Dracovick'))

// ─── 2. Le PDF de l'histoire ─────────────────────────────────────────────────
const pdf = await page('/personnage/98/histoire/imprimer')
verifier('/personnage/98/histoire/imprimer répond 200', pdf.statut === 200, `statut ${pdf.statut}`)
verifier('la page papier porte le titre du personnage', pdf.html.includes('Azadrielle'))
verifier('la page papier numérote les chapitres', pdf.html.includes('7. '))
verifier('la page papier porte le bouton PDF', pdf.html.includes('Sauvegarder en PDF'))
verifier('⭐ la page papier dit qu’elle est distincte de la feuille de personnage',
  pdf.html.includes('Document distinct de la feuille de personnage'))
verifier('⭐ le gras n’est PAS doré sur le papier (illisible sur blanc)',
  !pdf.html.includes('text-amber-200'))

// ─── 3. Le lien depuis la fiche ──────────────────────────────────────────────
const fiche = await page('/personnage/98')
verifier('/personnage/98 répond toujours 200', fiche.statut === 200, `statut ${fiche.statut}`)
verifier('la fiche porte le lien vers l’histoire', fiche.html.includes('/personnage/98/histoire'))
verifier('la fiche annonce 7 chapitres', fiche.html.includes('7 chapitres'))
verifier('⭐ la section Historique s’affiche MALGRÉ un champ historique vide',
  fiche.html.includes('Lire l’histoire'))
// ⭐ L'élision : « d'Azadrielle », pas « de Azadrielle ». Relevé en prod le
// 2026-11-15 sur le rendu lui-même, pas deviné.
verifier('⭐ le nom est élidé : « d’Azadrielle »',
  fiche.html.includes('Lire l’histoire d’Azadrielle Pétales de Lune'),
  'rendu : ' + (/Lire l’histoire [^<]{0,40}/.exec(fiche.html)?.[0] ?? 'introuvable'))

// ─── 4. Une fiche SANS histoire — le cas des 73 autres ───────────────────────
const bram = await page('/personnage/99')
verifier('/personnage/99 (Bram, sans histoire) répond 200', bram.statut === 200, `statut ${bram.statut}`)
verifier('⭐ témoin inverse : Bram n’annonce aucun chapitre',
  !/Lire l[’']histoire de Bram/.test(bram.html))
const bramHist = await page('/personnage/99/histoire')
verifier('l’histoire vide de Bram répond quand même 200', bramHist.statut === 200, `statut ${bramHist.statut}`)
verifier('elle invite à écrire', bramHist.html.includes('n’est pas encore écrite'))
verifier('⭐ et Bram n’est PAS élidé : « de Bram »', bramHist.html.includes('L’histoire de Bram Verrelune'))

// ─── 5. Les pages d'aide ─────────────────────────────────────────────────────
const aide = await page('/aide/joueur')
verifier('/aide/joueur répond 200', aide.statut === 200, `statut ${aide.statut}`)
verifier('l’aide joueur documente l’histoire', aide.html.includes('Histoire du personnage'))
verifier('l’aide joueur explique la mise en forme', aide.html.includes('### Titre'))
verifier('l’aide joueur distingue les trois usages', aide.html.includes('Trois endroits, trois usages'))

const aideCrea = await page('/aide/creation')
verifier('/aide/creation répond 200', aideCrea.statut === 200, `statut ${aideCrea.statut}`)
verifier('l’aide création renvoie vers la page d’histoire',
  aideCrea.html.includes('/personnage/&lt;numéro&gt;/histoire') || aideCrea.html.includes('hors du formulaire'))

// ─── 6. Le mauvais identifiant ───────────────────────────────────────────────
const absent = await page('/personnage/999999/histoire')
verifier('un personnage inexistant rend 404', absent.statut === 404, `statut ${absent.statut}`)
const texte = await page('/personnage/abc/histoire')
verifier('⭐ un segment non numérique rend 404, PAS 500', texte.statut === 404, `statut ${texte.statut}`)

// ─── Verdict ─────────────────────────────────────────────────────────────────
console.log(`\n${ok} contrôle(s) réussi(s) en production, ${echecs.length} échec(s).`)
if (echecs.length) {
  console.log('\nÉCHECS :')
  for (const e of echecs) console.log(`  ⛔ ${e}`)
  process.exitCode = 1
}

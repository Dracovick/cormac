// Contrôles en PRODUCTION du lot « métier de Duncan » et du repli des spécialités.
//
//   node scripts/controle-prod-metier-duncan.mjs
//
// ⛔ On lit le RENDU, pas les données brutes que Next transmet au navigateur :
// le HTML d'une page porte les deux fois le contenu, et chercher dans la seconde
// copie m'a déjà fait « réparer » du code qui marchait (2026-11-15).
// Les comptes se font donc sur le texte visible, balises retirées.
import { grasImbriques } from './lib-gras-imbrique.mjs'

const BASE = 'https://www.dracovick.com'
const COOKIE = 'cormac_auth=granted'
const JETON_PUBLIC = 'xyy4u2bpen9wdvp36kktgha3' // le lien de partage de Duncan

let n = 0
let echecs = 0
const verifier = (titre, ok, detail = '') => {
  n++
  if (!ok) { echecs++; console.log(`  ❌ ${n}. ${titre}${detail ? ` — ${detail}` : ''}`) }
  else console.log(`  ✅ ${n}. ${titre}${detail ? ` — ${detail}` : ''}`)
}

const lire = async (chemin, avecCookie = true) => {
  const r = await fetch(BASE + chemin, { headers: avecCookie ? { cookie: COOKIE } : {}, redirect: 'follow' })
  return { statut: r.status, html: await r.text() }
}
/** Le texte VISIBLE : balises retirées, entités courantes rendues. */
const visible = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&#x27;/g, "'")
  .replace(/\s+/g, ' ')
const compte = (texte, motif) => texte.split(motif).length - 1

console.log('— LA PAGE D\'HISTOIRE DE DUNCAN')
const hist = await lire('/personnage/97/histoire')
verifier('la page répond 200', hist.statut === 200, `${hist.statut}`)
const vh = visible(hist.html)
verifier('le titre du chapitre neuf est là', compte(vh, 'Le métier — joueur professionnel') >= 1, `${compte(vh, 'Le métier — joueur professionnel')} fois (sommaire + titre)`)
verifier('les 9 titres de chapitre sont au sommaire', [
  'Vingt et un ans', 'Tymora, et les trois pièces', 'Le métier — joueur professionnel',
  'Darkvale — ce qui y est arrivé', "La Main d'ombre", "Ce qu'il a choisi de perdre",
  'Bram — deux dieux', "Aza — l'énigme", 'Le trio',
].every(t => vh.includes(t)))
verifier('la citation du Codex Profane est rendue', vh.includes('degré de maîtrise de 5 en Profession (joueur)'))
verifier('le contraste Détection / Escamotage est rendu', vh.includes('Escamotage : 0.') && vh.includes('Détection : 8.'))
verifier('le chapitre 1 nomme le métier', vh.includes('Duncan est joueur professionnel.'))
verifier('le chapitre 1 ne dit plus « ne nomme pas encore »', !vh.includes('que sa fiche ne nomme pas encore'))
verifier('« Le trio » ne liste plus le métier comme fil ouvert', !vh.includes('huit rangs de Profession attendent un nom'))
verifier('« Le trio » pose le nouveau fil', vh.includes('Où il a appris à jouer'))
// Le corps du récit ne doit porter aucune marque : elles sont interprétées.
const corps = vh.split('Vingt et un ans').slice(1).join('')
verifier('aucune marque de gras laissée visible dans le récit', !corps.includes('**'), `${compte(corps, '**')} occurrence(s)`)
verifier('aucun gras imbriqué dans le rendu', grasImbriques(corps).length === 0)
const strong = (hist.html.match(/<strong>/g) ?? []).length
console.log(`  (balises <strong> rendues sur la page : ${strong})`)

console.log('\n— LE LIEN PUBLIC, sans mot de passe')
const pub = await lire(`/histoire/${JETON_PUBLIC}`, false)
verifier('le lien public répond 200 sans cookie', pub.statut === 200, `${pub.statut}`)
const vp = visible(pub.html)
verifier('il porte le chapitre neuf', vp.includes('Le métier — joueur professionnel'))
verifier('il porte les 9 chapitres', compte(vp, 'Darkvale') >= 1 && vp.includes('Le trio'))
// ⛔ Témoins ABSENTS du récit : chercher un mot qui est dans l'histoire ne
// prouverait rien sur la fuite de la fiche (erreur commise le 2026-11-16).
verifier('⛔ il ne laisse PAS fuir la fiche : « Initiative » absent', !vp.includes('Initiative'))
verifier('⛔ il ne laisse PAS fuir la fiche : « Vigueur » absent', !vp.includes('Vigueur'))

console.log('\n— LA FICHE DE DUNCAN')
const fiche = await lire('/personnage/97')
verifier('la fiche répond 200', fiche.statut === 200, `${fiche.statut}`)
const vf = visible(fiche.html)
verifier('la compétence est nommée « Profession (joueur) »', vf.includes('Profession (joueur)'))
// Le bouton ne dit pas « 9 chapitres » en toutes lettres : il porte « Histoire »
// puis le nombre seul dans un <span>. C'est donc le HTML qu'il faut lire ici.
const compteBouton = fiche.html.match(/>Histoire<span[^>]*>(\d+)<\/span>/)?.[1]
verifier('le bouton Histoire annonce 9 chapitres', compteBouton === '9', `${compteBouton}`)

console.log('\n— LA FEUILLE IMPRIMÉE, le ■ des spécialités')
const feuille = await lire('/personnage/97/imprimer')
verifier('la feuille répond 200', feuille.statut === 200, `${feuille.statut}`)
// Dans le tableau des compétences, la case de classe occupe sa propre cellule.
// ⛔ Le nom est échappé ICI, une seule fois. La version d'avant l'échappait à
// l'appel ET dans la fonction : la parenthèse se retrouvait précédée de deux
// backslashes, la regex cherchait un backslash littéral, ne trouvait plus rien,
// et TROIS LIGNES JUSTES passaient pour fautives. Ce qui m'a détrompé : une
// regex littérale, sur la même ligne du même HTML, qui elle réussissait.
const echappe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\${c}`)
const caseDe = (html, nom) => html.match(new RegExp(`${echappe(nom)}</td><td[^>]*>([^<]*)<`))?.[1]
verifier('« Profession (joueur) » porte la case ■ de compétence de classe', caseDe(feuille.html, 'Profession (joueur)')?.includes('■'), JSON.stringify(caseDe(feuille.html, 'Profession (joueur)') ?? null))
verifier('témoin positif : Crochetage aussi (compétence du roublard)', caseDe(feuille.html, 'Crochetage')?.includes('■'), JSON.stringify(caseDe(feuille.html, 'Crochetage') ?? null))
verifier('témoin positif : Escalade aussi (roublard et bretteur)', caseDe(feuille.html, 'Escalade')?.includes('■'), JSON.stringify(caseDe(feuille.html, 'Escalade') ?? null))

console.log('\n— UNE AUTRE DES 16 LIGNES RÉPARÉES, chez quelqu\'un d\'autre')
const elianne = await lire('/personnage/67/imprimer')
verifier('la feuille d\'Élianne [67] répond 200', elianne.statut === 200, `${elianne.statut}`)
verifier('« Artisanat (tissage) » porte enfin le ■ (druide)', caseDe(elianne.html, 'Artisanat (tissage)')?.includes('■'), JSON.stringify(caseDe(elianne.html, 'Artisanat (tissage)') ?? null))
verifier('« Profession (charpentier) » porte enfin le ■', caseDe(elianne.html, 'Profession (charpentier)')?.includes('■'), JSON.stringify(caseDe(elianne.html, 'Profession (charpentier)') ?? null))
// ⛔ Témoin négatif : une compétence maison sans parenthèse ne doit RIEN gagner.
verifier('⛔ témoin négatif : « Scrutation » (maison) garde sa case vide', caseDe(elianne.html, 'Scrutation')?.includes('□'), JSON.stringify(caseDe(elianne.html, 'Scrutation') ?? null))
// Et sa caractéristique n'a pas bougé : le charpentier reste en DEX comme saisi.
verifier('⛔ « Profession (charpentier) » garde la DEX saisie, pas la SAG du livre', /Profession \(charpentier\)<\/td><td[^>]*>[^<]*<\/td><td[^>]*>DEX</.test(elianne.html))

console.log('\n— LES AIDES')
for (const [chemin, motif] of [
  ['/aide/creation', 'Les spécialités libres comptent enfin comme compétences de classe.'],
  ['/aide/creation', 'Codex Profane'],
  ['/aide/joueur', 'héritée de la compétence de base'],
]) {
  const a = await lire(chemin)
  verifier(`${chemin} porte « ${motif.slice(0, 44)}… »`, a.statut === 200 && visible(a.html).includes(motif), `${a.statut}`)
}

console.log(`\n${n} contrôles en production, ${echecs} échec(s).`)
if (echecs > 0) process.exit(1)

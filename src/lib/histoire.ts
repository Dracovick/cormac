// ─── L'histoire du personnage : saisie et mise en forme, en un seul endroit ──
// Demandée par André le 2026-11-15 : « une section pour l'histoire des
// personnages, différente de leur fiche de personnage » (drizzle/0018).
//
// Trois écrans lisent ces chapitres — la page d'histoire, sa version imprimable,
// et l'aperçu posé sur la fiche. Les garde-fous et le découpage du texte vivent
// donc ici, hors du fichier 'use server' : une action serveur ne peut exporter
// que des fonctions async, ce qui les rendrait intestables. Même raison que
// `lib/equipement.ts`.

export const MAX_TITRE_CHAPITRE = 200
/**
 * 12 000 caractères par chapitre — environ quatre pages serrées.
 * Mesuré sur le cas réel : l'histoire d'Azadrielle fait 20 000 caractères en
 * neuf chapitres, le plus long en comptant 4 400. La limite laisse donc de la
 * marge sans permettre qu'un seul chapitre devienne illisible.
 * ⚠ `NotePleinePage` plafonne à 4 000 par défaut : la page d'histoire DOIT lui
 * passer cette valeur, sinon le texte est tronqué à la frappe.
 */
export const MAX_CONTENU_CHAPITRE = 12_000
export const MAX_SIGNATURE = 60
/** Au-delà, ce n'est plus une histoire, c'est un roman — et le sommaire ne sert plus. */
export const MAX_CHAPITRES = 60

/** Ce que le navigateur envoie : tout est douteux jusqu'à vérification. */
export type SaisieChapitre = {
  titre?: string | null
  contenu?: string | null
  signature?: string | null
}

/** Ce qui part en base. */
export type ValeursChapitre = {
  titre: string
  contenu: string
  signature: string | null
}

/** Titre et signature : une seule ligne, espaces écrasés. */
function ligne(s: string | undefined | null, max: number): string {
  return (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/**
 * La prose, elle, GARDE ses retours à la ligne — ce sont eux qui font les
 * paragraphes. On ne retire que les espaces en fin de ligne (invisibles, et
 * l'Apple Pencil en laisse) et les retours en trop au début et à la fin.
 * ⛔ Ne jamais écraser les lignes vides internes : deux retours séparent deux
 * paragraphes, c'est la seule structure que le joueur ait sous le crayon.
 */
export function contenuChapitre(s: string | undefined | null): string {
  return (s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(l => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
    .slice(0, MAX_CONTENU_CHAPITRE)
}

export function valeursChapitre(saisie: SaisieChapitre): ValeursChapitre {
  const signature = ligne(saisie.signature, MAX_SIGNATURE)
  return {
    titre: ligne(saisie.titre, MAX_TITRE_CHAPITRE),
    contenu: contenuChapitre(saisie.contenu),
    // '' ne doit pas devenir une signature vide en base : personne n'a signé.
    signature: signature || null,
  }
}

// ─── La mise en forme légère ─────────────────────────────────────────────────
// ⛔ Aucune dépendance Markdown ajoutée, et AUCUN HTML stocké ni injecté : ce
// texte vient d'un joueur, et `dangerouslySetInnerHTML` sur de la saisie libre
// est une porte ouverte. Ce découpage rend des BLOCS, que le composant tourne en
// éléments React. Ce que le joueur a tapé reste exactement ce qu'il a tapé.
//
// Cinq formes, choisies parce qu'elles s'écrivent au crayon sans menu :
//   ### Titre      → un intertitre dans le chapitre
//   > réplique     → une citation mise en évidence
//   - item         → une liste (ou « — item », que l'iPad produit tout seul)
//   ligne vide     → sépare deux paragraphes
//   **gras**, *italique* → à l'intérieur du texte

export type Fragment =
  | { sorte: 'texte'; texte: string }
  | { sorte: 'gras'; texte: string }
  | { sorte: 'italique'; texte: string }

export type BlocHistoire =
  | { sorte: 'titre'; fragments: Fragment[] }
  | { sorte: 'paragraphe'; fragments: Fragment[] }
  | { sorte: 'citation'; fragments: Fragment[] }
  | { sorte: 'liste'; items: Fragment[][] }

/**
 * Découpe `**gras**` et `*italique*` sans expression régulière gourmande.
 * ⚠ Le gras est cherché AVANT l'italique : `**mot**` commence par `*`, et un
 * découpage naïf sur `*` le rendrait en italique avec des astérisques orphelines.
 * ⚠ Un délimiteur non refermé reste du texte littéral — le joueur qui tape
 * « 3 * 4 » ou une note d'astérisque voit ce qu'il a écrit.
 */
export function fragmentsDe(ligneTexte: string): Fragment[] {
  const fragments: Fragment[] = []
  let reste = ligneTexte
  let tampon = ''

  const pousseTampon = () => {
    if (tampon) fragments.push({ sorte: 'texte', texte: tampon })
    tampon = ''
  }

  while (reste) {
    if (reste.startsWith('**')) {
      const fin = reste.indexOf('**', 2)
      if (fin > 2) {
        pousseTampon()
        fragments.push({ sorte: 'gras', texte: reste.slice(2, fin) })
        reste = reste.slice(fin + 2)
        continue
      }
    } else if (reste.startsWith('*')) {
      const fin = reste.indexOf('*', 1)
      // fin > 1 : `**` collés ne sont pas un italique vide.
      if (fin > 1) {
        pousseTampon()
        fragments.push({ sorte: 'italique', texte: reste.slice(1, fin) })
        reste = reste.slice(fin + 1)
        continue
      }
    }
    tampon += reste[0]
    reste = reste.slice(1)
  }
  pousseTampon()
  return fragments
}

/** Le texte nu d'une suite de fragments — pour l'aperçu et les mesures. */
export function texteNu(fragments: Fragment[]): string {
  return fragments.map(f => f.texte).join('')
}

/**
 * Le chapitre, en blocs prêts à rendre.
 * Les lignes consécutives d'un même paragraphe sont recollées avec un espace :
 * un retour à la ligne simple dans un traitement de texte n'est pas une
 * rupture, c'est un retour à la ligne de saisie.
 */
export function blocsHistoire(contenu: string): BlocHistoire[] {
  const blocs: BlocHistoire[] = []
  let paragraphe: string[] = []
  let citation: string[] = []
  let liste: string[] = []

  const videParagraphe = () => {
    if (paragraphe.length) blocs.push({ sorte: 'paragraphe', fragments: fragmentsDe(paragraphe.join(' ')) })
    paragraphe = []
  }
  const videCitation = () => {
    if (citation.length) blocs.push({ sorte: 'citation', fragments: fragmentsDe(citation.join(' ')) })
    citation = []
  }
  const videListe = () => {
    if (liste.length) blocs.push({ sorte: 'liste', items: liste.map(fragmentsDe) })
    liste = []
  }
  const videTout = () => { videParagraphe(); videCitation(); videListe() }

  for (const brute of (contenu ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const l = brute.trim()

    if (!l) { videTout(); continue }

    // Intertitre : ### ou ## ou # — tous rendus du même niveau. Le titre du
    // chapitre est déjà le niveau du dessus, et empiler quatre tailles dans un
    // récit de trois pages ne sert personne.
    const titre = /^#{1,4}\s+(.*)$/.exec(l)
    if (titre) {
      videTout()
      blocs.push({ sorte: 'titre', fragments: fragmentsDe(titre[1].trim()) })
      continue
    }

    const cit = /^>\s?(.*)$/.exec(l)
    if (cit) {
      videParagraphe(); videListe()
      citation.push(cit[1].trim())
      continue
    }

    // « - item », « * item », et « — item » : l'iPad transforme deux tirets en
    // cadratin tout seul, et André écrit ses listes au cadratin.
    const item = /^(?:[-*•]|—|–)\s+(.*)$/.exec(l)
    if (item) {
      videParagraphe(); videCitation()
      liste.push(item[1].trim())
      continue
    }

    videCitation(); videListe()
    paragraphe.push(l)
  }

  videTout()
  return blocs
}

/**
 * Le sommaire : un chapitre, son titre, son ancre.
 * ⚠ L'ancre est bâtie sur l'ID de base, jamais sur le titre : deux chapitres
 * peuvent porter le même titre, et un titre se renomme.
 */
export function ancreChapitre(id: number): string {
  return `chapitre-${id}`
}

/** Compte les mots d'un chapitre — affiché au sommaire, et c'est tout. */
export function compteMots(contenu: string): number {
  const nu = (contenu ?? '')
    .replace(/[#>*_`-]+/g, ' ')
    .trim()
  if (!nu) return 0
  return nu.split(/\s+/).length
}

/** « il y a 3 jours » n'a pas de sens pour un récit : on date. */
export function dateCourte(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}

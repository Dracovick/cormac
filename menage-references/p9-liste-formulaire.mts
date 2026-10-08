/**
 * Régénère `src/lib/dnd35/weapons.ts` — la liste déroulante du formulaire — à
 * partir du relevé de la table 7-5 (p7-armes-catalogue.json).
 *
 * POURQUOI un script plutôt qu'une saisie à la main : la liste et le catalogue
 * publié à la Bibliothèque disaient deux choses différentes. 25 entrées
 * portaient une ancienne traduction (« Hache de bataille » pour « Hache
 * d'armes ») et 6 une valeur fausse (« Arc long 27 m » pour 30 m). Et comme
 * choisir une entrée réécrit la référence partagée (« la saisie fait foi »),
 * la liste reprenait le dessus sur le catalogue au premier enregistrement.
 * Une seule source, un seul texte : plus de divergence possible.
 *
 * ⚠️ Le nom doit tomber à l'octet près sur celui de la ligne `weapons` du
 * catalogue, sinon `findOrCreateByNom` en crée une jumelle à l'enregistrement.
 * Le script REFUSE d'écrire si un nom du relevé n'a pas son entrée en base.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'



const RACINE = 'X:/Claude-Tools/cormac'
const sql = neon(fs.readFileSync(`${RACINE}/.env.local`, 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

type Entree = {
  nom: string; famille: string; degats: string | null; degatsP: string | null
  critMin: number | null; critMult: number | null; portee: number | null; type: string | null
}
const releve: Entree[] = JSON.parse(
  fs.readFileSync(`${RACINE}/menage-references/p7-armes-catalogue.json`, 'utf8')
).armes

const pliNom = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[\u2019\u02bc]/g, "'").replace(/\s+/g, ' ').trim()

// ── Contrôle d'abord : chaque nom du relevé existe-t-il au catalogue en base ? ──
const enBase = await sql`SELECT id, nom FROM weapons WHERE est_catalogue` as { id: number; nom: string }[]
const manquants = releve.filter(e => !enBase.some(r => r.nom === e.nom))
if (manquants.length > 0) {
  console.error(`⛔ ${manquants.length} nom(s) du relevé n'ont pas d'entrée de catalogue À L'OCTET PRÈS en base :`)
  for (const m of manquants) {
    const proche = enBase.find(r => pliNom(r.nom) === pliNom(m.nom))
    console.error(`   « ${m.nom} »${proche ? `  → en base : « ${proche.nom} » [${proche.id}] — aligner l'orthographe d'abord` : '  → aucune entrée proche'}`)
  }
  console.error('Rien écrit.')
  process.exit(1)
}

// ── Catégorie : c'est elle qui décide du don de maniement ──
function categorie(famille: string): string {
  if (famille === 'Munition') return 'Munition'
  if (famille.startsWith('Arme courante')) return 'Courante'
  if (famille.startsWith('Arme de guerre')) return 'Guerre'
  if (famille.startsWith('Arme exotique')) return 'Exotique'
  throw new Error(`famille inattendue : ${famille}`)
}

/** T / C / P. Le livre laisse parfois le choix (« perforant ou tranchant ») :
 *  on retient le premier, le joueur change le menu s'il frappe autrement. */
function lettreType(type: string | null): 'T' | 'C' | 'P' {
  if (!type) return 'C'
  const t = pliNom(type)
  if (t.startsWith('tranchant')) return 'T'
  if (t.startsWith('perforant')) return 'P'
  if (t.startsWith('contondant')) return 'C'
  throw new Error(`type inattendu : ${type}`)
}

const ORDRE = ['Courante', 'Guerre', 'Exotique', 'Munition']
const trie = [...releve].sort((a, b) => {
  const ca = ORDRE.indexOf(categorie(a.famille)), cb = ORDRE.indexOf(categorie(b.famille))
  if (ca !== cb) return ca - cb
  return a.famille.localeCompare(b.famille, 'fr') || a.nom.localeCompare(b.nom, 'fr')
})

/** Armes de CONTACT auxquelles le livre donne un facteur de portée : la dague
 *  se lance à 3 m, la lance à 6 m. Elles gardent une seconde entrée « (lancée) »
 *  pour la ligne de fiche qui décrit ce mode d'attaque — c'est la convention
 *  d'André (« Dague +2 (coup) » / « Dague +2 (lancée) »), et c'est elle qui
 *  fait calculer l'attaque au BBA de projectiles plutôt qu'au corps à corps. */
const lancables = releve.filter(e => e.famille.includes('corps à corps') && e.portee != null)
const FEMININ = /^(Dague|Lance|Hache)/

function ligne(e: Entree, suffixe = ''): string {
  const nom = (e.nom + suffixe).replace(/'/g, "\\'")
  const estContact = e.famille.includes('corps à corps') || e.famille.includes('mains nues')
  const portee = suffixe === '' && estContact
    ? "'Contact'"
    : (e.portee != null ? `'${e.portee} m'` : "'Contact'")
  return `  { nom: '${nom}', famille: '${e.famille}', categorie: '${categorie(e.famille)}',`
    + ` degats: ${e.degats ? `'${e.degats}'` : 'null'}, degatsP: ${e.degatsP ? `'${e.degatsP}'` : 'null'},`
    + ` critMin: ${e.critMin}, critMult: ${e.critMult}, typeDegats: '${lettreType(e.type)}',`
    + ` portee: ${portee}${suffixe ? ', modeLancer: true' : ''} },`
}

const blocs: string[] = []
let famCourante = ''
for (const e of trie) {
  if (e.famille !== famCourante) { famCourante = e.famille; blocs.push(`  // ── ${e.famille} ──`) }
  blocs.push(ligne(e))
}
blocs.push('')
blocs.push("  // ── Modes de lancer : même arme du Manuel, autre mode d'attaque ──")
for (const e of [...lancables].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))) {
  blocs.push(ligne(e, FEMININ.test(e.nom) ? ' (lancée)' : ' (lancé)'))
}

const entete = `/**
 * Les armes du Manuel des Joueurs 3.5 — table 7-5 (p. 116-117).
 *
 * ⛔ FICHIER GÉNÉRÉ. Ne pas modifier à la main :
 *    npx tsx menage-references/p9-liste-formulaire.mts
 *
 * La source est \`menage-references/p7-armes-catalogue.json\`, le relevé à
 * l'image du livre — celui qui a aussi semé le catalogue publié à la
 * Bibliothèque. Les deux disaient autrefois des choses différentes : 25
 * anciennes traductions et 6 valeurs fausses dans cette liste. Comme choisir
 * une entrée réécrit la référence partagée (« la saisie fait foi »), la liste
 * reprenait le dessus sur le catalogue au premier enregistrement.
 *
 * Le nom tombe à l'octet près sur celui de l'entrée de catalogue en base :
 * c'est ce qui fait que choisir une arme réutilise la référence partagée au
 * lieu d'en créer une jumelle (\`findOrCreateByNom\`).
 */

export type WeaponCategorie = 'Courante' | 'Guerre' | 'Exotique' | 'Munition'

export interface WeaponTemplate {
  nom: string
  /** Groupe du livre : « Arme de guerre — corps à corps à une main ». */
  famille: string
  /** Courante / de guerre / exotique : c'est elle qui décide du don de maniement. */
  categorie: WeaponCategorie
  /** Dégâts pour une arme de taille M, puis pour une arme de taille P. */
  degats: string | null
  degatsP: string | null
  /** null pour les munitions et le filet : le livre ne leur donne pas de
   *  critique propre (la munition prend celui de son arme de tir). */
  critMin: number | null
  critMult: number | null
  typeDegats: 'T' | 'C' | 'P'
  /** 'Contact' ou « 9 m ». Une arme de contact lançable reste à 'Contact' :
   *  son facteur de portée ne vaut que pour son entrée « (lancée) ». */
  portee: string
  /** Entrée de mode de lancer d'une arme de contact (« Dague (lancée) »). */
  modeLancer?: boolean
}

export const WEAPONS_DND35: WeaponTemplate[] = [
${blocs.join('\n')}
]

export const WEAPON_CATEGORIES = ['Courante', 'Guerre', 'Exotique', 'Munition'] as const

export const WEAPON_CATEGORIE_LIBELLE: Record<WeaponCategorie, string> = {
  Courante: 'Armes courantes',
  Guerre: 'Armes de guerre',
  Exotique: 'Armes exotiques',
  Munition: 'Munitions',
}
`

// `estArmeADistance` vit dans le même fichier mais n'a rien de généré : il est
// lu par la fiche et la feuille imprimée. On le recopie tel quel.
const ancien = fs.readFileSync(`${RACINE}/src/lib/dnd35/weapons.ts`, 'utf8')
const i = ancien.indexOf('/**\n * Arme de tir/de jet')
if (i < 0) {
  console.error("⛔ bloc estArmeADistance introuvable dans l'ancien fichier — rien écrit.")
  process.exit(1)
}

// Écriture atomique : un plantage d'encodage ne doit pas laisser la cible vide.
const cible = `${RACINE}/src/lib/dnd35/weapons.ts`
// Le temporaire doit être sur le MÊME volume que la cible : `rename` entre
// C: et X: échoue (EXDEV) et l'écriture atomique tombe à l'eau.
const tmp = cible + '.tmp'
fs.writeFileSync(tmp, entete + '\n' + ancien.slice(i), 'utf8')
fs.renameSync(tmp, cible)

console.log(`✓ ${releve.length} entrées du Manuel + ${lancables.length} modes de lancer → src/lib/dnd35/weapons.ts`)
for (const c of ORDRE) console.log(`   ${c.padEnd(10)} ${releve.filter(e => categorie(e.famille) === c).length}`)
console.log(`   modes de lancer : ${lancables.map(e => e.nom).join(', ')}`)

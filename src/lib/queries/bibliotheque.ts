import { getDb } from '@/db'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { normaliserNom } from '@/lib/noms'
import { aliasPour } from '@/lib/dnd35/anciens-noms'

/**
 * La Grande Bibliothèque — requêtes de consultation des catalogues de référence.
 *
 * Deux étages pour rester léger : l'index (nom + une ligne de détail par entrée,
 * ~1 800 entrées sans les descriptions) part au navigateur pour la recherche
 * instantanée; la fiche complète (description, prérequis, niveaux…) se charge
 * sur sa propre page, côté serveur.
 */

export type RayonSlug = 'sort' | 'potion' | 'objet' | 'arme' | 'armure' | 'don'

export type EntreeIndex = {
  id: number
  nom: string
  /** Une ligne pour reconnaître l'entrée dans une liste (école, effet, dégâts…). */
  detail: string
  /** Vieux noms de table encore tapés par réflexe (potions seulement pour l'instant). */
  alias?: string[]
  /** Clé de filtre du rayon : école pour les sorts, type pour les objets magiques. */
  groupe?: string
}

export type BibliothequeIndex = {
  sorts: EntreeIndex[]
  potions: EntreeIndex[]
  objets: EntreeIndex[]
  armes: EntreeIndex[]
  armures: EntreeIndex[]
  dons: EntreeIndex[]
}

/** Abréviations VF 3.5 des classes pour la ligne « Niveau » des sorts. */
const ABREV_CLASSES: Record<string, string> = {
  Barbare: 'Bbn', Barde: 'Brd', Druide: 'Dru', Ensorceleur: 'Ens', Guerrier: 'Gue',
  Magicien: 'Mag', Moine: 'Moi', Paladin: 'Pal', 'Prêtre': 'Prê', 'Rôdeur': 'Rôd',
  Roublard: 'Rou', Assassin: 'Asn', Blackguard: 'Blk',
}

function abrevClasse(nom: string): string {
  return ABREV_CLASSES[nom] ?? nom.slice(0, 4)
}

/** « Ens/Mag 3 · Prê 4 » — classes au même niveau regroupées, niveaux croissants. */
function formatNiveaux(niveaux: { classe: string; niveau: number }[]): string {
  const parNiveau = new Map<number, string[]>()
  for (const n of niveaux) {
    const liste = parNiveau.get(n.niveau) ?? []
    liste.push(abrevClasse(n.classe))
    parNiveau.set(n.niveau, liste)
  }
  return [...parNiveau.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([niveau, classes]) => `${classes.sort((a, b) => a.localeCompare(b, 'fr')).join('/')} ${niveau}`)
    .join(' · ')
}

/** « 750 po » — les numeric de drizzle arrivent en chaîne, avec des .00 inutiles. */
function formatPrix(prix: string | null): string | null {
  if (prix === null) return null
  const n = Number(prix)
  if (!Number.isFinite(n) || n <= 0) return null
  return `${n % 1 === 0 ? n : n.toFixed(2)} po`
}

/** « 19-20/×2 » — la ligne de critique telle que les joueurs la lisent. */
function formatCritique(min: number | null, mult: number | null): string {
  const m = min ?? 20
  const x = mult ?? 2
  return m < 20 ? `${m}-20/×${x}` : `×${x}`
}

/** Les 23 « Relique (dieu) » forment un seul groupe de filtre. */
function groupeObjet(type: string | null): string | undefined {
  if (!type) return undefined
  return type.startsWith('Relique') ? 'Relique' : type
}

async function niveauxParSort(): Promise<Map<number, { classe: string; niveau: number }[]>> {
  const lignes = await getDb()
    .select({ sortId: schema.spellClassLevels.sortId, niveau: schema.spellClassLevels.niveau, classe: schema.classes.nom })
    .from(schema.spellClassLevels)
    .innerJoin(schema.classes, eq(schema.spellClassLevels.classeId, schema.classes.id))
  const parSort = new Map<number, { classe: string; niveau: number }[]>()
  for (const l of lignes) {
    const liste = parSort.get(l.sortId) ?? []
    liste.push({ classe: l.classe, niveau: l.niveau })
    parSort.set(l.sortId, liste)
  }
  return parSort
}

export async function getBibliothequeIndex(): Promise<BibliothequeIndex> {
  const db = getDb()
  const [sorts, niveaux, potions, objets, armes, armures, dons] = await Promise.all([
    db.select({ id: schema.spells.id, nom: schema.spells.nom, ecole: schema.spells.ecole })
      .from(schema.spells).orderBy(schema.spells.nom),
    niveauxParSort(),
    db.select({ id: schema.potions.id, nom: schema.potions.nom, sortEffet: schema.potions.sortEffet })
      .from(schema.potions).orderBy(schema.potions.nom),
    db.select({
      id: schema.magicItems.id, nom: schema.magicItems.nom, type: schema.magicItems.type,
      prix: schema.magicItems.prix,
    }).from(schema.magicItems).orderBy(schema.magicItems.nom),
    db.select({
      id: schema.weapons.id, nom: schema.weapons.nom, degats: schema.weapons.degats,
      critiqueMin: schema.weapons.critiqueMin, critiqueMult: schema.weapons.critiqueMult,
      typeDegats: schema.weapons.typeDegats,
    }).from(schema.weapons).orderBy(schema.weapons.nom),
    db.select().from(schema.armor).orderBy(schema.armor.nom),
    db.select({ id: schema.feats.id, nom: schema.feats.nom, categorie: schema.feats.categorie, prerequis: schema.feats.prerequis })
      .from(schema.feats).orderBy(schema.feats.nom),
  ])

  return {
    sorts: sorts.map(s => {
      const niveauxStr = formatNiveaux(niveaux.get(s.id) ?? [])
      return {
        id: s.id, nom: s.nom,
        detail: [s.ecole, niveauxStr].filter(Boolean).join(' — '),
        groupe: s.ecole ?? undefined,
      }
    }),
    potions: potions.map(p => ({
      id: p.id, nom: p.nom,
      detail: p.sortEffet ?? '',
      alias: aliasPour(p.nom),
    })),
    objets: objets.map(o => ({
      id: o.id, nom: o.nom,
      detail: [o.type, formatPrix(o.prix)].filter(Boolean).join(' · '),
      groupe: groupeObjet(o.type),
    })),
    armes: armes.map(a => ({
      id: a.id, nom: a.nom,
      detail: [a.degats, formatCritique(a.critiqueMin, a.critiqueMult), a.typeDegats].filter(Boolean).join(' · '),
    })),
    armures: armures.map(a => ({
      id: a.id, nom: a.nom,
      detail: [a.type, a.bonusArmure ? `armure +${a.bonusArmure}` : null, formatPrix(a.prix)].filter(Boolean).join(' · '),
    })),
    dons: dons.map(d => ({
      id: d.id, nom: d.nom,
      detail: d.categorie ?? (d.prerequis ? `Prérequis : ${d.prerequis}` : ''),
      groupe: d.categorie ?? undefined,
    })),
  }
}

/**
 * Lien potion ↔ sort : « Potion d'état gazeux » désigne le sort « État gazeux ».
 * On retire l'habillage (« Potion de… », « Huile de… ») et on compare les noms
 * normalisés. Pas de correspondance = pas de lien — jamais de devinette.
 */
function nomSortDePotion(nomPotion: string): string {
  return nomPotion.replace(/^(potion|huile|fiole)\s+(de\s+la\s+|de\s+l'|de\s+|d'|du\s+|des\s+)?/i, '').trim()
}

export type FicheSort = {
  categorie: 'sort'
  sort: typeof schema.spells.$inferSelect
  niveaux: string
  potionsLiees: { id: number; nom: string }[]
}
export type FichePotion = {
  categorie: 'potion'
  potion: typeof schema.potions.$inferSelect
  sortLie: { id: number; nom: string } | null
}
export type FicheObjet = { categorie: 'objet'; objet: typeof schema.magicItems.$inferSelect; prixAffiche: string | null }
export type FicheArme = {
  categorie: 'arme'
  arme: typeof schema.weapons.$inferSelect
  categorieArme: string | null
  critique: string
  prixAffiche: string | null
}
export type FicheArmure = { categorie: 'armure'; armure: typeof schema.armor.$inferSelect; prixAffiche: string | null }
export type FicheDon = { categorie: 'don'; don: typeof schema.feats.$inferSelect }

export type FicheBibliotheque = FicheSort | FichePotion | FicheObjet | FicheArme | FicheArmure | FicheDon

export async function getFicheBibliotheque(categorie: RayonSlug, id: number): Promise<FicheBibliotheque | null> {
  const db = getDb()

  if (categorie === 'sort') {
    const [sort] = await db.select().from(schema.spells).where(eq(schema.spells.id, id))
    if (!sort) return null
    const [niveaux, potions] = await Promise.all([
      niveauxParSort(),
      db.select({ id: schema.potions.id, nom: schema.potions.nom }).from(schema.potions),
    ])
    const cible = normaliserNom(sort.nom)
    const potionsLiees = potions
      .filter(p => normaliserNom(nomSortDePotion(p.nom)) === cible)
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    return { categorie, sort, niveaux: formatNiveaux(niveaux.get(sort.id) ?? []), potionsLiees }
  }

  if (categorie === 'potion') {
    const [potion] = await db.select().from(schema.potions).where(eq(schema.potions.id, id))
    if (!potion) return null
    const cible = normaliserNom(nomSortDePotion(potion.nom))
    const sorts = await db.select({ id: schema.spells.id, nom: schema.spells.nom }).from(schema.spells)
    const sortLie = sorts.find(s => normaliserNom(s.nom) === cible) ?? null
    return { categorie, potion, sortLie }
  }

  if (categorie === 'objet') {
    const [objet] = await db.select().from(schema.magicItems).where(eq(schema.magicItems.id, id))
    if (!objet) return null
    return { categorie, objet, prixAffiche: formatPrix(objet.prix) }
  }

  if (categorie === 'arme') {
    const [ligne] = await db
      .select({ arme: schema.weapons, categorieArme: schema.weaponCategories.nom })
      .from(schema.weapons)
      .leftJoin(schema.weaponCategories, eq(schema.weapons.categorieId, schema.weaponCategories.id))
      .where(eq(schema.weapons.id, id))
    if (!ligne) return null
    return {
      categorie, arme: ligne.arme, categorieArme: ligne.categorieArme,
      critique: formatCritique(ligne.arme.critiqueMin, ligne.arme.critiqueMult),
      prixAffiche: formatPrix(ligne.arme.prix),
    }
  }

  if (categorie === 'armure') {
    const [armure] = await db.select().from(schema.armor).where(eq(schema.armor.id, id))
    if (!armure) return null
    return { categorie, armure, prixAffiche: formatPrix(armure.prix) }
  }

  const [don] = await db.select().from(schema.feats).where(eq(schema.feats.id, id))
  if (!don) return null
  return { categorie: 'don', don }
}

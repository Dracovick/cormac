import { getDb } from '@/db'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { normaliserNom } from '@/lib/noms'
import { aliasPour } from '@/lib/dnd35/anciens-noms'
import { formatCritique } from '@/lib/dnd35/critique'

/**
 * La Grande Bibliothèque — requêtes de consultation des catalogues de référence.
 *
 * Deux étages pour rester léger : l'index (nom + une ligne de détail par entrée,
 * ~1 800 entrées sans les descriptions) part au navigateur pour la recherche
 * instantanée; la fiche complète (description, prérequis, niveaux…) se charge
 * sur sa propre page, côté serveur.
 */

export type RayonSlug = 'sort' | 'potion' | 'objet' | 'arme' | 'armure' | 'don' | 'competence'

export type EntreeIndex = {
  id: number
  nom: string
  /** Une ligne pour reconnaître l'entrée dans une liste (école, effet, dégâts…). */
  detail: string
  /** Vieux noms de table encore tapés par réflexe (potions seulement pour l'instant). */
  alias?: string[]
  /** Clé de filtre du rayon : école pour les sorts, type pour les objets magiques. */
  groupe?: string
  /** Classes qui lancent le sort (rayon Sorts seulement) — pour le filtre par classe. */
  classes?: string[]
  /** Niveau du sort pour chaque classe (rayon Sorts seulement) — pour le tri par niveau. */
  niveaux?: Record<string, number>
}

export type BibliothequeIndex = {
  sorts: EntreeIndex[]
  potions: EntreeIndex[]
  objets: EntreeIndex[]
  armes: EntreeIndex[]
  armures: EntreeIndex[]
  dons: EntreeIndex[]
  competences: EntreeIndex[]
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

/** La base écrit FOR/DEX/…; la fiche d'un joueur écrit le mot. */
const LIBELLE_CARAC: Record<string, string> = {
  FOR: 'Force', DEX: 'Dextérité', CON: 'Constitution',
  INT: 'Intelligence', SAG: 'Sagesse', CHA: 'Charisme',
  '—': 'Aucune caractéristique',
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
  const [sorts, niveaux, potions, objets, armes, armures, dons, competences] = await Promise.all([
    db.select({ id: schema.spells.id, nom: schema.spells.nom, ecole: schema.spells.ecole })
      .from(schema.spells).orderBy(schema.spells.nom),
    niveauxParSort(),
    db.select({ id: schema.potions.id, nom: schema.potions.nom, sortEffet: schema.potions.sortEffet })
      .from(schema.potions).orderBy(schema.potions.nom),
    db.select({
      id: schema.magicItems.id, nom: schema.magicItems.nom, type: schema.magicItems.type,
      prix: schema.magicItems.prix,
    }).from(schema.magicItems).orderBy(schema.magicItems.nom),
    // Seul le catalogue du Manuel est publié : la table porte aussi les lignes
    // d'inventaire des personnages ("Longbow +3, rapid shot"), qui n'ont rien
    // à faire dans un rayon de référence. Voir drizzle/0006.
    db.select({
      id: schema.weapons.id, nom: schema.weapons.nom, degats: schema.weapons.degats,
      critiqueMin: schema.weapons.critiqueMin, critiqueMult: schema.weapons.critiqueMult,
      typeDegats: schema.weapons.typeDegats, famille: schema.weapons.famille,
    }).from(schema.weapons).where(eq(schema.weapons.estCatalogue, true)).orderBy(schema.weapons.nom),
    db.select().from(schema.armor).orderBy(schema.armor.nom),
    // Même raison que pour les armes : la table porte aussi les lignes de fiche
    // des personnages (« CLASS - Lay on hands », « DON Niv 1 », « =-=-=-= »),
    // qui n'ont rien à faire dans un rayon de référence. Voir drizzle/0008.
    db.select({ id: schema.feats.id, nom: schema.feats.nom, categorie: schema.feats.categorie, prerequis: schema.feats.prerequis })
      .from(schema.feats).where(eq(schema.feats.estCatalogue, true)).orderBy(schema.feats.nom),
    // Même raison encore : `skills` porte les 88 lignes de fiche importées de
    // FileMaker (« Scrutation », « Volonté », « connaissance des femmes »).
    // Seules les 36 compétences du Manuel sont publiées. Voir drizzle/0009.
    db.select({
      id: schema.skills.id, nom: schema.skills.nom, caracteristique: schema.skills.caracteristique,
      formationRequise: schema.skills.formationRequise, malusArmure: schema.skills.malusArmure,
    }).from(schema.skills).where(eq(schema.skills.estCatalogue, true)).orderBy(schema.skills.nom),
  ])

  return {
    sorts: sorts.map(s => {
      const niveauxSort = niveaux.get(s.id) ?? []
      const classesSort = [...new Set(niveauxSort.map(n => n.classe))]
      const niveauParClasse: Record<string, number> = {}
      for (const n of niveauxSort) {
        const deja = niveauParClasse[n.classe]
        if (deja === undefined || n.niveau < deja) niveauParClasse[n.classe] = n.niveau
      }
      return {
        id: s.id, nom: s.nom,
        detail: [s.ecole, formatNiveaux(niveauxSort)].filter(Boolean).join(' — '),
        groupe: s.ecole ?? undefined,
        classes: classesSort.length ? classesSort : undefined,
        niveaux: classesSort.length ? niveauParClasse : undefined,
        alias: aliasPour(s.nom),
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
      detail: [a.famille, a.degats, formatCritique(a.critiqueMin, a.critiqueMult), a.typeDegats].filter(Boolean).join(' · '),
      // Courante / de guerre / exotique : c'est ce qui décide du don de maniement.
      groupe: a.famille?.split(' — ')[0] ?? undefined,
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
    competences: competences.map(c => ({
      id: c.id, nom: c.nom,
      detail: [
        LIBELLE_CARAC[c.caracteristique] ?? c.caracteristique,
        c.formationRequise ? 'formation nécessaire' : null,
        c.malusArmure ? "malus d'armure aux tests" : null,
      ].filter(Boolean).join(' · '),
      // La caractéristique est ce qui range une compétence dans la tête d'un
      // joueur : « qu'est-ce que je lance sur ma Dextérité ? »
      groupe: LIBELLE_CARAC[c.caracteristique] ?? c.caracteristique,
      // Une compétence fusionnée a disparu de la base, pas des habitudes :
      // « Connaissance de la magie » doit mener à « Art de la magie ».
      alias: aliasPour(c.nom),
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
export type FicheCompetence = {
  categorie: 'competence'
  competence: typeof schema.skills.$inferSelect
  caracteristique: string
  /** Les classes pour qui c'est une compétence de classe (plafond niveau + 3). */
  classesDeClasse: { nom: string; precision: string | null }[]
}

export type FicheBibliotheque = FicheSort | FichePotion | FicheObjet | FicheArme | FicheArmure | FicheDon | FicheCompetence

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

  if (categorie === 'competence') {
    const [competence] = await db.select().from(schema.skills).where(eq(schema.skills.id, id))
    if (!competence) return null
    const classes = await db
      .select({ nom: schema.classes.nom, precision: schema.classSkillList.precision })
      .from(schema.classSkillList)
      .innerJoin(schema.classes, eq(schema.classSkillList.classeId, schema.classes.id))
      .where(eq(schema.classSkillList.skillId, id))
    return {
      categorie, competence,
      caracteristique: LIBELLE_CARAC[competence.caracteristique] ?? competence.caracteristique,
      classesDeClasse: classes.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    }
  }

  const [don] = await db.select().from(schema.feats).where(eq(schema.feats.id, id))
  if (!don) return null
  return { categorie: 'don', don }
}

"""Ajoute le rayon « Livres » à la Grande Bibliothèque.

Touche trois fichiers : les requêtes (index + fiche), le composant client qui
liste les rayons, et la page de fiche. Le lecteur lui-même est un composant neuf
(LecteurLivre.tsx), écrit à part.

Le script vérifie tous ses points d'ancrage AVANT d'écrire quoi que ce soit :
aucun fichier ne peut rester à moitié modifié.

Usage : uv run menage-references/p19-rayon-livres.py
"""
import io
import os
import sys

Q = "src/lib/queries/bibliotheque.ts"
C = "src/components/bibliotheque/BibliothequeClient.tsx"
F = "src/app/bibliotheque/[categorie]/[id]/page.tsx"

edits: list[tuple[str, str, str]] = []

# ── 1. RayonSlug
edits.append((
    Q,
    "export type RayonSlug = 'sort' | 'potion' | 'objet' | 'arme' | 'armure' | 'don' | 'competence'",
    "export type RayonSlug = 'sort' | 'potion' | 'objet' | 'arme' | 'armure' | 'don' | 'competence' | 'livre'",
))

# ── 2. BibliothequeIndex
edits.append((
    Q,
    """  dons: EntreeIndex[]
  competences: EntreeIndex[]
}""",
    """  dons: EntreeIndex[]
  competences: EntreeIndex[]
  livres: EntreeIndex[]
}""",
))

# ── 3. un format de taille, à côté du format de prix
edits.append((
    Q,
    """/** La base écrit FOR/DEX/…; la fiche d'un joueur écrit le mot. */""",
    """/** « 14,7 Mo » — la taille d'un fichier téléchargeable, pour que le joueur sache. */
export function formatTaille(octets: number | null): string | null {
  if (octets === null || octets <= 0) return null
  const mo = octets / 1024 / 1024
  return mo >= 100 ? `${Math.round(mo)} Mo` : `${mo.toFixed(1).replace('.', ',')} Mo`
}

/** La base écrit FOR/DEX/…; la fiche d'un joueur écrit le mot. */""",
))

# ── 4. la requête d'index
edits.append((
    Q,
    """  const [sorts, niveaux, potions, objets, armes, armures, dons, competences] = await Promise.all([""",
    """  const [sorts, niveaux, potions, objets, armes, armures, dons, competences, livres] = await Promise.all([""",
))
edits.append((
    Q,
    """    }).from(schema.skills).where(eq(schema.skills.estCatalogue, true)).orderBy(schema.skills.nom),
  ])""",
    """    }).from(schema.skills).where(eq(schema.skills.estCatalogue, true)).orderBy(schema.skills.nom),
    // Les livres consultables en entier : le PDF vit dans Vercel Blob, pas dans
    // le dépôt. Le rayon n'en publie que l'étiquette; la lecture se fait sur la
    // fiche. Voir drizzle/0012.
    db.select().from(schema.gameBooks).orderBy(schema.gameBooks.ordre),
  ])""",
))

# ── 5. le mapping d'index
edits.append((
    Q,
    """      alias: aliasPour(c.nom),
    })),
  }
}""",
    """      alias: aliasPour(c.nom),
    })),
    livres: livres.map(l => ({
      id: l.id, nom: l.titre,
      detail: [
        l.tranche ? `entrées ${l.tranche}` : null,
        l.pages ? `${l.pages} pages` : null,
        formatTaille(l.tailleOctets),
        l.langue === 'en' ? 'en anglais' : null,
      ].filter(Boolean).join(' · '),
      // Un joueur qui cherche « encyclopedia » ou « magica » doit tomber dessus.
      alias: ['encyclopedia magica', 'encyclopedia', 'magica'],
    })),
  }
}""",
))

# ── 6. type de fiche
edits.append((
    Q,
    "export type FicheBibliotheque = FicheSort | FichePotion | FicheObjet | FicheArme | FicheArmure | FicheDon | FicheCompetence",
    """export type FicheLivre = {
  categorie: 'livre'
  livre: typeof schema.gameBooks.$inferSelect
  tailleAffichee: string | null
  /** Les autres volumes de la même collection, pour passer de l'un à l'autre. */
  memeCollection: { id: number; titre: string; volume: number | null }[]
}
export type FicheBibliotheque = FicheSort | FichePotion | FicheObjet | FicheArme | FicheArmure | FicheDon | FicheCompetence | FicheLivre""",
))

# ── 7. le cas 'livre' dans getFicheBibliotheque
edits.append((
    Q,
    """  if (categorie === 'potion') {""",
    """  if (categorie === 'livre') {
    const [livre] = await db.select().from(schema.gameBooks).where(eq(schema.gameBooks.id, id))
    if (!livre) return null
    // Même collection = même préfixe de slug avant le numéro de volume.
    const prefixe = livre.slug.replace(/-\\d+$/, '')
    const tous = await db.select({
      id: schema.gameBooks.id, titre: schema.gameBooks.titre,
      volume: schema.gameBooks.volume, slug: schema.gameBooks.slug,
    }).from(schema.gameBooks).orderBy(schema.gameBooks.ordre)
    return {
      categorie,
      livre,
      tailleAffichee: formatTaille(livre.tailleOctets),
      memeCollection: tous
        .filter(t => t.slug.replace(/-\\d+$/, '') === prefixe)
        .map(({ id, titre, volume }) => ({ id, titre, volume })),
    }
  }

  if (categorie === 'potion') {""",
))

# ── 8. le rayon dans le composant client
edits.append((
    C,
    "  { cle: 'competences', slug: 'competence', label: 'Compétences', icone: '🎓', filtreLabel: 'Toutes les caractéristiques' },\n]",
    "  { cle: 'competences', slug: 'competence', label: 'Compétences', icone: '🎓', filtreLabel: 'Toutes les caractéristiques' },\n  { cle: 'livres', slug: 'livre', label: 'Livres', icone: '📖' },\n]",
))

for chemin, ancien, _ in edits:
    src = io.open(chemin, encoding="utf-8").read()
    n = src.count(ancien)
    if n != 1:
        sys.exit(f"⛔ {chemin} : ancre trouvée {n} fois, attendu 1 — rien écrit\n   {ancien[:100]}…")

par_fichier: dict[str, str] = {}
for chemin, ancien, nouveau in edits:
    s = par_fichier.get(chemin) or io.open(chemin, encoding="utf-8").read()
    if s.count(ancien) != 1:
        sys.exit(f"⛔ {chemin} : ancre perdue en cours de route — rien écrit")
    par_fichier[chemin] = s.replace(ancien, nouveau)

for chemin, contenu in par_fichier.items():
    tmp = chemin + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="\n").write(contenu)
    os.replace(tmp, chemin)
    print(f"✓ {chemin}")

"""Branche la fiche LIVRE dans la page de fiche de la Bibliothèque.

Usage : uv run menage-references/p19-fiche-livre.py
"""
import io
import os
import sys

F = "src/app/bibliotheque/[categorie]/[id]/page.tsx"

EDITS = [
    (
        "import { getNomPersonnage } from '@/lib/queries/character'",
        "import { getNomPersonnage } from '@/lib/queries/character'\nimport { LecteurLivre } from '@/components/bibliotheque/LecteurLivre'",
    ),
    (
        "const SLUGS: RayonSlug[] = ['sort', 'potion', 'objet', 'arme', 'armure', 'don', 'competence']",
        "const SLUGS: RayonSlug[] = ['sort', 'potion', 'objet', 'arme', 'armure', 'don', 'competence', 'livre']",
    ),
    (
        "  competence: { icone: '🎓', rayon: 'Compétences' },\n}",
        "  competence: { icone: '🎓', rayon: 'Compétences' },\n  livre: { icone: '📖', rayon: 'Livres' },\n}",
    ),
    (
        "    case 'competence': return fiche.competence.nom\n  }\n}",
        "    case 'competence': return fiche.competence.nom\n    case 'livre': return fiche.livre.titre\n  }\n}",
    ),
    (
        "function Contenu({ fiche, qs }: { fiche: FicheBibliotheque; qs: string }) {\n  switch (fiche.categorie) {",
        """function Contenu({ fiche, qs }: { fiche: FicheBibliotheque; qs: string }) {
  switch (fiche.categorie) {
    case 'livre':
      return (
        <>
          <div className="space-y-2">
            {fiche.livre.volume !== null && <Row label="Volume">{fiche.livre.volume} de 4</Row>}
            {fiche.livre.tranche && <Row label="Entrées couvertes">{fiche.livre.tranche}</Row>}
            {fiche.livre.pages !== null && <Row label="Pages">{fiche.livre.pages}</Row>}
            {fiche.tailleAffichee && <Row label="Taille du fichier">{fiche.tailleAffichee}</Row>}
            <Row label="Langue">{fiche.livre.langue === 'en' ? 'Anglais' : 'Français'}</Row>
          </div>

          <LecteurLivre
            url={fiche.livre.url}
            titre={fiche.livre.titre}
            pages={fiche.livre.pages}
            qualiteRecherche={fiche.livre.qualiteRecherche}
            tauxOcr={fiche.livre.tauxOcr}
            tailleAffichee={fiche.tailleAffichee}
            enAnglais={fiche.livre.langue === 'en'}
          />

          <Description texte={fiche.livre.note} />

          {fiche.memeCollection.length > 1 && (
            <div className="mt-5 pt-4 border-t border-stone-800">
              <p className="text-stone-500 text-xs mb-2">Les autres volumes de la collection :</p>
              {fiche.memeCollection
                .filter(l => l.id !== fiche.livre.id)
                .map(l => (
                  <Link key={l.id} href={`/bibliotheque/livre/${l.id}${qs}`} className="block text-amber-300 hover:text-amber-200 text-sm py-0.5">
                    📖 {l.titre}
                  </Link>
                ))}
            </div>
          )}
        </>
      )""",
    ),
]

src = io.open(F, encoding="utf-8").read()
for ancien, _ in EDITS:
    n = src.count(ancien)
    if n != 1:
        sys.exit(f"⛔ ancre trouvée {n} fois, attendu 1 — rien écrit\n   {ancien[:100]}…")

for ancien, nouveau in EDITS:
    src = src.replace(ancien, nouveau)

tmp = F + ".tmp"
io.open(tmp, "w", encoding="utf-8", newline="\n").write(src)
os.replace(tmp, F)
print(f"✓ {F}")

# -*- coding: utf-8 -*-
"""Ajoute le 📖 (lien vers la Bibliothèque) aux sections Dons, Armure portée,
Équipement magique et Potions de la fiche de personnage.

Même geste que pour les armes : un petit livre à côté du nom, qui emporte la
provenance (?from=/personnage/<id>) pour que la fiche de la Bibliothèque
affiche son bouton « ← Retour à <personnage> ».
"""
import io, os

P = "src/app/personnage/[id]/page.tsx"

EDITS = [
 # ── DONS ──────────────────────────────────────────────────────────────────
 # Le lien n'apparaît que si la ligne EST une entrée du catalogue du Manuel, ou
 # y est rattachée. Les capacités de classe, traits raciaux et marqueurs de
 # progression qui vivent dans la même table n'ont pas de règles à ouvrir.
 ("""                      <div className="flex items-start gap-1.5">
                        <span className="text-stone-200 text-sm font-medium">{feat.nom}</span>
                        <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(feat.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="text-stone-700 hover:text-amber-400 transition-colors text-xs mt-0.5">🔍</a>""",
  """                      <div className="flex items-start gap-1.5">
                        <span className="text-stone-200 text-sm font-medium">{feat.nom}</span>
                        {/* Règles du don au Manuel. Seules les lignes qui sont une
                            entrée du catalogue (table 5-1) ou y sont rattachées en
                            portent un : la table `feats` tient aussi les capacités
                            de classe, les traits raciaux et les marqueurs de
                            progression des vieilles fiches. Voir drizzle/0008. */}
                        {ficheDonId !== null && (
                          <Link
                            href={`/bibliotheque/don/${ficheDonId}?from=/personnage/${id}`}
                            title="Lire les règles de ce don au Manuel"
                            className="text-stone-500 hover:text-amber-300 text-xs mt-0.5"
                          >
                            📖
                          </Link>
                        )}
                        <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(feat.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="text-stone-700 hover:text-amber-400 transition-colors text-xs mt-0.5">🔍</a>"""),

 ("""                  const manquants = featDef ? verifierPrerequisDon(featDef, donsNoms, bbaBase, absScores) : []
                  return (""",
  """                  const manquants = featDef ? verifierPrerequisDon(featDef, donsNoms, bbaBase, absScores) : []
                  const ficheDonId = feat.catalogueId ?? (feat.estCatalogue ? feat.id : null)
                  return ("""),

 # ── ARMURE PORTÉE ─────────────────────────────────────────────────────────
 ("""                  <div className="text-white font-semibold">
                    {a.nom}{charArmor.bonusMagique ? ` +${charArmor.bonusMagique}` : ''}
                  </div>""",
  """                  <div className="text-white font-semibold flex items-baseline gap-2">
                    <span>{a.nom}{charArmor.bonusMagique ? ` +${charArmor.bonusMagique}` : ''}</span>
                    <Link
                      href={`/bibliotheque/armure/${a.id}?from=/personnage/${id}`}
                      title="Lire la fiche de cette armure"
                      className="text-stone-500 hover:text-amber-300 text-xs font-normal"
                    >
                      📖
                    </Link>
                  </div>"""),

 # ── ÉQUIPEMENT MAGIQUE ────────────────────────────────────────────────────
 ("""                      <span className="text-purple-300 text-sm font-medium">{item.nom}</span>
                      <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(item.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="ml-1.5 text-stone-700 hover:text-amber-400 transition-colors text-xs">🔍</a>""",
  """                      <span className="text-purple-300 text-sm font-medium">{item.nom}</span>
                      <Link
                        href={`/bibliotheque/objet/${item.id}?from=/personnage/${id}`}
                        title="Lire la fiche de cet objet magique"
                        className="ml-1.5 text-stone-500 hover:text-amber-300 text-xs"
                      >
                        📖
                      </Link>
                      <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(item.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="ml-1.5 text-stone-700 hover:text-amber-400 transition-colors text-xs">🔍</a>"""),

 # ── POTIONS ───────────────────────────────────────────────────────────────
 ("""                      <span className="text-green-300 text-sm">{potion.nom}</span>""",
  """                      <span className="text-green-300 text-sm">{potion.nom}</span>
                      <Link
                        href={`/bibliotheque/potion/${potion.id}?from=/personnage/${id}`}
                        title="Lire la fiche de cette potion"
                        className="ml-1.5 text-stone-500 hover:text-amber-300 text-xs"
                      >
                        📖
                      </Link>"""),
]

s = io.open(P, encoding="utf-8").read()
for old, new in EDITS:
    n = s.count(old)
    assert n == 1, (n, old[:80])
    s = s.replace(old, new)
tmp = P + ".tmp"
io.open(tmp, "w", encoding="utf-8", newline="").write(s)
os.replace(tmp, P)
print("fiche : 4 liens 📖 ajoutés")

# -*- coding: utf-8 -*-
"""Mise à jour des deux aides après le lot « armes » du 2026-10-08."""
import io

C = "src/app/aide/creation/page.tsx"
J = "src/app/aide/joueur/page.tsx"

EDITS = [
 (C,
  "Il liste toutes les armes SRD (groupées par catégorie) et les armes personnalisées du personnage.",
  "Il liste les 78 armes de la table 7-5 du Manuel (groupées par catégorie) et les armes personnalisées du personnage."),

 (C,
  "<p>Le champ <strong>Nom</strong> de chaque arme est un menu déroulant contenant les 69 armes du SRD D&D 3.5, groupées par catégorie (Armes courantes / Armes de guerre / Armes exotiques).</p>",
  "<p>Le champ <strong>Nom</strong> de chaque arme est un menu déroulant contenant les <strong>78 armes de la table 7-5 du Manuel des Joueurs</strong>, sous leur <strong>nom officiel VF</strong>, groupées en quatre : <em>Armes courantes</em> (19) · <em>Armes de guerre</em> (35) · <em>Armes exotiques</em> (19) · <em>Munitions</em> (5).</p>\n          <Row label=\"Les noms sont ceux du livre\">Le menu portait jusqu&apos;au 8 octobre 2026 une ancienne traduction pour 25 entrées, et six valeurs fausses. Il est maintenant <strong>engendré à partir du même relevé</strong> que le catalogue publié à la Bibliothèque : <em>Hache de bataille</em> est devenue <em>Hache d&apos;armes</em>, <em>Ranseur</em> → <em>Corsèque</em>, <em>Glaive</em> → <em>Coutille</em>, <em>Grand gourdin</em> → <em>Massue</em>, <em>Lance longue</em> → <em>Pique</em>, <em>Masse légère/lourde</em> → <em>Masse d&apos;armes légère/lourde</em>, <em>Fléau</em> → <em>Fléau d&apos;armes léger</em>, <em>Sai</em> → <em>Saï</em>. Les anciens noms déjà inscrits sur une fiche n&apos;ont pas bougé : ils apparaissent dans le groupe <em>Personnalisées</em>.</Row>\n          <Row label=\"Modes de lancer\">Un cinquième groupe, <strong>Modes de lancer</strong>, offre la même arme du Manuel sous son autre mode d&apos;attaque : <em>Dague (lancée)</em>, <em>Lance (lancée)</em>, <em>Trident (lancé)</em>, <em>Gourdin (lancé)</em>, <em>Épieu (lancé)</em>, <em>Marteau léger (lancé)</em>, <em>Hache de lancer (lancée)</em>. Choisir le mode de lancer plutôt que l&apos;arme nue est ce qui fait calculer l&apos;attaque au <strong>BBA de projectiles</strong> et non au corps à corps.</Row>\n          <Tip>Le Manuel donne un facteur de portée à sept armes de <strong>contact</strong> — la dague se lance à 3 m, la lance à 6 m — sans qu&apos;elles cessent d&apos;être des armes de contact. C&apos;est pour cela que l&apos;entrée nue reste « Contact » et que le jet se calcule à la <strong>Force</strong>.</Tip>"),

 (C,
  "Choisissez une arme dans le menu déroulant. Les champs <strong>Dégâts</strong>, <strong>Critique</strong> et <strong>Type</strong> se remplissent automatiquement selon les statistiques officielles D&D 3.5.",
  "Choisissez une arme dans le menu déroulant. Les champs <strong>Dégâts</strong>, <strong>Critique</strong>, <strong>Type</strong> et <strong>Portée</strong> se remplissent avec les valeurs de la table 7-5. Les munitions n&apos;ont ni dégâts ni critique propres au livre : ces champs restent vides, c&apos;est l&apos;arme de tir qui les donne."),

 (J,
  "<Row label=\"Total d'attaque\">BAB + modificateur (FOR mêlée / DEX distance) + bonus magique de l'arme + bonus munitions + bonus de dons.</Row>",
  "<Row label=\"Total d'attaque\">BAB + modificateur (FOR mêlée / DEX distance) + bonus magique de l'arme + bonus munitions + bonus de dons.</Row>\n          <Row label=\"Mêlée ou distance ?\">C&apos;est la <strong>famille de l&apos;arme au Manuel</strong> qui le décide, pas son facteur de portée. Le livre donne une portée de jet à des armes de contact ordinaires — la dague à 3 m, la lance à 6 m : elles restent calculées à la <strong>Force</strong> et au BBA de corps à corps. Pour qu&apos;un jet compte comme un tir, la ligne doit désigner une arme à distance ou un <strong>mode de lancer</strong> (« Dague (lancée) »).</Row>"),
]

for path, old, new in EDITS:
    s = io.open(path, encoding="utf-8").read()
    n = s.count(old)
    assert n == 1, (path, n, old[:70])
    s = s.replace(old, new)
    tmp = path + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="").write(s)
    import os
    os.replace(tmp, path)
    print("ok", path, "<-", old[:50])

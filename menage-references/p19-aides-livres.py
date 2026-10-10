"""Documente le rayon LIVRES dans /aide/joueur et /aide/creation.

Règle de la maison : après chaque modification de fonctionnalité, les deux pages
d'aide. Une fonctionnalité non documentée n'existe pas pour les joueurs.

Usage : uv run menage-references/p19-aides-livres.py
"""
import io
import os
import sys

J = "src/app/aide/joueur/page.tsx"
C = "src/app/aide/creation/page.tsx"

ANCRE_J = """          <Row label="← Retour au personnage">Quand vous ouvrez une fiche de la Bibliothèque depuis un personnage"""

BLOC_J = """          <Row label="📖 Rayon Livres — l&apos;Encyclopedia Magica en entier">Les <strong>quatre volumes de l&apos;Encyclopedia Magica</strong> sont consultables page par page dans la Bibliothèque, et téléchargeables. Chaque fiche offre trois boutons : <strong>📖 Lire ici</strong> (le livre s&apos;ouvre dans la page), <strong>↗ Ouvrir dans un onglet</strong> et <strong>⬇ Télécharger</strong>, avec la taille du fichier annoncée. Le volume ne part <strong>qu&apos;au moment où vous l&apos;ouvrez</strong> : rien ne se télécharge en arrivant sur la fiche. Sur téléphone, préférez « ouvrir dans un onglet », les visionneuses intégrées y étant capricieuses.</Row>
          <Row label="🇬🇧 Ces quatre livres sont en anglais">C&apos;est le seul ouvrage du Grimoire qui ne soit pas en français — tout le reste de la Bibliothèque est traduit. L&apos;avertissement est en tête de chaque fiche de volume. L&apos;Encyclopedia Magica est un recueil d&apos;<strong>AD&amp;D 2<sup>e</sup> édition</strong> : ses objets ne sont pas des entrées de la 3.5, et leurs chiffres (notamment la « valeur en XP », qui n&apos;existe plus) ne se transposent pas tels quels.</Row>
          <Row label="🔍 Chercher dans un livre">La recherche se fait dans le lecteur lui-même : <strong>Ctrl+F</strong> (⌘F sur Mac), ou la loupe de sa barre d&apos;outils. Elle porte sur les <strong>400 pages d&apos;un coup</strong>. ⚠ Elle dépend de la qualité de la reconnaissance de caractères du volume, et chaque fiche l&apos;annonce avec son taux mesuré : <strong>fiable</strong> pour les volumes 1, 2 et 4, <strong>hors d&apos;usage</strong> pour le volume 3, dont le texte reconnu est trop abîmé (« charges » n&apos;y donne aucun résultat sur 417 pages). Ses <em>images</em> de pages sont nettes : il se lit normalement, c&apos;est seulement la recherche qui ne répond pas.</Row>
          <Tip>Le volume 3 est donc présent <strong>deux fois</strong>, et c&apos;est voulu. <em>Volume 3</em> a ses <strong>417 pages</strong> mais ne se cherche pas; <em>Volume 3 (copie partielle, P–R)</em> se cherche très bien mais n&apos;a que <strong>140 pages</strong> et s&apos;arrête au milieu des <em>Ring</em> — toute la section S y manque. Prenez la complète pour lire, la partielle pour chercher. Chaque fiche renvoie à l&apos;autre, et les deux disent ce qu&apos;elles valent.</Tip>
          <Row label="← Retour au personnage">Quand vous ouvrez une fiche de la Bibliothèque depuis un personnage"""

ANCRE_C = """          <Row label="📖 Du nom décoré à l&apos;arme du Manuel">"""

BLOC_C = """          <Row label="📖 Les livres sources, consultables en entier">Le rayon <strong>📖 Livres</strong> de la Grande Bibliothèque contient les quatre volumes de l&apos;<strong>Encyclopedia Magica</strong>, avec un lecteur et le téléchargement. ⚠ Ils sont <strong>en anglais</strong>, et ce sont des recueils d&apos;<strong>AD&amp;D 2<sup>e</sup> édition</strong> : un objet qu&apos;on y trouve n&apos;est pas une entrée de la 3.5. Plusieurs pièces de la campagne en viennent — le <em>Carquois de flèches</em> de Cormac, <em>Catspaw</em>, le <em>Disque Obsidien miroir</em> — et c&apos;est pourquoi aucun relevé dans les livres de la 3<sup>e</sup> édition ne les trouvait. Quand vous saisissez une de ces pièces, c&apos;est le MJ qui en donne l&apos;effet.</Row>
          <Row label="📖 Du nom décoré à l&apos;arme du Manuel">"""

EDITS = [(J, ANCRE_J, BLOC_J), (C, ANCRE_C, BLOC_C)]

for chemin, ancien, _ in EDITS:
    src = io.open(chemin, encoding="utf-8").read()
    n = src.count(ancien)
    if n != 1:
        sys.exit(f"⛔ {chemin} : ancre trouvée {n} fois, attendu 1 — rien écrit")

for chemin, ancien, nouveau in EDITS:
    src = io.open(chemin, encoding="utf-8").read()
    tmp = chemin + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="\n").write(src.replace(ancien, nouveau))
    os.replace(tmp, chemin)
    print(f"✓ {chemin}")

"""Corrige les passages des AIDES que le non-cumul des munitions rend faux.

Leçon payée deux fois les 9 et 10 octobre : corriger une donnée périme la prose
qui décrivait l'ancien comportement, et une page d'aide est lue à la table COMME
une règle. On cherche donc l'ANCIEN discours, jamais le nouveau.

Le pire des passages est dans /aide/creation : « cumulable avec le bonus de
l'arc » — exactement ce que le livre interdit.

Le script refuse d'écrire si un seul des passages attendus a changé.

Usage : uv run menage-references/p18-aides-munitions.py
"""
import io
import os
import sys

REMPLACEMENTS = [
    # ── /aide/joueur
    (
        "src/app/aide/joueur/page.tsx",
        "<Row label=\"Total d'attaque\">BAB + modificateur (FOR mêlée / DEX distance) + bonus magique de l'arme + bonus munitions + bonus de dons.</Row>",
        "<Row label=\"Total d'attaque\">BAB + modificateur (FOR mêlée / DEX distance) + bonus d'altération + bonus de dons. ⚠ Le bonus d'altération, c'est <strong>le meilleur</strong> du bonus de l'arme et de celui des munitions, jamais la somme des deux.</Row>",
    ),
    (
        "src/app/aide/joueur/page.tsx",
        "<Row label=\"Total de dégâts\">Dés de base + bonus magique de l'arme + bonus munitions + FOR (mêlée ou arc composite, plafonné à la côte) + bonus de dons.</Row>",
        "<Row label=\"Total de dégâts\">Dés de base + bonus d'altération (le meilleur de l'arme ou des munitions) + FOR (mêlée ou arc composite, plafonné à la côte) + bonus de dons.</Row>",
    ),
    (
        "src/app/aide/joueur/page.tsx",
        "<p>Les flèches magiques (flèches +1, +2, etc.) s'ajoutent <strong>à la fois à l'attaque et aux dégâts</strong>. Elles apparaissent dans le détail sous l'étiquette <span className=\"font-mono text-stone-300\">fl.</span>. Il n'est pas nécessaire de créer une entrée d'arme séparée pour les flèches — le champ <strong>Munitions +Mag</strong> dans le formulaire suffit.</p>",
        "<p>Les flèches magiques (flèches +1, +2, etc.) s'ajoutent <strong>à la fois à l'attaque et aux dégâts</strong>, sous l'étiquette <span className=\"font-mono text-stone-300\">munitions magiques</span> du détail. Il n'est pas nécessaire de créer une entrée d'arme séparée pour les flèches — le champ <strong>Munitions +Mag</strong> du formulaire suffit.</p>\n          <p>⚠ <strong>Leur bonus ne se cumule pas avec celui de l'arc.</strong> Le livre est net : « le bonus d'altération d'une arme à projectiles ne se cumule pas avec le bonus d'altération de ses munitions ; on ne tient compte que de la plus haute des deux valeurs ». Un arc +1 et des flèches +2 donnent <strong>+2, pas +3</strong>, et le détail affiche le perdant <strong>barré</strong> avec son motif — comme pour la classe d'armure.</p>\n          <p>L'arc magique n'y perd pas tout : une munition tirée d'une arme à +1 ou plus compte comme <strong>magique</strong> pour ignorer la réduction des dégâts, et une munition tirée d'une arme alignée en reçoit l'alignement. Le bonus ne se cumule pas ; la qualité magique, oui.</p>\n          <p>⚠ Une munition magique est <strong>détruite</strong> quand elle touche, et a 50 % de chances d'être perdue quand elle rate.</p>",
    ),
    (
        "src/app/aide/joueur/page.tsx",
        "+ FOR ou DEX + arme magique + munitions magiques + dons (Arme de prédilection, Tir à bout portant…).</Row>",
        "+ FOR ou DEX + bonus d'altération + dons (Arme de prédilection, Tir à bout portant…). Entre l'arme et ses munitions, seul <strong>le meilleur</strong> des deux bonus compte : l'autre apparaît <strong>barré</strong> dans le détail, avec la raison.</Row>",
    ),
    # ── /aide/creation : le passage franchement faux
    (
        "src/app/aide/creation/page.tsx",
        "<Row label=\"Munitions +Mag\">Bonus d'enchantement des flèches ou carreaux utilisés. S'ajoute à l'attaque ET aux dégâts, cumulable avec le bonus de l'arc. Pas besoin de créer une arme séparée pour les flèches.</Row>",
        "<Row label=\"Munitions +Mag\">Bonus d'altération des flèches ou carreaux utilisés. S'ajoute à l'attaque ET aux dégâts. Pas besoin de créer une arme séparée pour les flèches. ⚠ <strong>Il ne se cumule pas avec le bonus de l'arc</strong> : la fiche garde le meilleur des deux et barre l'autre, comme le livre l'impose.</Row>",
    ),
    (
        "src/app/aide/creation/page.tsx",
        "<Row label=\"Exemple\">Flèches +2 → entrez <strong>Munitions +Mag = 2</strong>. Le détail affichera <span className=\"font-mono text-stone-300\">fl. +2</span> dans la décomposition.</Row>",
        "<Row label=\"Exemple\">Flèches +2 sur un arc +1 → entrez <strong>Munitions +Mag = 2</strong>. Le détail affichera <span className=\"font-mono text-stone-300\">munitions magiques +2</span>, et l'<span className=\"font-mono text-stone-300\">arme magique +1</span> barrée en dessous : « ne se cumule pas, les munitions +2 l'emportent ». Le total d'altération est <strong>+2</strong>.</Row>",
    ),
    # ── l'infobulle du formulaire disait la même chose
    (
        "src/components/creation/CharacterForm.tsx",
        'title="Flèches +1, bolts +2, etc. S\'ajoute à l\'attaque ET aux dégâts."',
        'title="Flèches +1, carreaux +2, etc. S\'ajoute à l\'attaque ET aux dégâts — mais ne se cumule pas avec le bonus de l\'arme : la fiche garde le meilleur des deux."',
    ),
]

# Vérification d'abord, écriture ensuite : aucun fichier à moitié corrigé.
for chemin, ancien, _ in REMPLACEMENTS:
    src = io.open(chemin, encoding="utf-8").read()
    n = src.count(ancien)
    if n != 1:
        sys.exit(f"⛔ {chemin} : passage trouvé {n} fois, attendu 1 — rien écrit\n   {ancien[:90]}…")

par_fichier: dict[str, str] = {}
for chemin, ancien, nouveau in REMPLACEMENTS:
    s = par_fichier.get(chemin) or io.open(chemin, encoding="utf-8").read()
    par_fichier[chemin] = s.replace(ancien, nouveau)

for chemin, contenu in par_fichier.items():
    tmp = chemin + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="\n").write(contenu)
    os.replace(tmp, chemin)
    print(f"✓ {chemin}")

# Contrôle élargi : on cherche l'ancien discours sur un motif PLUS LARGE que
# celui qu'on vient de corriger, et dans tout src/.
import re
import subprocess

MOTIFS = [
    r"cumulable avec le bonus de l'arc",
    r"fl\. \+",
    r"bonus munitions",
    r"munitions.{0,40}cumul(?!.{0,40}pas)",
]
print("\nContrôle — l'ancien discours subsiste-t-il ailleurs dans src/ ?")
reste = 0
for racine, _, fichiers in os.walk("src"):
    for f in fichiers:
        if not f.endswith((".ts", ".tsx")):
            continue
        p = os.path.join(racine, f)
        t = io.open(p, encoding="utf-8").read()
        for m in MOTIFS:
            for trouve in re.finditer(m, t):
                reste += 1
                print(f"  ⚠ {p} : …{t[max(0, trouve.start()-60):trouve.end()+60]}…")
print(f"  → {reste} occurrence(s)")

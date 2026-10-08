# -*- coding: utf-8 -*-
"""Suite : les comptes de rattachement et la liste des lignes sans 📖."""
import io, os

C = "src/app/aide/creation/page.tsx"
J = "src/app/aide/joueur/page.tsx"

EDITS = [
 (J,
  "<strong>108</strong> des 158 lignes d&apos;équipement des personnages sont ainsi rattachées à l&apos;arme du Manuel qu&apos;elles désignent.",
  "<strong>118</strong> des 158 lignes d&apos;équipement des personnages sont ainsi rattachées à l&apos;arme du Manuel qu&apos;elles désignent — <strong>128</strong> lignes d&apos;arme chez 55 personnages portent le 📖."),

 (J,
  "les attaques de créature (griffe ou gueule d&apos;un compagnon animal), les pouvoirs surnaturels, les armes venues d&apos;un supplément que le Grimoire n&apos;a pas relevé (katana, khopesh, lame elfique) et les notes de fiche n&apos;ont pas d&apos;entrée au catalogue du Manuel.",
  "les attaques de créature (griffe ou gueule d&apos;un compagnon animal), les pouvoirs surnaturels, les armes venues d&apos;un supplément que le Grimoire n&apos;a pas relevé (katana, khopesh, sabre, arquebuse) et les notes de fiche n&apos;ont pas d&apos;entrée au catalogue du Manuel. Il en reste <strong>40</strong>."),

 (C,
  "<Tip>Rien n&apos;est deviné. Une ligne trop imprécise pour être identifiée — « Arc » sans dégâts, « Arbalette +1 (20 carreaux) » — reste sans 📖 plutôt que de pointer vers la mauvaise arme. En nommant une arme dans l&apos;orthographe du rayon Armes, vous lui donnez son lien du premier coup.</Tip>",
  "<Tip>Rien n&apos;est deviné. Une ligne trop imprécise pour être identifiée — « Arc » sans dégâts, « Arbalette +1 (20 carreaux) » — reste sans 📖 plutôt que de pointer vers la mauvaise arme. En nommant une arme dans l&apos;orthographe du rayon Armes, vous lui donnez son lien du premier coup.</Tip>\n          <Row label=\"Quand le dé tranche contre le nom\">Dix lignes ont demandé un arbitrage, et le <strong>dé</strong> l&apos;a emporté sur le nom à chaque fois : « Hache de guerre +1 (focus) » fait <strong>1d8</strong> — c&apos;est la <em>hache d&apos;armes</em> (arme de guerre), pas la <em>hache de guerre naine</em> qui fait 1d10 et demande le maniement d&apos;une arme exotique. « Arbalette de ___ » fait 1d4 : l&apos;<em>arbalète de poing</em>. « Fléchettes » fait 1d4 chez un moine sans arbalète : le <em>Dard</em>. Le reste de l&apos;inventaire du personnage, sa classe et sa race servent de contrôle — un rattachement seulement « probable » fabriquerait une illégalité de personnage.</Row>"),
]

for path, old, new in EDITS:
    s = io.open(path, encoding="utf-8").read()
    n = s.count(old)
    assert n == 1, (path, n, old[:70])
    s = s.replace(old, new)
    tmp = path + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="").write(s)
    os.replace(tmp, path)
    print("ok", path)

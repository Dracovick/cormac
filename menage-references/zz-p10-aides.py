# -*- coding: utf-8 -*-
"""Aides joueur et création : le catalogue des dons et les quatre liens 📖."""
import io, os

J = "src/app/aide/joueur/page.tsx"
C = "src/app/aide/creation/page.tsx"

EDITS = [
 (J,
  """          <Row label=\"⚔️ Rayon Armes — le catalogue du Manuel\">""",
  """          <Row label=\"🏅 Rayon Dons — le catalogue du Manuel\">Les <strong>109 dons</strong> de la <strong>table 5-1</strong> du Manuel des Joueurs : les 92 dons généraux, les 8 dons de création d&apos;objets et les 9 dons de métamagie, chacun avec sa <strong>catégorie</strong>, ses <strong>conditions</strong> et son <strong>avantage</strong>, dans les mots du livre.</Row>
          <Tip>Le rayon ne montre que le catalogue. Les lignes inscrites sur les fiches de personnages restent sur leurs fiches : la table des dons du Grimoire porte aussi, depuis l&apos;import des vieilles fiches, des <strong>capacités de classe</strong> (attaque sournoise, imposition des mains), des <strong>traits raciaux</strong> (vision nocturne), des <strong>pouvoirs de créature</strong> et des <strong>marqueurs</strong> (« DON Niv 1 ») — vrais sur une fiche, mais ce ne sont pas des dons.</Tip>
          <Row label=\"⚔️ Rayon Armes — le catalogue du Manuel\">"""),

 (J,
  """          <Row label=\"← Retour au personnage\">Quand vous ouvrez une fiche de la Bibliothèque depuis un personnage (le <strong>📖</strong> d&apos;une arme),""",
  """          <Row label=\"📖 Depuis la fiche de personnage\">Le petit <strong>📖</strong> ne sert plus qu&apos;aux armes : il est aussi au bout de chaque <strong>don</strong>, de chaque <strong>armure portée</strong>, de chaque <strong>objet magique</strong> et de chaque <strong>potion</strong>. Il ouvre la fiche de la Bibliothèque correspondante, et le bouton de retour vous ramène au personnage.</Row>
          <Tip>Sur les dons, le 📖 n&apos;apparaît que là où la ligne est bien un don du Manuel. « Attaque sournoise 7d6 », « DON Niv 1 » ou « Vision nocturne » n&apos;en portent pas : ce sont des capacités de classe, des marqueurs ou des traits raciaux, qui n&apos;ont pas de fiche de don à ouvrir. Les lignes en anglais ou abrégées (« Weapon focus (dagger) ») n&apos;en portent pas encore — leur rattachement au don du Manuel attend une décision du MJ.</Tip>
          <Row label=\"← Retour au personnage\">Quand vous ouvrez une fiche de la Bibliothèque depuis un personnage (le <strong>📖</strong> d&apos;une arme, d&apos;un don, d&apos;une armure, d&apos;un objet ou d&apos;une potion),"""),

 (C,
  """          <Tip>Les dons d'arme (ex. Arme de prédilection) peuvent être pris plusieurs fois avec des armes différentes — ils ne se grisent donc pas après sélection.</Tip>""",
  """          <Tip>Les dons d'arme (ex. Arme de prédilection) peuvent être pris plusieurs fois avec des armes différentes — ils ne se grisent donc pas après sélection.</Tip>
          <Row label=\"⚠️ La parenthèse est une donnée\">Dans <span className=\"font-mono text-xs\">Arme de prédilection (arc long composite)</span>, la parenthèse n&apos;est pas une décoration : c&apos;est elle qui dit au Grimoire à quelle arme appliquer le +1. Elle doit reprendre le nom de l&apos;arme tel qu&apos;il figure sur la fiche (la casse et les accents sont ignorés). Un don d&apos;arme sans parenthèse ne s&apos;applique à rien.</Row>"""),
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

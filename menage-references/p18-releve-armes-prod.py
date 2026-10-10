"""Relève le BLOC ARMES tel que la PRODUCTION l'affiche — écran ET papier.

Le total vient de la page elle-même, jamais d'un recalcul de mon côté : sinon
je validerais ma formule par ma formule.

Deux relevés par personnage :
  · écran  (/personnage/N)          → les panneaux « Attaque — … » et « Dégâts — … »
  · papier (/personnage/N/imprimer) → les cellules du tableau ARMES

Les TÉMOINS portent des armes sans aucun bonus (ni magie, ni munitions, ni don,
ni côte de Force) : leurs lignes ne doivent pas bouger d'un point. Un rapport
où tout est « comme prévu » sans témoin ne prouve rien.

Usage : uv run --with requests menage-references/p18-releve-armes-prod.py [--url URL]
"""
import html
import re
import sys
import urllib.request

# Les 8 personnages dont le papier divergeait de l'écran (p18-diag-munitions).
PORTEURS = [1, 3, 4, 5, 20, 21, 82, 86]
# Témoins : armes sans bonus d'aucune sorte. Leurs lignes doivent rester identiques.
TEMOINS = [6, 22]

BASE = "https://www.dracovick.com"
if "--url" in sys.argv:
    BASE = sys.argv[sys.argv.index("--url") + 1]


def page(path: str) -> str:
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Cookie": "cormac_auth=granted", "User-Agent": "dracovick-releve"},
    )
    with urllib.request.urlopen(req) as r:
        return r.read().decode("utf-8", "replace")


# ── Écran : le flux RSC échappe les guillemets.
#    \"titre\":\"Attaque — Arc long composite (Force +3) +1\",\"total\":\"+13 / +8\"
RE_ECRAN = re.compile(
    r'titre\\":\\"(Attaque|Dégâts) — (.*?)\\"(.*?)\\"total\\":\\"(.*?)\\"'
)


def releve_ecran(pid: int) -> list[str]:
    h = page(f"/personnage/{pid}")
    out = []
    for quoi, nom, _entre, total in RE_ECRAN.findall(h):
        out.append(f"{quoi:8} {nom:52} {total}")
    return out


# ── Papier : on découpe le tableau ARMES et on lit ses cellules.
RE_BALISE = re.compile(r"<[^>]+>")


def releve_papier(pid: int) -> list[str]:
    h = page(f"/personnage/{pid}/imprimer")
    i = h.find("Bonus Att.")
    if i < 0:
        return ["⛔ tableau ARMES introuvable"]
    j = h.find("</table>", i)
    bloc = h[i:j]
    lignes = []
    for tr in re.split(r"<tr", bloc)[1:]:
        cells = [
            html.unescape(RE_BALISE.sub("", c)).strip()
            for c in re.split(r"<td", tr)[1:]
        ]
        cells = [c for c in cells]
        # une ligne d'arme a un nom non vide en première cellule
        if cells and cells[0] and cells[0] not in ("Armes",):
            lignes.append(" | ".join(cells))
    return lignes


for pid in PORTEURS + TEMOINS:
    marque = "TÉMOIN " if pid in TEMOINS else ""
    print(f"\n──── #{pid} {marque}" + "─" * 40)
    print("  ÉCRAN")
    for l in releve_ecran(pid):
        print(f"    {l}")
    print("  PAPIER")
    for l in releve_papier(pid):
        print(f"    {l}")

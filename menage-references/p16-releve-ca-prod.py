"""Relève la CLASSE D'ARMURE telle que la PRODUCTION la calcule.

Lit le flux de rendu de chaque fiche et en extrait le panneau « Classe
d'armure » : le total et chacune de ses lignes. Le total vient du panneau
lui-même, pas d'un recalcul de mon côté — sinon je validerais ma formule par
ma formule.

Les 3 TÉMOINS ne portent aucun objet à bonus : leur CA ne doit pas bouger d'un
point. Un rapport où tout est « comme prévu » sans témoin ne prouve rien.

Usage : uv run --with requests menage-references/p16-releve-ca-prod.py [--url URL]
"""
import json
import re
import sys
import urllib.request

PORTEURS = [1, 3, 4, 43, 47, 56, 82, 86]
# Témoins : portent des objets magiques, mais aucun à bonus non nul.
# #61 et #39 ont en plus des champs `naturelle`/`divers` saisis, qui passent
# désormais par l'arbitrage — leur CA ne doit pas bouger pour autant.
TEMOINS = [58, 39, 61]
BASE = "https://www.dracovick.com"
if "--url" in sys.argv:
    BASE = sys.argv[sys.argv.index("--url") + 1]


def page(pid: int) -> str:
    req = urllib.request.Request(
        f"{BASE}/personnage/{pid}",
        headers={"Cookie": "cormac_auth=granted", "User-Agent": "dracovick-releve"},
    )
    with urllib.request.urlopen(req) as r:
        return r.read().decode("utf-8", "replace")


# Le flux RSC échappe les guillemets : \"titre\":\"Classe d'armure\",\"base\":10,\"total\":21,\"lignes\":[...]
RE_PANNEAU = re.compile(
    r'titre\\":\\"Classe d\'armure\\",\\"base\\":10,\\"total\\":(-?\d+),\\"lignes\\":(\[.*?\]),\\"children'
)
RE_NOM = re.compile(r'<title>([^<]*)</title>')


def releve(pid: int, temoin: bool) -> str:
    h = page(pid)
    m = RE_PANNEAU.search(h)
    if not m:
        return f"#{pid:<4}{'TÉMOIN ' if temoin else ''}⛔ panneau « Classe d'armure » introuvable"
    total = int(m.group(1))
    # Le bloc de lignes est du JSON une fois les échappements du flux retirés
    brut = m.group(2).replace('\\"', '"').replace("\\\\", "\\")
    try:
        lignes = json.loads(brut)
        detail = " · ".join(
            f"{l['label']} {l['valeur']:+d}" + ("[écarté]" if l.get("ecarte") else "")
            for l in lignes
        )
    except Exception as e:  # on rapporte l'échec, on ne le masque pas
        detail = f"(lignes illisibles : {e}) {brut[:200]}"
    return f"#{pid:<4}{'TÉMOIN ' if temoin else ''}CA={total:<4} {detail}"


print(f"=== Relevé de la CA en production ({BASE}) ===\n")
for pid in PORTEURS:
    print(releve(pid, False))
print()
for pid in TEMOINS:
    print(releve(pid, True))

"""Relève en PRODUCTION l'attaque et les dégâts de CHAQUE ligne d'arme.

À lancer deux fois : une fois AVANT le déploiement (code d'hier), une fois
APRÈS. Le choix FOR/DEX arrive avec sa colonne vide sur les 198 lignes, donc
la livraison doit être parfaitement neutre : 0 écart attendu, sur toutes les
fiches, pas seulement sur celles qui portent le don.

⛔ On balaie les 74 fiches et non les 7 porteuses : un relevé calqué sur son
hypothèse annonce toujours « rien n'a bougé ».

Le total vient de la page, jamais d'un recalcul de mon côté.

Usage :
  uv run --with requests menage-references/zz-draco-choix-finesse-prod.py avant.json
  uv run --with requests menage-references/zz-draco-choix-finesse-prod.py apres.json --compare avant.json
"""
import json
import re
import sys
import urllib.request

BASE = "https://www.dracovick.com"
RE_ECRAN = re.compile(r'titre\\":\\"(Attaque|Dégâts) — (.*?)\\"(.*?)\\"total\\":\\"(.*?)\\"')


def page(path: str) -> str:
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Cookie": "cormac_auth=granted", "User-Agent": "dracovick-releve"},
    )
    with urllib.request.urlopen(req) as r:
        return r.read().decode("utf-8", "replace")


def releve(fiche_id: int) -> dict:
    try:
        h = page(f"/personnage/{fiche_id}")
    except Exception as e:  # une fiche supprimée n'est pas un échec de mesure
        return {"__erreur__": str(e)}
    out = {}
    for quoi, arme, _, total in RE_ECRAN.findall(h):
        out[f"{quoi} — {arme}"] = total
    return out


sortie = sys.argv[1]
ids = list(range(1, 110))
tout = {}
lignes = 0
for i in ids:
    r = releve(i)
    if r and "__erreur__" not in r:
        tout[str(i)] = r
        lignes += len(r)
print(f"{len(tout)} fiches lues, {lignes} panneaux relevés (attaque + dégâts)")
json.dump(tout, open(sortie, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

if "--compare" in sys.argv:
    avant = json.load(open(sys.argv[sys.argv.index("--compare") + 1], encoding="utf-8"))
    ecarts = 0
    communs = 0
    for fid, panneaux in tout.items():
        anciens = avant.get(fid, {})
        for cle, val in panneaux.items():
            if cle in anciens:
                communs += 1
                if anciens[cle] != val:
                    ecarts += 1
                    print(f"  ≠ [{fid}] {cle} : {anciens[cle]} → {val}")
            else:
                print(f"  + [{fid}] {cle} = {val} (absent du relevé d'avant)")
        for cle in anciens:
            if cle not in panneaux:
                print(f"  − [{fid}] {cle} = {anciens[cle]} (disparu)")
    # Le nombre de panneaux comparés est publié AVEC le verdict : sans lui,
    # « 0 écart » est aussi ce que rend une comparaison sur l'ensemble vide.
    print(f"\n{communs} panneaux comparés · {ecarts} écarts")

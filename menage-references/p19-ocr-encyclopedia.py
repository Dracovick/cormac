"""Mesure la QUALITÉ DE LA COUCHE TEXTE des 4 volumes de l'Encyclopedia Magica.

C'est elle qui décide si la recherche dans le lecteur sera utile ou décorative :
un PDF scanné sans OCR exploitable ne se cherche pas, quel que soit le lecteur.
Les quatre fichiers portent « Creator: FineReader » — ils ONT été passés à l'OCR,
mais la qualité n'est pas la même partout.

Deux mesures, parce qu'un taux seul peut mentir :

1. TAUX DE MOTS NETS — part des tokens contenant au moins une lettre qui sont
   des suites purement alphabétiques de 3 lettres ou plus. Les tokens purement
   numériques sont exclus du dénominateur : « 19 », « 5,000 », « 1d4 » ne sont
   pas du bruit d'OCR, et les compter en faisait chuter le taux à tort.

2. ÉPREUVE DE RECHERCHE — on cherche vraiment, dans le volume entier, des mots
   qui DOIVENT y être. C'est la seule mesure qui répond à la question posée :
   « est-ce que la recherche trouvera ? » Un témoin : « Arrow Storing », le
   carquois de Cormac, qui est à l'entrée Quiver du volume 3.

⛔ Ce script n'extrait pas le texte des livres sur disque : il lit en mémoire
pour mesurer, et n'écrit que des compteurs.

Usage : uv run menage-references/p19-ocr-encyclopedia.py
"""
import re
import subprocess
from pathlib import Path

DOSSIER = Path("Livres de jeu en PDF")
VOLUMES = [
    ("Volume 1", "Encyclopedia Magica Volume 1.pdf"),
    ("Volume 2", "Encyclopedia Magica Volume 2 D-P.pdf"),
    ("Volume 3", "Encyclopedia Magica Volume 3.pdf"),
    ("Volume 4", "Encyclopedia Magica Volume 4.pdf"),
]
ECHANTILLON = [20, 60, 100, 140, 180, 220, 260, 300, 340, 380]

# Mots qui doivent se trouver dans n'importe quel volume de la série.
TEMOINS_COMMUNS = ["magic", "value", "charges"]
# Mots propres à un volume — le carquois de Cormac est à l'entrée Quiver.
TEMOINS_PROPRES = {
    "Volume 1": ["Amulet", "Bracers"],
    "Volume 2": ["Elixir", "Potion"],
    "Volume 3": ["Quiver", "Arrow Storing", "Ring"],
    "Volume 4": ["Staff", "Wand"],
}

RE_TOKEN = re.compile(r"\S+")
RE_A_UNE_LETTRE = re.compile(r"[A-Za-z]")
RE_MOT_NET = re.compile(r"^[A-Za-z]{3,}[.,;:!?)\"']?$")


def pdfinfo_pages(pdf: Path) -> int:
    out = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True, errors="replace")
    m = re.search(r"^Pages:\s+(\d+)", out.stdout, re.M)
    return int(m.group(1)) if m else 0


def texte(pdf: Path, premiere: int | None = None, derniere: int | None = None) -> str:
    cmd = ["pdftotext"]
    if premiere:
        cmd += ["-f", str(premiere), "-l", str(derniere or premiere)]
    cmd += [str(pdf), "-"]
    out = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
    return out.stdout


for label, nom in VOLUMES:
    pdf = DOSSIER / nom
    if not pdf.exists():
        print(f"⛔ {nom} introuvable")
        continue
    n = pdfinfo_pages(pdf)

    # ── 1. taux de mots nets sur l'échantillon
    alpha = nets = cars = vides = 0
    extrait = ""
    for p in ECHANTILLON:
        if p > n:
            continue
        t = texte(pdf, p)
        toks = RE_TOKEN.findall(t)
        if len(toks) < 5:
            vides += 1
        cars += len(t)
        for tok in toks:
            if RE_A_UNE_LETTRE.search(tok):
                alpha += 1
                if RE_MOT_NET.match(tok):
                    nets += 1
        if not extrait and len(toks) > 30:
            extrait = " ".join(toks[:24])
    taux = 100 * nets / alpha if alpha else 0

    # ── 2. épreuve de recherche sur le VOLUME ENTIER
    tout = texte(pdf).lower()
    resultats = []
    for mot in TEMOINS_COMMUNS + TEMOINS_PROPRES.get(label, []):
        occ = tout.count(mot.lower())
        resultats.append(f"« {mot} » {occ}×" if occ else f"« {mot} » ⛔ 0")
    trouves = sum(1 for r in resultats if "⛔" not in r)
    attendus = len(resultats)

    verdict = (
        "recherche fiable" if taux >= 60 and trouves == attendus
        else "recherche partielle" if trouves >= attendus - 1
        else "RECHERCHE INUTILISABLE"
    )
    print(f"\n── {label} — {nom}")
    print(f"   {n} pages · {cars // max(1, len(ECHANTILLON))} car./page · {vides} page(s) sans texte / {len(ECHANTILLON)}")
    print(f"   mots nets : {nets}/{alpha} = {taux:.0f} %")
    print(f"   témoins   : {trouves}/{attendus} trouvés — {', '.join(resultats)}")
    print(f"   → {verdict}")
    print(f"   extrait : {extrait[:200]}")

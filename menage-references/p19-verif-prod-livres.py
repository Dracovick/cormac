"""Vérifie EN PRODUCTION le rayon Livres : les fiches, le lecteur, les fichiers.

Chaque point est mesuré sur la page servie, pas déduit du code. Un TÉMOIN est
dans le test : une fiche de sort, qui ne doit porter AUCUN élément du lecteur.
Un contrôle qui ne sait pas distinguer est un contrôle aveugle (leçon du
2026-10-08, où un balayage « parfait » ne détectait rien du tout).

Usage : uv run --with requests menage-references/p19-verif-prod-livres.py [--url URL]
"""
import json
import re
import sys
import urllib.request
import urllib.error

BASE = "https://www.dracovick.com"
if "--url" in sys.argv:
    BASE = sys.argv[sys.argv.index("--url") + 1]

ENTETES = {"Cookie": "cormac_auth=granted", "User-Agent": "dracovick-verif"}


def get(path: str) -> tuple[int, str]:
    req = urllib.request.Request(path if path.startswith("http") else BASE + path, headers=ENTETES)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""


def tete(url: str) -> tuple[int, dict]:
    req = urllib.request.Request(url, headers=ENTETES, method="HEAD")
    try:
        with urllib.request.urlopen(req) as r:
            # ⚠ clés en MINUSCULES : dict(r.headers) garde « Content-Length » tel
            # quel, et un .get("content-length") rendait 0 — le contrôle accusait
            # alors le Blob de servir un fichier vide alors que curl voyait bien
            # ses 14 Mo. Le faux négatif venait du test, pas du site.
            return r.status, {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, {}


echecs = 0


def verifie(titre: str, ok: bool, detail: str = ""):
    global echecs
    if not ok:
        echecs += 1
    print(f"  {'OK ' if ok else 'ECHEC'} {titre}{(' — ' + detail) if detail else ''}")


# ── 1. Le rayon apparaît dans la Bibliothèque
st, h = get("/bibliotheque")
verifie("GET /bibliotheque", st == 200, f"HTTP {st}")
verifie("le rayon « Livres » est dans la page", "Livres" in h and "\\ud83d\\udcd6" in h or "📖" in h)
for v in range(1, 5):
    verifie(f"le volume {v} est dans l'index", f"Volume {v}" in h)
# ⛔ La copie partielle du volume 3 a été retirée le 2026-10-10, le volume
# complet ayant été réparé (décision d'André). Le contrôle s'inverse : sa
# présence serait désormais l'anomalie.
verifie("la copie partielle a bien QUITTÉ l'index", "copie partielle" not in h)
verifie("l'index annonce la langue", "en anglais" in h)

# ── 2. Chaque fiche de livre répond et porte ce qu'il faut
#    (les ids viennent de la page d'index : on les lit, on ne les suppose pas)
# La Bibliothèque est un composant client : elle ne rend en HTML que le rayon
# actif (les sorts par défaut). Les livres sont bien dans l'index envoyé au
# navigateur, mais sous forme de données, pas de liens — on lit donc les ids
# dans le flux, pas dans le HTML rendu. Chercher "/bibliotheque/livre/N" dans
# la page donnait 0 et accusait le site a tort.
ids = sorted(set(
    int(m) for m in re.findall(
        r'\\"id\\":(\d+),\\"nom\\":\\"Encyclopedia Magica', h)
))
verifie("les 4 volumes sont dans l'index envoyé au navigateur", len(ids) == 4,
        f"{len(ids)} trouvé(s) : {ids}")

urls_pdf: dict[int, str] = {}
for i in ids:
    st, f = get(f"/bibliotheque/livre/{i}")
    nom = (re.search(r"<title>([^<]*)</title>", f) or [None, "?"])[1]
    verifie(f"fiche /livre/{i} ({nom})", st == 200, f"HTTP {st}")
    if st != 200:
        continue
    verifie(f"  …annonce l'anglais", "en anglais" in f or "est en anglais" in f)
    verifie(f"  …offre les trois boutons", "Lire ici" in f and "Ouvrir dans un onglet" in f and "Télécharger" in f)
    verifie(f"  …dit ce que vaut la recherche", "recherche" in f.lower())
    m = re.search(r'https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/livres/[a-z0-9-]+\.pdf(\?v=[a-f0-9]+)?', f)
    verifie(f"  …porte l'adresse de son PDF", m is not None)
    if m:
        urls_pdf[i] = m.group(0)
        verifie(f"  …avec son paramètre de version (?v=)", "?v=" in m.group(0),
                m.group(0).split("/livres/")[-1])

# ── 3. Les fichiers eux-mêmes sont servis
for i, u in urls_pdf.items():
    st, head = tete(u)
    taille = int(head.get("content-length", 0))
    ctype = head.get("content-type", "")
    verifie(f"le PDF de /livre/{i} est servi", st == 200 and taille > 1_000_000,
            f"HTTP {st}, {taille / 1024 / 1024:.1f} Mo, {ctype}")
    # le bouton Télécharger ajoute ?download=1 : le fichier doit arriver en pièce jointe
    st2, head2 = tete(u + ("&download=1" if "?" in u else "?download=1"))
    dispo = head2.get("content-disposition", "")
    verifie(f"  …et ?download=1 le donne en téléchargement", "attachment" in dispo.lower(),
            f"HTTP {st2}, content-disposition: {dispo or '(absent)'}")

# ── 3 bis. Le volume 3 réparé : sa fiche doit annoncer une recherche qui marche
#    et non plus l'avertissement « hors d'usage » de la version d'avant.
for i, u in urls_pdf.items():
    if "encyclopedia-magica-3" not in u:
        continue
    st, f3 = get(f"/bibliotheque/livre/{i}")
    verifie("volume 3 — sa fiche n'annonce plus une recherche hors d'usage",
            "hors d&#x27;usage" not in f3 and "hors d'usage" not in f3)
    verifie("volume 3 — sa fiche dit que la reconnaissance a été refaite",
            "refaite" in f3 or "refait" in f3)
    verifie("volume 3 — il a toujours ses 417 pages", "417" in f3)

# ── 4. TÉMOIN : une fiche de sort ne doit porter AUCUN élément du lecteur
st, t = get("/bibliotheque/sort/1")
verifie("TÉMOIN — une fiche de sort répond", st == 200, f"HTTP {st}")
verifie("TÉMOIN — elle ne porte pas le lecteur",
        "Lire ici" not in t and "blob.vercel-storage.com/livres" not in t)

# ── 5. Les aides disent la fonctionnalité
for page, attendu in [("/aide/joueur", "Rayon Livres"), ("/aide/creation", "livres sources")]:
    st, a = get(page)
    verifie(f"{page} parle du rayon", st == 200 and attendu in a, f"HTTP {st}")

print(f"\n{'TOUT PASSE' if echecs == 0 else f'{echecs} ECHEC(S)'}")
sys.exit(0 if echecs == 0 else 1)

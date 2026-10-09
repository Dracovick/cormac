"""Vérifie que le formulaire de modification fait l'ALLER du type de bonus.

L'enjeu : le formulaire efface puis réécrit l'équipement du personnage. Si le
type de bonus ne remonte pas de la base vers le formulaire, le premier
enregistrement d'une fiche l'effacerait — et la classe d'armure retomberait
silencieusement en panne. On lit donc le flux de rendu de /modifier et on y
cherche la valeur de `bonusType` pour chaque objet porté.

Usage : uv run menage-references/p16-verif-formulaire.py [id]
"""
import re
import sys
import urllib.request

# La console Windows est en cp1252 : sans ça, un ✓ ou un ⛔ fait planter le
# script APRÈS son travail, et l'échec d'affichage se lit comme un échec de
# contrôle.
sys.stdout.reconfigure(encoding="utf-8")

pid = sys.argv[1] if len(sys.argv) > 1 else "1"
req = urllib.request.Request(
    f"https://www.dracovick.com/personnage/{pid}/modifier",
    headers={"Cookie": "cormac_auth=granted", "User-Agent": "dracovick-verif"},
)
with urllib.request.urlopen(req) as r:
    h = r.read().decode("utf-8", "replace")

print(f"/personnage/{pid}/modifier — {len(h)} octets\n")

# Le flux RSC échappe les guillemets : \"bonusType\":\"parade\"
trouves = re.findall(r'bonusType\\":\\"([^"\\]*)\\"', h)
if not trouves:
    trouves = re.findall(r'"bonusType":"([^"]*)"', h)

if not trouves:
    print("⛔ aucun champ bonusType dans le flux — le formulaire ne le transporte PAS")
    sys.exit(1)

print(f"champs bonusType transportés : {len(trouves)}")
for v in trouves:
    print(f"   {'« ' + v + ' »' if v else '(vide = pas de CA)'}")

attendus = {"parade"}  # Cormac porte l'anneau +2 et la cape +1, tous deux en parade
if pid == "1" and not attendus.issubset(set(trouves)):
    print(f"\n⛔ Cormac devrait porter au moins {attendus} — obtenu {set(trouves)}")
    sys.exit(1)

# ⚠ Ce contrôle NE PEUT PAS juger le <select> lui-même : l'onglet Équipement
# n'est pas monté au rendu serveur, donc ses balises n'existent pas encore dans
# le HTML. Ce qui est prouvé ici, c'est le TRANSPORT de la donnée — le point où
# un oubli aurait effacé le type au premier enregistrement. Le sélecteur est
# éprouvé au navigateur, pas ici.
print()
print("✓ Le formulaire transporte le type de bonus de la base vers la saisie.")
print("  (le <select> lui-même est éprouvé au navigateur : l'onglet Équipement")
print("   n'est pas monté au rendu serveur, ses balises n'existent pas encore.)")

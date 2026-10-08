"""
Relève les listes de compétences de classe des 11 classes de base, depuis le
SRD 3.5 français (« DRS 03a/03b (classes) », dépôt GitHub orey/DD-3e).

C'est la matière de `class_skill_list`, aujourd'hui VIDE : sans elle, le
Grimoire ne sait pas si Escalade est une compétence de classe pour un barbare,
donc il ne peut pas vérifier un degré de maîtrise (niveau + 3 en classe,
la moitié hors classe).

Le livre écrit la liste en prose, pas en table :
  « Les compétences du barbare (et la caractéristique dont dépend chacune) sont :
    Artisanat (Int), Dressage (Cha), … et Survie (Sag). »

PIÈGE : les parenthèses s'imbriquent. Le barde a « Connaissances (au choix,
chaque compétence devant être prise séparément) (Int) » — une découpe naïve sur
la virgule casse en plein milieu. On découpe donc sur les virgules de
PROFONDEUR ZÉRO seulement.

Usage : uv run python menage-references/p12-classes-competences.py
"""
import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCES = [os.path.join(ICI, 'p12-srd-classes-I.txt'), os.path.join(ICI, 'p12-srd-classes-II.txt')]
SORTIE = os.path.join(ICI, 'p12-classes-competences.json')

# La liste s'arrête au premier « . » suivi d'un saut de ligne : le prêtre
# intercale un paragraphe « Domaines et compétences de classe » avant les
# points de compétence, et une capture plus large l'avalait.
LISTE = re.compile(
    r"Les compétences (?:du |de l[’']|de la |des )(\w[\w’'-]*)"
    r"[^:]{0,80}: ([^\n]+?)\.\s*\n"
)
POINTS = re.compile(r"Points de compétence au niveau 1\s*:\s*\((\d+)")

CLASSES_ATTENDUES = {
    'barbare': 'Barbare', 'barde': 'Barde', 'druide': 'Druide',
    'ensorceleur': 'Ensorceleur', 'guerrier': 'Guerrier', 'magicien': 'Magicien',
    'moine': 'Moine', 'paladin': 'Paladin', 'prêtre': 'Prêtre',
    'rôdeur': 'Rôdeur', 'roublard': 'Roublard',
}


def decouper_profondeur_zero(texte):
    """Découpe sur « , » et « et » hors de toute parenthèse."""
    morceaux, courant, profondeur = [], [], 0
    i = 0
    while i < len(texte):
        c = texte[i]
        if c == '(':
            profondeur += 1
        elif c == ')':
            profondeur -= 1
        if profondeur == 0 and c == ',':
            morceaux.append(''.join(courant))
            courant = []
            i += 1
            continue
        if profondeur == 0 and texte.startswith(' et ', i):
            morceaux.append(''.join(courant))
            courant = []
            i += 4
            continue
        courant.append(c)
        i += 1
    if courant:
        morceaux.append(''.join(courant))
    return [m.strip() for m in morceaux if m.strip()]


# « Connaissances (au choix, …) (Int) » → nom « Connaissances », carac « Int ».
CARAC_FINALE = re.compile(r"\s*\((For|Dex|Con|Int|Sag|Cha|aucune|Aucune)\)\s*$")


def nom_et_carac(entree):
    """→ (nom de catalogue, précision, caractéristique). « Connaissances
    (religion) (Int) » → ('Connaissances', 'religion', 'Int')."""
    m = CARAC_FINALE.search(entree)
    if not m:
        return None, None, None
    nom = CARAC_FINALE.sub('', entree).strip()
    precision = None
    # Le catalogue porte les 36 compétences du livre; « Connaissances
    # (religion) » et « Artisanat (alchimie) » sont des spécialisations de
    # l'une d'elles. La précision est conservée à part : elle est
    # load-bearing — un prêtre n'a PAS Connaissances (nature) en compétence
    # de classe, sauf s'il prend le domaine de la Faune ou de la Flore.
    ouvre = nom.find(' (')
    if ouvre > 0 and nom.endswith(')'):
        precision = nom[ouvre + 2:-1].strip()
        nom = nom[:ouvre].strip()
        # « au choix, chaque compétence devant être prise séparément » est une
        # note de rédaction, pas un domaine de Connaissances.
        if 'au choix' in precision:
            precision = None
    return nom, precision, m.group(1)


def main():
    textes = [open(p, encoding='utf-8').read() for p in SOURCES]
    trouvees = {}
    for t in textes:
        for m in LISTE.finditer(t):
            brut = m.group(1).lower()
            if brut not in CLASSES_ATTENDUES:
                sys.exit('ARRÊT : classe inconnue « %s ».' % brut)
            entrees = decouper_profondeur_zero(m.group(2))
            competences = []
            for e in entrees:
                nom, precision, carac = nom_et_carac(e)
                if nom is None:
                    sys.exit('ARRÊT : entrée sans caractéristique — « %s » (%s)' % (e, brut))
                competences.append({'nom': nom, 'precision': precision, 'caracteristique': carac})
            pts = POINTS.search(t, m.end())
            if not pts:
                sys.exit('ARRÊT : points de compétence introuvables pour %s.' % brut)
            trouvees[CLASSES_ATTENDUES[brut]] = {
                'competences': competences,
                'pointsNiveau1': int(pts.group(1)),
            }

    manquantes = set(CLASSES_ATTENDUES.values()) - set(trouvees)
    if manquantes:
        sys.exit('ARRÊT : classes manquantes — %s' % ', '.join(sorted(manquantes)))

    # Contrôle croisé : chaque nom relevé doit exister dans les 36 fiches de
    # compétences. Un nom qui n'y est pas = une découpe ratée, pas une
    # compétence nouvelle.
    fiches = json.load(open(os.path.join(ICI, 'p11-competences-srd.json'), encoding='utf-8'))
    connus = {f['nom'] for f in fiches['competences']}
    inconnus = sorted({c['nom'] for v in trouvees.values() for c in v['competences']} - connus)
    if inconnus:
        sys.exit('ARRÊT : noms absents des 36 fiches — %s' % ', '.join(inconnus))

    tmp = SORTIE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump({'classes': trouvees}, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, SORTIE)

    total = sum(len(v['competences']) for v in trouvees.values())
    print('%d classes, %d associations écrites dans %s' % (len(trouvees), total, os.path.basename(SORTIE)))
    for nom in sorted(trouvees, key=lambda n: n.lower()):
        v = trouvees[nom]
        print('  %-12s %2d compétences · %d pts au niveau 1' % (nom, len(v['competences']), v['pointsNiveau1']))


if __name__ == '__main__':
    main()

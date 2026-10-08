"""
Aligne la liste EN DUR de src/lib/dnd35/skills.ts sur le livre.

CE QU'ELLE DÉCIDE : le plafond de rangs au formulaire de création (niveau + 3
en compétence de classe, la moitié hors classe) et la case ■/□ de la feuille
imprimée. Croisée au SRD français, elle accorde le statut « de classe » 19 fois
là où le livre ne le donne pas (Détection et Perception auditive au prêtre et
au paladin, Fouille au magicien, Connaissances au guerrier…) et l'oublie 16
fois (Artisanat et Profession à presque tout le monde, Représentation au moine
et au roublard, Natation au barde).

CE QUI EST RÉÉCRIT : `formationRequise` et `classesCompetence`, rien d'autre.
Les noms, leur ordre et la caractéristique ne bougent pas — ils décident de ce
que les joueurs voient à l'écran de création, et ce n'est pas l'objet ici.

LA PRÉCISION COMPTE : « Connaissances (mystères) » est de classe pour
l'ensorceleur, « Connaissances (religion) » pour le paladin. Une entrée du
livre SANS précision (le magicien a « Connaissances (toutes) ») accorde toutes
les spécialisations; une entrée AVEC précision n'accorde qu'elle.

⚠️ 7 lignes de fiche deviennent au-dessus du plafond après alignement
(p12-impact-plafonds.mts les nomme). Rien n'est écrêté : le formulaire ne
plafonne que la saisie, il ne réécrit pas une valeur existante. Ces 7 cas sont
des décisions de MJ, pas de scribe.

Usage : uv run python menage-references/p12-aligner-liste-code.py [--ecrire]
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ICI = os.path.dirname(os.path.abspath(__file__))
CIBLE = os.path.join(ICI, '..', 'src', 'lib', 'dnd35', 'skills.ts')
ECRIRE = '--ecrire' in sys.argv

ENTREE = re.compile(
    r"\{ nom: '((?:[^'\\]|\\.)*)',\s*"
    r"caracteristique: '([^']*)',\s*"
    r"formationRequise: (true|false),\s*"
    r"classesCompetence: \[([^\]]*)\] \},"
)

ORDRE_CLASSES = ['Barbare', 'Barde', 'Druide', 'Ensorceleur', 'Guerrier', 'Magicien',
                 'Moine', 'Paladin', 'Prêtre', 'Rôdeur', 'Roublard']


def apos(s):
    return s.replace('’', "'").replace('‘', "'").replace('ʼ', "'")


def mere_et_precision(nom):
    n = apos(nom).replace("\\'", "'")
    i = n.find(' (')
    if i > 0 and n.endswith(')'):
        return n[:i], n[i + 2:-1]
    return n, None


def main():
    releve = json.load(open(os.path.join(ICI, 'p12-classes-competences.json'), encoding='utf-8'))['classes']
    fiches = json.load(open(os.path.join(ICI, 'p11-competences-srd.json'), encoding='utf-8'))['competences']
    formation = {apos(f['nom']): f['formationRequise'] for f in fiches}

    # (classe, compétence mère) → ensemble de précisions; None = toutes.
    accorde = {}
    for classe, v in releve.items():
        for c in v['competences']:
            cle = (classe, apos(c['nom']))
            accorde.setdefault(cle, set()).add(c['precision'])

    source = open(CIBLE, encoding='utf-8').read()
    entrees = list(ENTREE.finditer(source))
    if len(entrees) < 40:
        sys.exit('ARRÊT : %d entrées trouvées dans skills.ts, au moins 40 attendues.' % len(entrees))

    hors_livre, changements, nouveau = [], [], source
    for m in entrees:
        nom_ts = m.group(1)
        mere, precision = mere_et_precision(nom_ts)
        if mere not in formation:
            hors_livre.append(nom_ts)
            continue

        classes = []
        for classe in ORDRE_CLASSES:
            precisions = accorde.get((classe, mere))
            if precisions is None:
                continue
            # None parmi les précisions = la classe a toute la compétence.
            if None in precisions or (precision is not None and precision in precisions):
                classes.append(classe)

        f_livre = 'true' if formation[mere] else 'false'
        liste = ', '.join("'%s'" % c for c in classes)
        remplacement = ("{ nom: '%s', caracteristique: '%s', formationRequise: %s, "
                        "classesCompetence: [%s] },") % (nom_ts, m.group(2), f_livre, liste)
        # Comparer le CONTENU, pas la chaîne : le fichier aligne ses colonnes
        # avec des espaces multiples, et une comparaison littérale déclarait
        # les 47 entrées « modifiées » alors que presque rien ne changeait.
        avant_classes = [c.strip().strip("'") for c in m.group(4).split(',') if c.strip()]
        # Comparer par ENSEMBLE : le fichier ne rangeait pas ses classes dans
        # le même ordre, et « Maîtrise des cordes » ressortait comme modifiée
        # avec une liste de changements vide.
        if m.group(3) != f_livre or set(avant_classes) != set(classes):
            changements.append({
                'nom': nom_ts,
                'formation': None if m.group(3) == f_livre else '%s → %s' % (m.group(3), f_livre),
                'ajoutees': [c for c in classes if c not in avant_classes],
                'retirees': [c for c in avant_classes if c not in classes],
            })
        nouveau = nouveau.replace(m.group(0), remplacement)

    print('=== ALIGNEMENT DE LA LISTE EN DUR %s ===' % ('(ÉCRITURE)' if ECRIRE else '(essai à blanc)'))
    print('  %d entrées lues · %d modifiées · %d hors livre (laissées telles quelles)\n'
          % (len(entrees), len(changements), len(hors_livre)))
    for c in changements:
        bouts = []
        if c['formation']:
            bouts.append('formation %s' % c['formation'])
        if c['ajoutees']:
            bouts.append('+ ' + ', '.join(c['ajoutees']))
        if c['retirees']:
            bouts.append('- ' + ', '.join(c['retirees']))
        print('  %-44s %s' % (c['nom'], ' · '.join(bouts)))
    if hors_livre:
        print('\n  hors livre (compétences maison, inchangées) : %s' % ', '.join(hors_livre))

    if not ECRIRE:
        print('\nEssai à blanc. Relancer avec --ecrire pour appliquer.')
        return

    tmp = CIBLE + '.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='') as fh:
        fh.write(nouveau)
    os.replace(tmp, CIBLE)
    print('\n✅ skills.ts réécrit.')


if __name__ == '__main__':
    main()

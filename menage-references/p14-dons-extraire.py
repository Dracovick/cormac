# -*- coding: utf-8 -*-
"""
Découpe les 109 fiches de dons du chapitre 5 (SRD 3.5 français) en JSON.

SOURCE : p14-dons-source.txt — texte extrait du RTF « DRS 05 (dons) » du dépôt
GitHub orey/DD-3e, le SRD 3.5 complet en français.

FIDÉLITÉ CONTRÔLÉE le 2026-10-08 contre DEUX pages du Manuel lues à l'image
(p. 93 et p. 100, PDF 94 et 101) : 12 phrases de règle sur 12 identiques au
caractère près (Combat monté, Course, Coup étourdissant, Création d'anneaux
magiques, Réflexes surhumains, Robustesse, Savoir-faire mécanique, Science du
contresort, Science du combat à deux armes). C'est bien la traduction VF.

CE QUI N'Y EST PAS — la licence libre couvre la règle, pas la prose :
  - l'accroche d'une phrase que porte CHAQUE don au Manuel (« Le personnage est
    particulièrement rapide. ») : les 3 cherchées étaient absentes des 3.
    Relevées à part, à l'image — voir p14-accroches.json.
  - les renvois de page (« voir page 39 ») et les parenthèses de renvoi au
    Guide du Maître.

LE MANUEL SE CONTREDIT SUR UN NIVEAU, et le croisement l'a sorti :
  Préparation de potions — la table 5-1 (p. 91) écrit « Niveau de lanceur de
  sorts de 6 », la fiche du chapitre (p. 99) « Niveau 3 de lanceur de sorts ».
  Le SRD dit 3 lui aussi : deux attestations contre une, 3 est la bonne, et
  c'est ce que la base porte déjà. Rien touché — arbitrage du MJ à consigner.
  ⚠ Au passage : MON relevé de la table avait écrit 3 là où elle imprime 6.
  Une faute qui tombait juste, mais une faute. Avec « Autonomie » pour
  « Autonome », cela fait DEUX erreurs dans mon relevé de la table 5-1 —
  c'est le croisement avec le chapitre qui les a l'une et l'autre révélées.

DEUX COQUILLES DU MANUEL que le SRD corrige, signalées à André sans trancher :
  - Coup étourdissant : le Manuel écrit « modificateur de Sagesse du MOINE »
    alors que le don n'est pas réservé au moine; le SRD dit « du personnage ».
  - Coup étourdissant, Spécial : le Manuel laisse le nom anglais non traduit
    (« Un guerrier peut choisir UPPERCUT »); le SRD écrit « Coup étourdissant ».

Usage : uv run python menage-references/p14-dons-extraire.py
"""
import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(ICI, 'p14-dons-source.txt')
CATALOGUE = os.path.join(ICI, 'p10-dons-catalogue.json')
ACCROCHES = os.path.join(ICI, 'p14-accroches.json')
SORTIE = os.path.join(ICI, 'p14-dons-srd.json')

# En-tete d'une fiche : seul sur sa ligne, « Nom du don [type] ».
EN_TETE = re.compile(r'^(.+?)\s*\[([^\]]+)\]\s*$')

# Le modele de presentation du chapitre, qui porte lui aussi des crochets.
# Nomme plutot qu'ecarte par une condition floue.
MODELE = 'Nom du don'

# Les intitules de bloc du livre, a mettre en gras dans la fiche.
# « Conditions. » AVANT « Condition. » : l'inverse couperait le « s ».
BLOCS = ['Conditions.', 'Condition.', 'Avantage.', 'Normal.', 'Spécial.']

# Alias nom du SRD -> nom du catalogue, a ecrire a la main un couple a la fois.
# Vide aujourd'hui : le seul ecart trouve, « Autonome » (SRD) contre
# « Autonomie » (catalogue), n'en etait pas un. Le Manuel ecrit AUTONOME a la
# table 5-1 (p. 90) ET en tete de sa fiche (p. 92) — c'est mon releve de la
# table qui avait mal transcrit. Corrige a la source plutot qu'alias : un alias
# aurait fige ma faute dans le code.
ALIAS = {}

PROVENANCE = "*[Document de Référence du Système 3.5, version française — chapitre des dons]*"

# Là où le SRD contredit le MANUEL d'André, c'est le Manuel qui fait foi : c'est
# le livre joué à sa table. Chaque correction est écrite à la main, une à une,
# avec ses deux attestations — jamais un remplacement automatique.
#
# Contrôle fait : les 109 conditions du chapitre comparées NOMBRE PAR NOMBRE à
# la table 5-1 relevée à l'image. 17 écarts, dont 16 sont de simples abrégés de
# la table (elle n'imprime pas les prérequis hérités du don parent : « Science
# de la feinte — Expertise du combat » au lieu de « Int 13, Expertise du
# combat »). Le chapitre est alors la source complète, et on le garde.
# Il ne reste qu'UN vrai conflit, ci-dessous.
CORRECTIONS = [
    {
        'don': 'Création d’objets merveilleux',
        'de': 'Niveau 5 de lanceur de sorts',
        'vers': 'Niveau 3 de lanceur de sorts',
        'motif': ("le Manuel dit 3 DEUX FOIS — table 5-1 p. 90 et fiche p. 93 — "
                  "contre 5 au SRD français; deux attestations contre une"),
    },
]


def cle(nom):
    """Clé d'appariement. Le SRD écrit « Création d'anneaux » avec l'apostrophe
    TYPOGRAPHIQUE U+2019, le catalogue relevé à l'image avec la droite : dix
    dons se croisaient sans se voir. On normalise la CLÉ, jamais la donnée —
    chaque nom garde l'orthographe de sa source."""
    return (nom.replace('’', "'").replace('ʼ', "'")
            .replace(' ', ' ').strip())


def table_markdown(lignes):
    """« a|b|c| » du SRD -> « | a | b | c | » que le rendu de fiche sait afficher."""
    sortie = []
    for l in lignes:
        cellules = [c.strip() for c in l.rstrip('|').split('|')]
        sortie.append('| ' + ' | '.join(cellules) + ' |')
    return sortie


def mettre_en_forme(lignes_corps):
    """Gras sur les intitules de bloc, tables en markdown, lignes vides tassees."""
    resultat = []
    tampon_table = []
    for l in lignes_corps:
        brute = l.strip()
        # Une ligne de table du SRD porte au moins deux « | » et finit par « | ».
        if brute.endswith('|') and brute.count('|') >= 2:
            tampon_table.append(brute)
            continue
        if tampon_table:
            resultat.extend(table_markdown(tampon_table))
            tampon_table = []
        for b in BLOCS:
            if brute.startswith(b):
                brute = '**' + b + '**' + brute[len(b):]
                break
        resultat.append(brute)
    if tampon_table:
        resultat.extend(table_markdown(tampon_table))
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(resultat)).strip()


def conditions_du_corps(lignes_corps):
    """Le texte de la ligne « Condition(s). ... », ou None s'il n'y en a pas."""
    for l in lignes_corps:
        brute = l.strip()
        for b in ('Conditions.', 'Condition.'):
            if brute.startswith(b):
                return brute[len(b):].strip().rstrip('.')
    return None


def main():
    texte = open(SOURCE, encoding='utf-8').read()

    fiches = []
    for ligne in texte.split('\n'):
        m = EN_TETE.match(ligne)
        if m and 0 < len(m.group(1).strip()) < 70:
            nom = m.group(1).strip()
            fiches.append({'nom': ALIAS.get(nom, nom), 'type': m.group(2).strip(), 'corps': []})
        elif fiches:
            fiches[-1]['corps'].append(ligne)

    fiches = [f for f in fiches if f['nom'] != MODELE]
    if len(fiches) != 109:
        sys.exit('ARRET : %d fiches decoupees, 109 attendues.' % len(fiches))

    # Les accroches du Manuel, relevees a l'image. Absentes tant que la passe
    # n'est pas faite : la fiche part alors directement sur ses regles.
    # Indexées par clé normalisée : le relevé à l'image écrit l'apostrophe
    # droite, le SRD la typographique. Même piège qu'au croisement plus bas.
    accroches = {}
    if os.path.exists(ACCROCHES):
        brut = json.load(open(ACCROCHES, encoding='utf-8'))
        # Les clés « _… » documentent la source du relevé, ce ne sont pas des dons.
        accroches = {cle(k): v for k, v in brut.items() if not k.startswith('_')}
        inconnues = sorted(set(accroches) - {cle(f['nom']) for f in fiches})
        if inconnues:
            sys.exit('ARRET : %d accroche(s) ne correspondent a aucun don : %s'
                     % (len(inconnues), inconnues))

    # Corrections du SRD par le Manuel, appliquées au corps AVANT mise en forme.
    # Un motif qui ne trouve pas sa cible est une faute de frappe silencieuse :
    # le script s'arrête plutôt que de laisser passer la valeur fausse.
    for c in CORRECTIONS:
        visee = [f for f in fiches if cle(f['nom']) == cle(c['don'])]
        if not visee:
            sys.exit('ARRET : correction sur un don introuvable — %s' % c['don'])
        touche = 0
        for f in visee:
            for i, l in enumerate(f['corps']):
                if c['de'] in l:
                    f['corps'][i] = l.replace(c['de'], c['vers'])
                    touche += 1
        if not touche:
            sys.exit('ARRET : correction sans cible dans %s — « %s » introuvable'
                     % (c['don'], c['de']))
        print('correction : %s — « %s » -> « %s » (%s)' % (c['don'], c['de'], c['vers'], c['motif']))

    sortie = []
    for f in fiches:
        regles = mettre_en_forme(f['corps'])
        accroche = (accroches.get(cle(f['nom'])) or '').strip()
        # Ne pas redoubler : pour une quinzaine de dons, le SRD porte déjà la
        # phrase d'introduction du Manuel (« Le personnage choisit une arme »).
        if accroche and accroche.rstrip('.') in regles:
            accroche = ''
        morceaux = ([accroche] if accroche else []) + [regles, PROVENANCE]
        sortie.append({
            'nom': f['nom'],
            'type': f['type'],
            'conditions': conditions_du_corps(f['corps']),
            'accroche': accroche or None,
            'description': '\n\n'.join(morceaux),
        })

    # Garde-fous : une fiche vide ou sans bloc « Avantage » signalerait un
    # decoupage casse, et on semerait du vide sans s'en apercevoir.
    for f in sortie:
        if '**Avantage.**' not in f['description']:
            sys.exit('ARRET : pas de bloc Avantage — %s' % f['nom'])
        if len(f['description']) < 120:
            sys.exit('ARRET : fiche trop courte — %s (%d car.)' % (f['nom'], len(f['description'])))

    # Un alias qui ne correspond a rien est une faute de frappe silencieuse :
    # il desarmerait l'appariement sans que personne ne le voie.
    noms = {f['nom'] for f in sortie}
    for ancien, nouveau in ALIAS.items():
        if nouveau not in noms:
            sys.exit('ARRET : alias %s -> %s ne correspond a aucune fiche.' % (ancien, nouveau))

    # Croisement avec le catalogue des 109 : un nom qui ne tombe pas en face
    # laisserait une fiche sans description, en silence.
    catalogue = json.load(open(CATALOGUE, encoding='utf-8'))['dons']
    cles = {cle(n) for n in noms}
    noms_cat = {cle(d['nom']) for d in catalogue}
    orphelins = sorted(cles - noms_cat)
    manquants = sorted(noms_cat - cles)
    if orphelins or manquants:
        sys.exit('ARRET : appariement incomplet.\n  sans entree de catalogue : %s\n  sans fiche du SRD : %s'
                 % (orphelins, manquants))

    tmp = SORTIE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump({'dons': sortie}, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, SORTIE)

    avec_accroche = sum(1 for f in sortie if f['accroche'])
    print('%d fiches ecrites dans %s' % (len(sortie), os.path.basename(SORTIE)))
    print('  appariees au catalogue : %d/%d' % (len(cles & noms_cat), len(catalogue)))
    print('  avec conditions        : %d' % sum(1 for f in sortie if f['conditions']))
    print('  avec accroche          : %d' % avec_accroche)
    print('  total description      : %d caracteres' % sum(len(f['description']) for f in sortie))


if __name__ == '__main__':
    main()

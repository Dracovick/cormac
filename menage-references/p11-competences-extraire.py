"""
Découpe les 36 fiches de compétences du SRD 3.5 français en JSON.

SOURCE : p11-srd-competences-source.txt — texte extrait du RTF « DRS 04
(compétences) » du dépôt GitHub orey/DD-3e, qui est le SRD 3.5 complet en
français. Fidélité contrôlée le 2026-10-08 contre deux pages du Manuel des
Joueurs lues à l'image (p. 66 et p. 69) : 9 phrases sur 11 identiques au
caractère près. C'est la traduction officielle VF, pas une retraduction.

CE QUI N'Y EST PAS (la licence libre couvre la règle, pas la prose) :
  - la phrase d'accroche de la fiche (31 des 36 n'en ont pas);
  - les exemples narratifs (le lammasu métamorphosé en halfelin).
Les accroches sont relevées à part, à l'image — voir p11-accroches.json.

Usage : uv run --with striprtf python menage-references/p11-competences-extraire.py
"""
import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(ICI, 'p11-srd-competences-source.txt')
SORTIE = os.path.join(ICI, 'p11-competences-srd.json')

# En-tête d'une fiche, seul sur sa ligne : « Acrobaties (Dex ; formation
# nécessaire ; malus d'armure aux tests) ». Le `$` est essentiel : sans lui on
# attrape les lignes des tables de tests opposés, qui finissent par « | ».
EN_TETE = re.compile(
    r"(?m)^([A-ZÉÈÀÂÎÔÛÇ][a-zéèêàâîôûç'’/ ]{2,40})"
    r"\((For|Dex|Con|Int|Sag|Cha|aucune|Aucune)([^)\n]{0,60})\)\s*$"
)

# Les intitulés de bloc du livre, à mettre en gras dans la fiche.
BLOCS = [
    'Test de compétence.',
    'Nouvelles tentatives.',
    'Action.',
    'Spécial.',
    'Synergie.',
    'Test inné.',
    'Restriction.',
]

PROVENANCE = '*[Document de Référence du Système 3.5, version française — chapitre des compétences]*'

# Langue est la seule compétence qui n'a pas de bloc « Test de compétence » :
# on ne joue jamais de test de Langue, soit on connaît un langage soit non.
# Nommée ici plutôt qu'exclue par une condition floue, et vérifiée plus bas
# contre les noms réellement trouvés — une faute de frappe ici désarmerait le
# garde-fou en silence.
SANS_TEST = {'Langue'}


def table_markdown(lignes):
    """« a|b|c| » du SRD → « | a | b | c | » que le rendu de fiche sait afficher."""
    sortie = []
    for l in lignes:
        cellules = [c.strip() for c in l.rstrip('|').split('|')]
        sortie.append('| ' + ' | '.join(cellules) + ' |')
    return sortie


def mettre_en_forme(corps):
    """Gras sur les intitulés de bloc, tables en markdown, lignes vides tassées."""
    lignes = corps.split('\n')
    resultat = []
    tampon_table = []
    for l in lignes:
        brute = l.strip()
        # Une ligne de table du SRD porte au moins un « | » et finit par « | ».
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

    texte = '\n'.join(resultat)
    texte = re.sub(r'\n{3,}', '\n\n', texte)
    return texte.strip()


def main():
    texte = open(SOURCE, encoding='utf-8').read()
    entetes = [(m.group(1).strip(), m.group(2), m.group(3), m.start(), m.end())
               for m in EN_TETE.finditer(texte)]
    if len(entetes) != 36:
        sys.exit('ARRÊT : %d en-têtes trouvés, 36 attendus.' % len(entetes))

    fiches = []
    for i, (nom, carac, suite, debut, fin) in enumerate(entetes):
        fin_fiche = entetes[i + 1][3] if i + 1 < len(entetes) else len(texte)
        corps = texte[fin:fin_fiche]
        fiches.append({
            'nom': nom,
            'caracteristique': carac if carac.lower() != 'aucune' else 'Aucune',
            'formationRequise': 'formation nécessaire' in suite,
            'malusArmure': "malus d'armure" in suite,
            'description': mettre_en_forme(corps) + '\n\n' + PROVENANCE,
        })

    # Garde-fous : une fiche vide ou sans bloc de règle signalerait un découpage
    # cassé, et on sèmerait du vide dans la base sans s'en apercevoir.
    noms = {f['nom'] for f in fiches}
    for exempte in SANS_TEST:
        if exempte not in noms:
            sys.exit('ARRÊT : exemption « %s » ne correspond à aucune fiche trouvée.' % exempte)
    for f in fiches:
        if len(f['description']) < 300:
            sys.exit('ARRÊT : fiche trop courte — %s (%d car.)' % (f['nom'], len(f['description'])))
        if f['nom'] not in SANS_TEST and '**Test de compétence.**' not in f['description']:
            sys.exit('ARRÊT : pas de bloc « Test de compétence » — %s' % f['nom'])

    tmp = SORTIE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump({'competences': fiches}, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, SORTIE)

    print('%d fiches écrites dans %s' % (len(fiches), os.path.basename(SORTIE)))
    print('  formation nécessaire : %d' % sum(f['formationRequise'] for f in fiches))
    print("  malus d'armure       : %d" % sum(f['malusArmure'] for f in fiches))
    print('  total description    : %d caractères' % sum(len(f['description']) for f in fiches))


if __name__ == '__main__':
    main()

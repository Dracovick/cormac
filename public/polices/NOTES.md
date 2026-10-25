# Polices servies au rendu PDF

Ces fichiers ne servent **ni à l'écran ni à l'impression directe** : ils sont chargés
uniquement par `/api/pdf`, qui les déclare sous le nom de famille `Arial`.

## Pourquoi

Les feuilles du Grimoire sont dessinées en `Arial, sans-serif`. Chromium serverless n'a
aucune police système : il retombe sur Open Sans, livrée avec `@sparticuz/chromium`. Open
Sans n'a pas les métriques d'Arial, et la pagination dérape — mesuré le 25 octobre 2026 :
la feuille d'un Prêtre 5 sortait sur **5 pages** au lieu des 4 mesurées sur l'imprimante
du MJ, la cinquième ne portant qu'une ligne de note.

Les feuilles ne sont pas retouchées pour tenir : elles sont calibrées et validées sur
l'imprimante. C'est au rendu serveur de s'aligner sur elle.

## Ce que sont ces fichiers

**Arimo**, métriquement compatible avec Arial, sous licence SIL OFL 1.1 (voir `OFL.txt`,
aucun *Reserved Font Name*). Les quatre variantes sont **statiques**, instanciées depuis
les fichiers variables publiés par Google Fonts :

```bash
# sources : https://github.com/google/fonts/tree/main/ofl/arimo
#   Arimo[wght].ttf  et  Arimo-Italic[wght].ttf
uv run --with fonttools python -c "
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
for src, poids, sortie in [
    ('Arimo[wght].ttf',        400, 'Arimo-Regular.ttf'),
    ('Arimo[wght].ttf',        700, 'Arimo-Bold.ttf'),
    ('Arimo-Italic[wght].ttf', 400, 'Arimo-Italic.ttf'),
    ('Arimo-Italic[wght].ttf', 700, 'Arimo-BoldItalic.ttf'),
]:
    f = TTFont(src)
    instantiateVariableFont(f, {'wght': poids}, inplace=True, updateFontNames=True)
    f.save(sortie)
"
```

⚠ **Statiques et non variables, pour deux raisons mesurées** : avec les fichiers variables,
Skia embarque les glyphes en polices **Type 3** (rastérisées — PDF à 351 Ko au lieu de
220 Ko, texte moins propre), et le **gras retombait quand même sur Open Sans**.

## Contrôle des métriques

Comparaison fontTools contre les polices de Windows (`arial.ttf`, `arialbd.ttf`,
`ariali.ttf`) — `unitsPerEm`, `hhea` ascender / descender / lineGap, et les largeurs
d'avance de `A a M m W w i I 1 espace . C D E F P R T` :

| | upem | hhea | largeurs |
|---|---|---|---|
| Arial / Arimo-Regular | 2048 = 2048 | 1854 / −434 / 67 | identiques |
| Arial Bold / Arimo-Bold | 2048 = 2048 | 1854 / −434 / 67 | identiques |
| Arial Italic / Arimo-Italic | 2048 = 2048 | 1854 / −434 / 67 | identiques |

## Vérifier que le PDF les utilise vraiment

La route renvoie un en-tête `X-Grimoire-Polices` qui compte les `@font-face` effectivement
chargées — **4 attendu**. Et le PDF produit doit embarquer des `Arimo-*` en *CID TrueType*,
sans aucune `OpenSans-*` :

```bash
curl -sD - -H "Cookie: cormac_auth=granted" \
  "https://www.dracovick.com/api/pdf?cible=%2Fpersonnage%2Fvierge%3Fclasse%3DPr%C3%AAtre%26niveau%3D5" \
  -o /tmp/essai.pdf | grep -i grimoire-polices
pdffonts /tmp/essai.pdf
pdfinfo  /tmp/essai.pdf | grep Pages    # Prêtre 5 → 4 pages
```

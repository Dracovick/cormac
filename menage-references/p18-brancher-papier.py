"""Branche la feuille IMPRIMÉE sur le moteur d'attaque partagé (dnd35/attaque.ts).

Avant ce script, le tableau ARMES du papier n'ajoutait à l'attaque que le BAB,
le modificateur de caractéristique et le bonus magique de l'arme — ni munitions,
ni dons —, et sa colonne Dégâts affichait le dé NU. Sur l'arc de Cormac :
écran +16/+11 et 1d8+9, papier +12/+7 et 1d8.

Le script refuse d'écrire s'il ne retrouve pas exactement ses bornes.

Usage : uv run menage-references/p18-brancher-papier.py
"""
import io
import os
import sys

CIBLE = "src/app/personnage/[id]/imprimer/page.tsx"

ANCIEN = """            {weapons.length > 0 ? weapons.map((w, i) => {
              const wpnBonus = w.charWeapon.bonusMagique ?? 0
              const isRanged = estArmeADistance(w.weapon.famille, w.weapon.portee)
              const rawBab   = isRanged ? rawBabProj : rawBabCorps
              const bbaTotal = isRanged ? bbaProj    : bbaCorps
              const bbaStr   = atkSeq(bbaTotal, rawBab, wpnBonus)
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', fontWeight: 'bold' }}>
                    {w.weapon.nom}{wpnBonus > 0 ? ` +${wpnBonus}` : ''}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{bbaStr}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{w.weapon.degats ?? '—'}</td>
"""

NOUVEAU = """            {weapons.length > 0 ? weapons.map((w, i) => {
              // Le MÊME moteur que l'écran : c'est la duplication du calcul qui
              // faisait diverger le papier (munitions, dons et modificateurs de
              // dégâts manquaient). Voir l'en-tête de dnd35/attaque.
              const calc = calculeArme({
                nom: w.weapon.nom,
                famille: w.weapon.famille,
                portee: w.weapon.portee,
                degats: w.weapon.degats,
                bonusArme: w.charWeapon.bonusMagique ?? 0,
                bonusMunitions: w.charWeapon.bonusMunitions,
                coteDeForce: w.charWeapon.coteDeForce,
                dons: feats.map(f => f.feat.nom),
                bbaBrutCorps: rawBabCorps,
                bbaBrutDistance: rawBabProj,
                forMod,
                dexMod,
              })
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', fontWeight: 'bold' }}>
                    {calc.nomAffiche}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{calc.sequence}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{calc.degatsTexte}</td>
"""

src = io.open(CIBLE, encoding="utf-8").read()

if src.count(ANCIEN) != 1:
    sys.exit(f"⛔ bloc ARMES trouvé {src.count(ANCIEN)} fois — rien écrit")
neuf = src.replace(ANCIEN, NOUVEAU)

# Les deux cases générales du bloc « Bonus d'attaque » gardent leur calcul, mais
# passent par l'utilitaire partagé plutôt que par une copie locale.
for ancien, nouveau in [
    ("atkSeq(bbaCorps, rawBabCorps)", "sequenceAttaques(bbaCorps, rawBabCorps)"),
    ("atkSeq(bbaProj, rawBabProj)", "sequenceAttaques(bbaProj, rawBabProj)"),
]:
    neuf = neuf.replace(ancien, nouveau)

ANCIENNE_FN = """  function atkSeq(total: number, rawBab: number, wpnBonus = 0): string {
    const first = total + wpnBonus
    const seq = [first]
    if (rawBab >= 6)  seq.push(first - 5)
    if (rawBab >= 11) seq.push(first - 10)
    if (rawBab >= 16) seq.push(first - 15)
    return seq.map(fm).join(' / ')
  }

"""
if ANCIENNE_FN not in neuf:
    sys.exit("⛔ atkSeq locale introuvable — rien écrit")
neuf = neuf.replace(ANCIENNE_FN, "")

if "atkSeq" in neuf:
    sys.exit("⛔ un appel à atkSeq subsiste — rien écrit")

# estArmeADistance n'est plus appelé par le bloc ARMES; il peut rester utile
# ailleurs dans la page. On ne retire l'import que s'il ne sert plus.
ligne_import = "import { estArmeADistance } from '@/lib/dnd35/weapons'\n"
if neuf.count("estArmeADistance") == 1 and ligne_import in neuf:
    neuf = neuf.replace(ligne_import, "")

ANCRE = "import { calculeClasseArmure, sourcesCAObjets, sourcesCASaisies } from '@/lib/dnd35/classe-armure'"
if ANCRE not in neuf:
    sys.exit("⛔ ancre d'import introuvable — rien écrit")
neuf = neuf.replace(
    ANCRE,
    ANCRE + "\nimport { calculeArme, sequenceAttaques } from '@/lib/dnd35/attaque'",
)

tmp = CIBLE + ".tmp"
io.open(tmp, "w", encoding="utf-8", newline="\n").write(neuf)
os.replace(tmp, CIBLE)
print(f"✓ {CIBLE} réécrit — {len(src)} → {len(neuf)} caractères")

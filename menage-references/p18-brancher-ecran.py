"""Branche la page ÉCRAN sur le moteur d'attaque partagé (dnd35/attaque.ts).

Remplace le corps du `weapons.map(...)` de /personnage/[id] par un appel à
`calculeArme`. Le script refuse d'écrire s'il ne retrouve pas EXACTEMENT les
bornes attendues : une faute de frappe de ma part ne peut pas produire un
fichier à moitié réécrit.

Usage : uv run menage-references/p18-brancher-ecran.py
"""
import io
import os
import sys

CIBLE = "src/app/personnage/[id]/page.tsx"

DEBUT = """              {weapons.map(({ weapon, charWeapon }) => {
                // La famille tranche, pas la portée : la dague se lance à 3 m
"""
FIN = """                    {charWeapon.proprietesSpeciales && (
                      <p className="text-purple-300 text-xs mt-2 italic">{charWeapon.proprietesSpeciales}</p>
                    )}
                  </div>
                )
              })}
"""

NOUVEAU = """              {weapons.map(({ weapon, charWeapon }) => {
                // Un seul moteur pour l'écran et le papier — sinon ils divergent,
                // et ils ont divergé : voir l'en-tête de dnd35/attaque.
                const calc = calculeArme({
                  nom: weapon.nom,
                  famille: weapon.famille,
                  portee: weapon.portee,
                  degats: weapon.degats,
                  bonusArme: charWeapon.bonusMagique ?? 0,
                  bonusMunitions: charWeapon.bonusMunitions,
                  coteDeForce: charWeapon.coteDeForce,
                  dons: feats.map(f => f.feat.nom),
                  bbaBrutCorps: rawBabCorps,
                  bbaBrutDistance: rawBabProj,
                  forMod,
                  dexMod,
                })

                // Fiche de la Bibliothèque à ouvrir pour cette arme : son entrée
                // de catalogue si la ligne y est rattachée, elle-même si c'est
                // déjà une entrée de catalogue, rien sinon (attaque de créature,
                // arme de supplément, ligne trop imprécise pour être identifiée).
                const ficheArmeId = weapon.catalogueId ?? (weapon.estCatalogue ? weapon.id : null)

                return (
                  <div key={charWeapon.id} className="bg-stone-800/60 rounded p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-white font-semibold">
                            {calc.nomAffiche}
                          </span>
                          {/* Règles officielles de l'arme. Une ligne d'inventaire
                              rattachée pointe vers son entrée de catalogue; une
                              entrée de catalogue pointe vers elle-même. */}
                          {ficheArmeId !== null && (
                            <Link
                              href={`/bibliotheque/arme/${ficheArmeId}?from=/personnage/${id}`}
                              title="Lire les règles de cette arme au Manuel"
                              className="text-stone-500 hover:text-amber-300 text-xs"
                            >
                              📖
                            </Link>
                          )}
                          <span className="text-stone-500 text-xs">Att.</span>
                          <DetailBonus
                            titre={`Attaque — ${calc.nomAffiche}`}
                            total={calc.sequence}
                            lignes={calc.attaqueLignes}
                            inline
                          >
                            <span className="text-amber-300 font-bold text-sm">
                              {calc.sequence}
                            </span>
                          </DetailBonus>
                        </div>
                        <div className="text-stone-400 text-xs mt-1 space-x-3">
                          <DetailBonus
                            titre={`Dégâts — ${calc.nomAffiche}`}
                            base={weapon.degats ?? '—'}
                            baseLabel="dé de l'arme"
                            total={calc.degatsTexte}
                            lignes={calc.degatsLignes}
                            inline
                          >
                            <span>Dégâts : <span className="text-amber-300">{calc.degatsTexte}</span></span>
                          </DetailBonus>
                          <span>Critique : <span className="text-amber-300">{formatCritique(weapon.critiqueMin, weapon.critiqueMult)}</span></span>
                          {weapon.portee && <span>Portée : <span className="text-amber-300">{weapon.portee}m</span></span>}
                          <span>Type : {weapon.typeDegats}</span>
                        </div>
                      </div>
                      <LiveAttaque personnageId={character.id} nomArme={calc.nomAffiche} />
                    </div>
                    {charWeapon.proprietesSpeciales && (
                      <p className="text-purple-300 text-xs mt-2 italic">{charWeapon.proprietesSpeciales}</p>
                    )}
                  </div>
                )
              })}
"""

src = io.open(CIBLE, encoding="utf-8").read()

i = src.find(DEBUT)
if i < 0:
    sys.exit("⛔ borne de DÉBUT introuvable — rien écrit")
j = src.find(FIN, i)
if j < 0:
    sys.exit("⛔ borne de FIN introuvable — rien écrit")
j += len(FIN)

if src.count(DEBUT) != 1:
    sys.exit(f"⛔ borne de début présente {src.count(DEBUT)} fois — rien écrit")

neuf = src[:i] + NOUVEAU + src[j:]

# Les deux cases générales passent au même utilitaire que le reste.
neuf = neuf.replace("attackSeq(bbaCorpsTotal, rawBabCorps)", "sequenceAttaques(bbaCorpsTotal, rawBabCorps)")
neuf = neuf.replace("attackSeq(bbaProjTotal, rawBabProj)", "sequenceAttaques(bbaProjTotal, rawBabProj)")

# … et la fonction locale disparaît, avec son commentaire de calcul.
ANCIENNE_FN = """  function attackSeq(total: number, rawBab: number, weaponBonus = 0): string {
    const first = total + weaponBonus
    const seq = [first]
    if (rawBab >= 6)  seq.push(first - 5)
    if (rawBab >= 11) seq.push(first - 10)
    if (rawBab >= 16) seq.push(first - 15)
    return seq.map(signedNum).join(' / ')
  }
"""
if ANCIENNE_FN not in neuf:
    sys.exit("⛔ attackSeq locale introuvable — rien écrit")
neuf = neuf.replace(ANCIENNE_FN, "")

# Import du moteur, juste après celui de classe-armure s'il existe.
ANCRE = "import { sourcesCASorts, contributionsSortsDepuisCA, calculeBonusEffetsCarac } from '@/lib/dnd35/spell-effects'"
if ANCRE not in neuf:
    sys.exit("⛔ ancre d'import introuvable — rien écrit")
neuf = neuf.replace(
    ANCRE,
    ANCRE + "\nimport { calculeArme, sequenceAttaques } from '@/lib/dnd35/attaque'",
)

# Écriture atomique : un échec d'encodage ne doit pas laisser la cible vidée.
tmp = CIBLE + ".tmp"
io.open(tmp, "w", encoding="utf-8", newline="\n").write(neuf)
os.replace(tmp, CIBLE)
print(f"✓ {CIBLE} réécrit — {len(src)} → {len(neuf)} caractères")

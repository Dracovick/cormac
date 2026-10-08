/**
 * Inscrit dans p8-rattachement.json l'arbitrage des 10 lignes restées
 * « trancher ». GO d'André, DM du 2026-10-08 : « les 10 rattachements d'armes
 * à trancher, Hache de guerre +1 (focus) en tête ».
 *
 * Verdict 'arbitre' = décision prise ici, motif écrit, révocable d'un mot.
 * Chaque motif nomme la PREUVE : le dé de dégâts (jamais le total, qui porte la
 * Force du porteur), la classe ou la race du porteur, le reste de son
 * inventaire. Aucune ressemblance de nom n'est utilisée seule.
 *
 * Le script refuse d'écrire si une des 10 lignes ne porte plus le verdict
 * 'trancher' (quelqu'un est déjà passé) ou si son nom a changé en base.
 */
import fs from 'node:fs'

const CHEMIN = 'X:/Claude-Tools/cormac/menage-references/p8-rattachement.json'

const ARBITRAGES = [
  {
    id: 124, nom: 'Hache de guerre +1 (focus)', cible: "Hache d'armes",
    motif: "le dé est 1d8 = hache d'armes (arme de guerre); la hache de guerre naine fait 1d10 et "
      + "demande le maniement d'une arme EXOTIQUE. Dragar Thunderhammer est HUMAIN, Guerrier 4 — il est "
      + "d'office compétent avec la hache d'armes, pas avec la naine. Le dé et la légalité disent la même chose.",
  },
  {
    id: 143, nom: 'Fléchettes', cible: 'Dard',
    motif: "le dé est 1d4 = Dard. Karad Malar est MOINE 2 : le dard est une arme de moine, et il n'a "
      + "aucune arbalète à son inventaire (bâton + mains nues) — ces « fléchettes » ne peuvent pas être "
      + "des carreaux, comme ailleurs chez André.",
  },
  {
    id: 149, nom: 'Poignard +2', cible: 'Dague',
    motif: "« poignard » est le mot français pour la dague du Manuel. ⚠ Picasso porte déjà « Dague +2 (coup) » "
      + "et « Dague +2 (lancée) » au même bonus : cette ligne sans dégâts est très probablement la ligne "
      + "d'OBJET du même poignard, dont les deux autres sont les modes d'attaque — question de données, pas de rattachement.",
  },
  {
    id: 86, nom: 'Anneau poignard +2', cible: 'Dague',
    motif: "le dé est 1d4, celui de la dague. Elwin Brokenarrow est Roublard 15 archer : une arme de secours "
      + "dissimulée. Si l'anneau-poignard vient d'un supplément, ses propres valeurs l'emportent — le 📖 "
      + "n'affiche que les règles de la dague, il ne change aucun chiffre de la fiche.",
  },
  {
    id: 122, nom: 'couteau de lancé', cible: 'Dague',
    motif: "le dé est 1d4, et le Manuel donne justement à la dague un facteur de portée de 3 m : c'est "
      + "elle, le couteau qu'on lance. « couteau de lancer » n'existe pas à la table 7-5.",
  },
  {
    id: 69, nom: 'Arbalette de  (20 carreaux)', cible: 'Arbalète de poing',
    motif: "deux signaux concordants : le dé est 1d4, seule l'arbalète de poing le porte (légère 1d8, "
      + "lourde 1d10, à répétition 1d8/1d10); et le mot manquant de « Arbalète de ___ » se lit « poing » "
      + "dans la nomenclature du Manuel.",
  },
  {
    id: 98, nom: 'Elven Longbow +3', cible: 'Arc long',
    motif: "le dé est 1d8 = arc long (l'arc court fait 1d6). Uhlmar Thobin est Elfe Rôdeur 13 archer. "
      + "L'arc elfique est une arme de supplément, mais c'est un arc long dans toutes ses versions — le 📖 "
      + "ouvre les règles de l'arc long. ⚠ sa ligne porte un critique ×2 là où l'arc long fait ×3.",
  },
  {
    id: 152, nom: '1 Flèche rouge', cible: 'Flèches (20)',
    motif: "munition d'arc, et Picasso porte un arc court. Les couleurs distinguent sans doute des flèches "
      + "magiques différentes : le rattachement ne les confond pas, il ouvre la fiche des flèches.",
  },
  {
    id: 153, nom: '1 Flèche bleue', cible: 'Flèches (20)',
    motif: 'même raison que la flèche rouge.',
  },
  {
    id: 154, nom: '8 Flèche blanche', cible: 'Flèches (20)',
    motif: 'même raison que la flèche rouge.',
  },
]

const data = JSON.parse(fs.readFileSync(CHEMIN, 'utf8'))
let ecrits = 0
const refus = []
for (const a of ARBITRAGES) {
  const l = data.liens.find((x) => x.id === a.id)
  if (!l) { refus.push(`[${a.id}] absent de la table`); continue }
  if (l.verdict === 'arbitre') { console.log(`= [${a.id}] déjà arbitré`); continue }
  if (l.verdict !== 'trancher') { refus.push(`[${a.id}] porte le verdict « ${l.verdict} », pas « trancher » — rien écrit`); continue }
  if (l.nom !== a.nom) { refus.push(`[${a.id}] nom de table « ${l.nom} » ≠ « ${a.nom} » — rien écrit`); continue }
  l.cible = a.cible
  l.verdict = 'arbitre'
  l.motif = a.motif
  ecrits++
  console.log(`✓ [${a.id}] ${a.nom} → ${a.cible}`)
}
if (refus.length) { console.error('\nREFUS :'); refus.forEach(r => console.error('  ✗ ' + r)); process.exit(1) }

data._doc = data._doc.replace(
  "'non' = n'est pas une arme du catalogue",
  "'arbitre' = etait 'trancher', arbitre le 2026-10-08 sur GO d'Andre avec motif ecrit (de de degats, classe ou race du porteur, reste de son inventaire); 'non' = n'est pas une arme du catalogue"
)

const tmp = CHEMIN + '.tmp'
fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
fs.renameSync(tmp, CHEMIN)
console.log(`\n${ecrits} arbitrage(s) inscrits. Reste « trancher » : ${data.liens.filter((l) => l.verdict === 'trancher').length}`)

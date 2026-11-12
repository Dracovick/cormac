/**
 * Contrôle de `effetsDuDon` — avec des témoins NÉGATIFS.
 *
 * Un test qui ne vérifie que « les dons comptés rendent un effet » passe au
 * vert même si la fonction rendait un effet pour TOUT. Les cas attendus vides
 * (Attaque en puissance, Esquive totale, un nom vide) sont donc la moitié du
 * test, et le compteur de cas est publié avec le résultat.
 */
import { effetsDuDon } from '../src/lib/dnd35/dons-effets'

type Cas = {
  nom: string
  /** Nombre d'effets attendus. */
  n: number
  /** Statuts attendus, dans l'ordre. */
  statuts?: string[]
  /** Fragment attendu dans le « où » de la première ligne. */
  ou?: string
  ctx?: { forMod: number; dexMod: number; uneArmeEligible: boolean }
}

const DEX_FORTE = { forMod: 1, dexMod: 5, uneArmeEligible: true }
const FOR_FORTE = { forMod: 2, dexMod: 1, uneArmeEligible: true }   // Parx
const SANS_ARME = { forMod: 1, dexMod: 5, uneArmeEligible: false }

const CAS: Cas[] = [
  // ── Passifs comptés dans les totaux de la fiche
  { nom: "Science de l'initiative", n: 1, statuts: ['compte'], ou: 'Initiative' },
  { nom: 'Improved initiative +5', n: 1, statuts: ['compte'], ou: 'Initiative' },
  { nom: 'Vigueur surhumaine', n: 1, statuts: ['compte'], ou: 'Vigueur' },
  { nom: 'Ligthning reflexes', n: 1, statuts: ['compte'], ou: 'Réflexes' },
  { nom: 'Iron Will (+2 will save)', n: 1, statuts: ['compte'], ou: 'Volonté' },
  { nom: 'Vigilence', n: 1, statuts: ['compte'], ou: 'Détection' },

  // ── Conditionnels : montrés, hors total
  { nom: 'Esquive (+1 CA contre un adversaire choisi)', n: 1, statuts: ['main'], ou: 'armure' },
  { nom: 'Mobility (+4 AC)', n: 1, statuts: ['main'], ou: 'armure' },

  // ── Informatif : connu, pas appliqué
  { nom: 'NIV12 - Toughness', n: 1, statuts: ['informatif'], ou: 'Points de vie' },

  // ── Bonus d'arme : la cible vient de la parenthèse du nom
  { nom: 'Arme de prédilection (Morgenstern)', n: 1, statuts: ['compte'], ou: 'Morgenstern' },
  { nom: 'Spécialisation martiale (hache de guerre naine)', n: 1, statuts: ['compte'], ou: 'Dégâts' },
  { nom: 'Maîtrise martiale supérieure (Morgenstern)', n: 1, statuts: ['compte'], ou: 'Attaque' },
  { nom: 'Tir à bout portant', n: 2, statuts: ['compte', 'compte'], ou: 'distance' },

  // ── Attaque en finesse : le seul don dont l'effet dépend de la fiche
  { nom: 'Attaque en finesse', n: 1, statuts: ['compte'], ou: 'légères', ctx: DEX_FORTE },
  { nom: 'Weapon finesse (mace)', n: 1, statuts: ['inactif'], ctx: FOR_FORTE },
  { nom: 'Acuité martiale (Dague)', n: 1, statuts: ['inactif'], ctx: SANS_ARME },
  // Sans contexte (feuille imprimée, audit) : on l'annonce compté sans le juger.
  { nom: 'Attaque en finesse', n: 1, statuts: ['compte'], ou: 'légères' },

  // ── TÉMOINS NÉGATIFS — doivent rendre ZÉRO effet
  { nom: 'Attaque en puissance', n: 0 },
  { nom: 'Power attack', n: 0 },
  { nom: 'Esquive totale', n: 0 },                      // capacité de classe, pas le don Esquive
  { nom: 'Esquive instinctive (+2 contre les pièges)', n: 0 },
  { nom: 'Vigilance (Familier)', n: 0 },                // actif près du familier seulement
  { nom: 'Weapon focus (dagger)', n: 0 },               // anglais non reconnu — dossier ouvert
  { nom: 'Improved critical (bastard)', n: 0 },
  { nom: 'Quintessence des sorts', n: 0 },
  { nom: 'Niv 4', n: 0 },                               // marqueur de progression FileMaker
  { nom: '', n: 0 },
]

let echecs = 0
for (const c of CAS) {
  const e = effetsDuDon(c.nom, c.ctx)
  const erreurs: string[] = []
  if (e.length !== c.n) erreurs.push(`${e.length} effet(s) au lieu de ${c.n}`)
  if (c.statuts && e.map(x => x.statut).join(',') !== c.statuts.join(','))
    erreurs.push(`statuts « ${e.map(x => x.statut).join(',')} » au lieu de « ${c.statuts.join(',')} »`)
  if (c.ou && !e.some(x => x.ou.includes(c.ou!)))
    erreurs.push(`aucun « où » ne contient « ${c.ou} » (vu : ${e.map(x => x.ou).join(' | ')})`)
  if (erreurs.length > 0) {
    echecs++
    console.log(`✗ « ${c.nom || '(vide)'} » : ${erreurs.join(' ; ')}`)
  } else {
    const rendu = e.map(x => `${x.statut} ${x.ou} ${x.quoi}`).join(' | ')
    console.log(`✓ « ${c.nom || '(vide)'} »${rendu ? ` → ${rendu}` : ' → aucun effet'}`)
  }
}

const negatifs = CAS.filter(c => c.n === 0).length
console.log(`\n${CAS.length} cas (dont ${negatifs} témoins négatifs) — ${echecs} échec(s)`)
if (echecs > 0) process.exit(1)

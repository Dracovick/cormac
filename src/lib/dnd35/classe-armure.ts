// CLASSE D'ARMURE — l'arbitrage des bonus, en un seul endroit.
//
// Le PHB 3.5 (chapitre 8, « Bonus de CA ») pose deux règles que le Grimoire
// ignorait pour les objets magiques :
//
//   1. Un bonus ne va à la CA que s'il EST un bonus de CA. Un bandeau
//      d'Intelligence, une cape de résistance ou des gants de Dextérité portent
//      un « +2 » qui ne touche pas la classe d'armure.
//   2. Deux bonus du MÊME TYPE ne se cumulent pas : seul le meilleur compte.
//      Un anneau de parade +2 et une cape de parade +1 donnent +2, pas +3.
//      Seuls les bonus d'esquive (et le fourre-tout « divers ») se cumulent.
//
// Toutes les sources passent donc par ici — sorts actifs, objets portés et les
// champs saisis par le MJ sur la fiche — pour que l'arbitrage soit le même quelle
// que soit la provenance du bonus. Rien n'est effacé : une source écartée est
// retournée avec `effective: 0` et le nom de celle qui la supplante, de sorte
// que la fiche puisse l'afficher et que le MJ voie pourquoi.
//
// Le total retourné est un COMPLÉMENT à ajouter par-dessus le bonus de l'armure
// et du bouclier réellement portés : c'est ce dernier qui sert de plancher aux
// sources de type « armure » et « bouclier » (une armure de mage +4 n'apporte
// rien à qui porte déjà une cotte de mailles +5).

// Le vocabulaire des bonus de CA du PHB 3.5, pour le sélecteur du formulaire.
// « divers » reste disponible : c'est le fourre-tout, et lui seul se cumule
// toujours avec le reste.
export const TYPES_BONUS_CA = [
  'armure',
  'bouclier',
  'parade',
  'armure naturelle',
  'esquive',
  'taille',
  'intuition',
  'divers',
] as const

export type OrigineCA = 'sort' | 'objet' | 'saisie'

export type SourceCA = {
  cle: string // identifiant unique dans l'arbitrage
  origine: OrigineCA
  label: string // ce que la fiche affiche
  typeBonus: string
  valeur: number
}

export type ContributionCA = SourceCA & {
  effective: number // ce que la source apporte réellement, après cumul
  remplacePar?: string // le label de la source qui la rend inopérante
}

// PHB 3.5 : les bonus de même type ne se cumulent pas (on garde le meilleur),
// sauf les bonus d'esquive (et « divers ») qui se cumulent toujours.
export const TYPES_CUMULABLES: string[] = ['esquive', 'divers']

export function calculeClasseArmure(
  sources: SourceCA[],
  equipement: { bonusArmurePortee: number; bonusBouclierPorte: number },
): { total: number; contributions: ContributionCA[] } {
  // Le meilleur de chaque type non cumulable. À valeur égale, la première
  // source rencontrée gagne — l'ordre d'appel est donc stable et reproductible.
  const meilleurs = new Map<string, SourceCA>()
  for (const s of sources) {
    if (TYPES_CUMULABLES.includes(s.typeBonus)) continue
    const best = meilleurs.get(s.typeBonus)
    if (!best || s.valeur > best.valeur) meilleurs.set(s.typeBonus, s)
  }

  const contributions: ContributionCA[] = sources.map(s => {
    if (TYPES_CUMULABLES.includes(s.typeBonus)) return { ...s, effective: s.valeur }

    const best = meilleurs.get(s.typeBonus)
    if (best && best.cle !== s.cle) return { ...s, effective: 0, remplacePar: best.label }

    // Le meilleur de son type : comparé à l'équipement porté pour armure/bouclier
    if (s.typeBonus === 'armure' && equipement.bonusArmurePortee > 0) {
      return equipement.bonusArmurePortee >= s.valeur
        ? { ...s, effective: 0, remplacePar: 'armure portée' }
        : { ...s, effective: s.valeur - equipement.bonusArmurePortee }
    }
    if (s.typeBonus === 'bouclier' && equipement.bonusBouclierPorte > 0) {
      return equipement.bonusBouclierPorte >= s.valeur
        ? { ...s, effective: 0, remplacePar: 'bouclier porté' }
        : { ...s, effective: s.valeur - equipement.bonusBouclierPorte }
    }
    return { ...s, effective: s.valeur }
  })

  return { total: contributions.reduce((sum, c) => sum + c.effective, 0), contributions }
}

// ── Les objets magiques portés ──────────────────────────────────────────────
//
// Un objet ne contribue que si `bonus_type` est renseigné (voir drizzle/0011).
// NULL n'est pas un trou de saisie, c'est le cas normal : sur les 742 lignes du
// rayon, 9 portent un `bonus` et 4 de ces 9 ne touchent pas la classe d'armure.
// Aucune déduction sur le nom de l'objet — une devinette qui se trompe sur la
// saisie du MJ est pire qu'une donnée assumée.
export type ObjetMagiquePorte = {
  item: { id: number; nom: string; bonus: number | null; bonusType: string | null }
}

export function sourcesCAObjets(objets: ObjetMagiquePorte[]): SourceCA[] {
  return objets
    .filter(({ item }) => (item.bonus ?? 0) !== 0 && item.bonusType)
    .map(({ item }) => ({
      cle: `objet:${item.id}`,
      origine: 'objet' as const,
      label: item.nom,
      typeBonus: item.bonusType!,
      valeur: item.bonus!,
    }))
}

// ── Les champs saisis sur la fiche ─────────────────────────────────────────
//
// `ca_naturelle` et `ca_deflexion` nomment leur type de bonus : ils entrent
// donc dans le même arbitrage que les objets et les sorts. Rien n'est modifié
// en base — un champ écarté reste saisi, la fiche dit seulement qu'il ne compte
// pas. `ca_divers` est du type fourre-tout : il se cumule toujours.
export function sourcesCASaisies(stats: {
  caNaturelle?: number | null
  caDeflexion?: number | null
  caDivers?: number | null
} | null | undefined): SourceCA[] {
  if (!stats) return []
  const sources: SourceCA[] = []
  if ((stats.caNaturelle ?? 0) !== 0) {
    sources.push({ cle: 'saisie:naturelle', origine: 'saisie', label: 'armure naturelle (fiche)', typeBonus: 'armure naturelle', valeur: stats.caNaturelle! })
  }
  if ((stats.caDeflexion ?? 0) !== 0) {
    sources.push({ cle: 'saisie:parade', origine: 'saisie', label: 'parade (fiche)', typeBonus: 'parade', valeur: stats.caDeflexion! })
  }
  if ((stats.caDivers ?? 0) !== 0) {
    sources.push({ cle: 'saisie:divers', origine: 'saisie', label: 'divers (fiche)', typeBonus: 'divers', valeur: stats.caDivers! })
  }
  return sources
}

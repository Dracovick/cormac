import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCharacter } from '@/lib/queries/character'
import { DeleteButton } from '@/components/fiche/DeleteButton'
import { getClasseInfo, getSortsSlotsParJour, getEmplacementsNiveau, comptePreparations } from '@/lib/dnd35/classes'
import { getMultiClassBab, xpPourNiveau, modSauvegarde } from '@/lib/dnd35/rules'
import { getNiveauLanceurEffectif } from '@/lib/dnd35/prestige-classes'
import { getCapacitesPourPersonnage } from '@/lib/dnd35/class-features'
import { SORTS_DND35, type ClasseSortKey } from '@/lib/dnd35/spells'
import { getFeatWeaponBonuses, getFeatDescription, getFeatPassiveBonuses, sommeBonus } from '@/lib/dnd35/feat-bonuses'
import { getDomaineInfo } from '@/lib/dnd35/domains'
import { caracteristiqueDe } from '@/lib/dnd35/skills'
import { getChargeCategorie, getChargeLimites } from '@/lib/dnd35/encumbrance'
import { FEATS_DND35, verifierPrerequisDon } from '@/lib/dnd35/feats'
import { totalGemmes, formatPo, uniteCourte } from '@/lib/dnd35/monnaie'

export const dynamic = 'force-dynamic'
import { Section } from '@/components/fiche/Section'
import { CaracteristiqueBadge } from '@/components/fiche/CaracteristiqueBadge'
import { StatBlock } from '@/components/fiche/StatBlock'
import { PhotoPortrait } from '@/components/fiche/PhotoPortrait'
import { LiveHP } from '@/components/fiche/LiveHP'
import { NuitDeRepos } from '@/components/fiche/NuitDeRepos'
import { LiveSort } from '@/components/fiche/LiveSort'
import { LivePotion } from '@/components/fiche/LivePotion'
import { LiveCharge } from '@/components/fiche/LiveCharge'
import { LiveNotes } from '@/components/fiche/LiveNotes'
import { InitiativeEnCours } from '@/components/fiche/InitiativeEnCours'
import { PreparerSorts } from '@/components/fiche/PreparerSorts'
import { AjouterSort } from '@/components/fiche/AjouterSort'
import { SupprimerSort } from '@/components/fiche/SupprimerSort'
import { DescriptionSort } from '@/components/fiche/DescriptionSort'
import { LigneSort } from '@/components/fiche/LigneSort'
import { EffetsSorts } from '@/components/fiche/EffetsSorts'
import { LiveAttaque } from '@/components/fiche/LiveAttaque'
import { DetailBonus } from '@/components/fiche/DetailBonus'
import { AjouterXp } from '@/components/fiche/AjouterXp'
import { MonterNiveau } from '@/components/fiche/MonterNiveau'
import { JournalDrawer } from '@/components/fiche/JournalDrawer'
import { ButinDrawer } from '@/components/fiche/ButinDrawer'
import { calculeBonusEffetsCA, calculeBonusEffetsCarac } from '@/lib/dnd35/spell-effects'
import { getDb } from '@/db'
import { spells as spellsTable } from '@/db/schema/spells'

function modif(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function signedNum(n: number) {
  return n >= 0 ? `+${n}` : `${n}`
}

// « aucun » (y compris « aucun (objet) », « aucun (voir description) »…) :
// le sort n'appelle aucun jet de sauvegarde, donc pas de DD à afficher.
// Mais « aucun ou Volonté, annule » garde son DD : une partie de l'effet se sauvegarde.
function sansJetDeSauvegarde(js: string | null | undefined): boolean {
  if (!js) return false
  const n = js.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return n.includes('aucun') && !/reflexes|vigueur|volonte/.test(n)
}

function normNomSort(nom: string): string {
  return nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’´`]/g, "'").toLowerCase().trim()
}

export default async function FichePersonnage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCharacter(Number(id))
  if (!data) notFound()

  const { character, race, clan, god, classes, abilityScores, combatStats, savingThrows, skills, feats, racialFeatures, spells, weapons, armor, magicItems, potions, currency, gems, languages, creatures, companions, spellEffects } = data

  // Valeur du trésor en gemmes, convertie en po (mithral à part : aucun taux)
  const totalGem = totalGemmes(gems.map(g => ({
    quantite: g.quantite ?? 1,
    valeur: parseFloat(g.valeur?.toString() ?? '0'),
    unite: g.unite ?? 'po',
  })))

  // Effets de sorts actifs : ceux qui touchent une caractéristique se propagent
  // dans tous les calculs (mods, CA, attaques, sauvegardes, compétences…)
  const effetsCA = spellEffects.filter(e => e.cible === 'CA')
  const effetsVisuels = spellEffects.filter(e => e.cible === 'VISUEL')
  const effetsSuivi = spellEffects.filter(e => e.cible === 'SUIVI')
  const effetsDepl = spellEffects.filter(e => e.cible === 'DEPL')
  const CIBLES_CARAC = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA']
  const effetsCarac = spellEffects.filter(e => CIBLES_CARAC.includes(e.cible))
  const { bonus: effCarac, contributions: contributionsCarac } = calculeBonusEffetsCarac(effetsCarac)
  // Effets visuels (portrait) et de suivi : aucune statistique modifiée
  const contributionsVisuels = effetsVisuels.map(e => ({ ...e, effective: 0 }))
  const contributionsSuivi = effetsSuivi.map(e => ({ ...e, effective: 0 }))
  const contributionsDepl = effetsDepl.map(e => ({ ...e, effective: e.valeur }))
  const visuelsActifs = effetsVisuels.map(e => e.typeBonus)
  const bonusDepl = effetsDepl.reduce((sum, e) => sum + e.valeur, 0)

  const forT = (abilityScores?.forBase ?? 10) + (abilityScores?.forMagique ?? 0) + (race?.bonusFor ?? 0) + effCarac.FOR
  const dexT = (abilityScores?.dexBase ?? 10) + (abilityScores?.dexMagique ?? 0) + (race?.bonusDex ?? 0) + effCarac.DEX
  const forMod = Math.floor((forT - 10) / 2)
  const dexMod = Math.floor((dexT - 10) / 2)
  // Modificateurs d'incantation (DD des sorts = 10 + niveau du sort + mod. de la caractéristique)
  const intT = (abilityScores?.intBase ?? 10) + (abilityScores?.intMagique ?? 0) + (race?.bonusInt ?? 0) + effCarac.INT
  const sagT = (abilityScores?.sagBase ?? 10) + (abilityScores?.sagMagique ?? 0) + (race?.bonusSag ?? 0) + effCarac.SAG
  const chaT = (abilityScores?.chaBase ?? 10) + (abilityScores?.chaMagique ?? 0) + (race?.bonusCha ?? 0) + effCarac.CHA
  const intMod = Math.floor((intT - 10) / 2)
  const sagMod = Math.floor((sagT - 10) / 2)
  const chaMod = Math.floor((chaT - 10) / 2)
  // Caractéristique d'incantation par classe (PHB 3.5)
  const CARAC_INCANTATION: Record<string, { carac: 'INT' | 'SAG' | 'CHA'; mod: number }> = {
    Magicien:    { carac: 'INT', mod: intMod },
    Ensorceleur: { carac: 'CHA', mod: chaMod },
    Barde:       { carac: 'CHA', mod: chaMod },
    Prêtre:      { carac: 'SAG', mod: sagMod },
    Druide:      { carac: 'SAG', mod: sagMod },
    Paladin:     { carac: 'SAG', mod: sagMod },
    Rôdeur:      { carac: 'SAG', mod: sagMod },
  }
  const caMagique = magicItems.reduce((sum, { item }) => sum + (item.bonus ?? 0), 0)
  const caArmure = armor.reduce((sum, { armor: a, charArmor }) => sum + (a.bonusArmure ?? 0) + (charArmor.bonusMagique ?? 0), 0)
  const maxDex = armor.length > 0 ? Math.min(...armor.map(({ armor: a }) => a.maxDex ?? 10)) : 10
  const dexModCA = Math.min(dexMod, maxDex)
  // Malus de compétence cumulé (valeurs stockées en négatif en DB — on prend la valeur absolue)
  const malusArmure = armor.reduce((sum, { armor: a }) => sum + Math.abs(a.malusCompetence ?? 0), 0)
  // Risque d'échec arcanique cumulé (s'additionnent si plusieurs armures)
  const risqueEchecTotal = armor.reduce((sum, { armor: a }) => sum + (a.risqueEchecMagique ?? 0), 0)
  // Compétences pénalisées par le malus d'armure (PHB 3.5)
  const COMPETENCES_MALUS_ARMURE = ['Acrobaties', 'Discrétion', 'Déplacement silencieux', 'Escalade', 'Évasion', 'Natation', 'Saut', 'Escamotage']
  // Effets de sorts actifs sur la CA (activés/retirés par le joueur) — cumul PHB 3.5
  const estBouclier = (t: string | null) => (t ?? '').toLowerCase().includes('bouclier')
  const bonusArmurePortee = armor
    .filter(({ armor: a }) => !estBouclier(a.type))
    .reduce((sum, { armor: a, charArmor }) => sum + (a.bonusArmure ?? 0) + (charArmor.bonusMagique ?? 0), 0)
  const bonusBouclierPorte = caArmure - bonusArmurePortee
  const { total: bonusSortsCA, contributions: contributionsCA } = calculeBonusEffetsCA(effetsCA, { bonusArmurePortee, bonusBouclierPorte })
  const caTotal = (combatStats
    ? 10 + caArmure + (combatStats.caNaturelle ?? 0) + (combatStats.caDeflexion ?? 0) + (combatStats.caDivers ?? 0) + dexModCA + caMagique
    : 10) + bonusSortsCA
  // Bonus passifs des dons (Science de l'initiative, Volonté de fer, Vigilance…) —
  // comptés automatiquement : le champ « divers » ne doit PAS les contenir en plus.
  const donsPassifs = getFeatPassiveBonuses(feats.map(f => f.feat.nom))
  const initiativeTotal = (combatStats ? dexMod + (combatStats.initiativeBonus ?? 0) : dexMod) + sommeBonus(donsPassifs.initiative)

  // Déplacement auto : utilise l'armure.deplacement si renseigné, sinon détecte armure lourde
  // + bonus des sorts actifs (ex. Repli expéditif +9 m)
  const baseDepl = combatStats?.deplacement ?? 9
  const deplacement = (() => {
    const armorDeplValues = armor.map(({ armor: a }) => a.deplacement).filter((d): d is number => d != null)
    if (armorDeplValues.length > 0) return Math.min(...armorDeplValues) + bonusDepl
    const hasHeavy = armor.some(({ armor: a }) =>
      (a.type ?? '').toLowerCase().includes('lourde') || (a.type ?? '').toLowerCase().includes('lourd')
    )
    if (hasHeavy) return (baseDepl >= 9 ? 6 : 4) + bonusDepl
    return baseDepl + bonusDepl
  })()

  // BAB multi-classes : somme de chaque contribution
  const firstClass  = classes[0]
  const bbaBase     = classes.length > 0
    ? getMultiClassBab(classes.map(c => {
        const info = getClasseInfo(c.classe.nom)
        return { bab: info?.bab ?? 'faible', niveau: c.characterClass.niveau }
      }))
    : 0

  // Priorité : valeur stockée si > 0, sinon calcul automatique D&D 3.5
  const rawBabCorps = combatStats?.bbaCorpsACorps || bbaBase
  const rawBabProj  = combatStats?.bbaProjectiles || rawBabCorps
  const bbaCorpsTotal = rawBabCorps + forMod
  const bbaProjTotal  = rawBabProj  + dexMod
  function attackSeq(total: number, rawBab: number, weaponBonus = 0): string {
    const first = total + weaponBonus
    const seq = [first]
    if (rawBab >= 6)  seq.push(first - 5)
    if (rawBab >= 11) seq.push(first - 10)
    if (rawBab >= 16) seq.push(first - 15)
    return seq.map(signedNum).join(' / ')
  }

  const classeLabel = classes.map(c => `${c.classe.nom} ${c.characterClass.niveau}`).join(' / ')
  const niveauTotal = classes.reduce((sum, c) => sum + c.characterClass.niveau, 0)
  // ⛔ Aucun plafond : le jeu épique (niveau 21+) n'a pas de niveau maximum en 3.5.
  // Math.max(1, …) : un personnage sans classe compte comme niveau 1, exactement
  // comme sur la fiche imprimée — sinon le papier et l'écran divergeraient.
  const xpProchain = xpPourNiveau(Math.max(1, niveauTotal) + 1)
  // Niveau que l'XP justifie (table 3-2 du Manuel) : si plus haut que le niveau
  // joué, la fiche propose la montée — la boucle s'arrête d'elle-même, sans plafond.
  let niveauXp = Math.max(1, niveauTotal)
  while (xpPourNiveau(niveauXp + 1) <= (character.xp ?? 0)) niveauXp++

  // PV attendus : plage selon dé de vie et CON (après niveauTotal)
  const conT = (abilityScores?.conBase ?? 10) + (abilityScores?.conMagique ?? 0) + (race?.bonusCon ?? 0) + effCarac.CON
  const conMod = Math.floor((conT - 10) / 2)
  const primaryDe = classes[0] ? (getClasseInfo(classes[0].classe.nom)?.de ?? 6) : 6
  const pvDons = sommeBonus(donsPassifs.pv) // Robustesse +3 : élargit la plage attendue
  const pvAttenduMax = niveauTotal > 0 ? niveauTotal * (primaryDe + conMod) + pvDons : 0
  const pvAttenduMin = niveauTotal > 0 ? Math.max(niveauTotal, niveauTotal * (1 + conMod)) + pvDons : 0

  // Encombrement simplifié (PHB 3.5, p.162) — armes + armures uniquement
  const poidsTotal = [
    ...weapons.map(({ weapon }) => parseFloat(weapon.poids?.toString() ?? '0')),
    ...armor.map(({ armor: a }) => parseFloat(a.poids?.toString() ?? '0')),
  ].reduce((sum, w) => sum + w, 0)
  const chargeCategorie = getChargeCategorie(forT, poidsTotal)
  const chargeLimites = getChargeLimites(forT)

  // Domaines du prêtre/druide
  const d1Info = combatStats?.domaine1 ? getDomaineInfo(combatStats.domaine1) : undefined
  const d2Info = combatStats?.domaine2 ? getDomaineInfo(combatStats.domaine2) : undefined
  // Jet de sauvegarde des sorts de domaine : la liste vient du statique (domains.ts),
  // qui ne connaît pas le JS — on le cherche dans la table spells par nom normalisé
  // pour masquer le DD des sorts qui n'en appellent aucun (ex. Arme spirituelle).
  const jsParNomSort = new Map<string, string>()
  if (d1Info || d2Info) {
    const tous = await getDb().select({ nom: spellsTable.nom, js: spellsTable.jetDeSauvegarde }).from(spellsTable)
    for (const s of tous) {
      if (s.js) jsParNomSort.set(normNomSort(s.nom), s.js)
    }
  }

  // Pour les multi-classés : afficher les options de prochain niveau
  const optsNiveauSuivant = classes.map(c => `${c.classe.nom} ${c.characterClass.niveau + 1}`)
  const prochainesOptions = classes.length > 1
    ? optsNiveauSuivant.slice(0, -1).join(', ') + ' ou ' + optsNiveauSuivant[optsNiveauSuivant.length - 1]
    : null

  // Sorts : classes lanceuses (multi-classes → une section de sorts par classe)
  const ARCANE_CLASSES = ['Magicien', 'Ensorceleur', 'Barde']
  const DIVIN_CLASSES  = ['Prêtre', 'Druide', 'Paladin', 'Rôdeur']
  const divineClasseSort = classes.find(c => DIVIN_CLASSES.includes(c.classe.nom))
  const arcaneClasseSort = classes.find(c => ARCANE_CLASSES.includes(c.classe.nom))
  // Les sorts sans classe attribuée (anciens enregistrements) appartiennent à la classe par défaut
  const classeSortDefaut = divineClasseSort ?? arcaneClasseSort
  const casterClasses = classes.filter(c => DIVIN_CLASSES.includes(c.classe.nom) || ARCANE_CLASSES.includes(c.classe.nom))

  // Liste complète des sorts disponibles pour une classe divine (préparation par la prière)
  function availableSpellsFor(nomClasse: string, niveauClasse: number, customSpells: { nom: string; ecole: string; niveau: number; estPersonnalise: true }[]) {
    const classeKey = nomClasse as ClasseSortKey
    const slots = getSortsSlotsParJour(nomClasse, niveauClasse)
    const maxSpellLevel = slots.reduce((max, count, idx) => count > 0 ? idx : max, -1)
    if (maxSpellLevel < 0) return undefined
    const predefined = SORTS_DND35
      .filter(s => {
        const niv = s.niveaux[classeKey]
        return niv !== undefined && niv <= maxSpellLevel
      })
      .map(s => ({
        nom: s.nom,
        ecole: s.ecole,
        niveau: s.niveaux[classeKey]!,
        estPersonnalise: false as const,
        // La liste divine est bâtie sur le catalogue statique : sa définition
        // vient donc du catalogue lui-même, pas de la base.
        description: s.description || null,
        meta: [s.composantes, s.portee, s.duree].filter(Boolean).join(' · ') || null,
      }))
    // Fusionner avec les sorts personnalisés (en évitant les doublons)
    const nomsPredefined = new Set(predefined.map(s => s.nom))
    const customExtra = customSpells.filter(cs => !nomsPredefined.has(cs.nom))
    return [...predefined, ...customExtra]
      .sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom, 'fr'))
  }

  const sortsRefMap = new Map(SORTS_DND35.map(s => [s.nom, s]))

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Bandeau d'initiative : visible seulement quand le MJ mène un combat où ce personnage figure */}
      <InitiativeEnCours personnageId={Number(id)} />
      {/* ── EN-TÊTE ── */}
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-8 px-6">
        <div className="max-w-5xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-y-2">
          {/* Zone tactile ≥44 px (recommandation iOS) : rembourrage compensé par -mx-3 pour garder l'alignement visuel */}
          <Link href="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 -mx-3 min-h-[44px] rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Grimoire D&D 3e édition
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/personnage/${id}/imprimer`}
              className="inline-flex items-center gap-2 bg-stone-700/50 hover:bg-stone-600/70 border border-stone-600/50 text-stone-300 hover:text-white text-sm px-3 py-2 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              PDF
            </Link>
            <Link
              href={`/personnage/${id}/modifier`}
              className="inline-flex items-center gap-2 bg-amber-800/40 hover:bg-amber-700/60 border border-amber-700/50 hover:border-amber-500 text-amber-300 hover:text-amber-200 text-sm font-medium px-3 py-2 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifier
            </Link>
            <DeleteButton personnageId={Number(id)} nom={character.nom} />
            <Link
              href={`/aide/joueur?from=/personnage/${id}`}
              className="inline-flex items-center gap-1.5 bg-stone-800/50 hover:bg-stone-700/60 border border-stone-700/50 hover:border-stone-500 text-stone-400 hover:text-stone-200 text-sm px-3 py-2 rounded-lg transition-all"
              title="Aide — Guide du joueur"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Aide
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-6">
            {/* Nom et identité */}
            <div className="flex-1 min-w-0">
              <h1 className="text-5xl font-bold text-amber-300 tracking-wide">{character.nom}</h1>
              {character.surnom && (
                <p className="text-amber-600 text-lg italic mt-1">« {character.surnom} »</p>
              )}
              <p className="text-stone-300 mt-2 text-lg">
                {race?.nom ?? '—'} · {classeLabel} · {character.alignement ?? 'Alignement non précisé'}
              </p>
              {clan && (
                <p className="text-stone-400 text-sm mt-1">Clan : {clan.nom}</p>
              )}
              {(character.joueurPrenom || character.joueurNom) && (
                <p className="text-stone-500 text-sm mt-1">
                  Joueur : {[character.joueurPrenom, character.joueurNom].filter(Boolean).join(' ')}
                </p>
              )}
            </div>

            {/* XP + Photo */}
            <div className="flex items-start gap-5 shrink-0">
              {/* XP */}
              <div className="text-right">
                <div className="text-amber-400 text-2xl font-bold">{character.xp?.toLocaleString('fr-FR')} XP</div>
                <div className="text-stone-500 text-sm">
                  Prochain niveau : {xpProchain.toLocaleString('fr-FR')} XP
                </div>
                {prochainesOptions && (
                  <div className="text-stone-600 text-xs mt-0.5">→ {prochainesOptions}</div>
                )}
                <div className="mt-2 w-48 bg-stone-800 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: xpProchain > 0 ? `${Math.min(100, ((character.xp ?? 0) / xpProchain) * 100)}%` : '100%' }}
                  />
                </div>
                <AjouterXp personnageId={character.id} xp={character.xp ?? 0} niveauTotal={niveauTotal} />
                {niveauXp > niveauTotal && niveauTotal > 0 && (
                  <MonterNiveau
                    personnageId={character.id}
                    niveauCible={niveauTotal + 1}
                    niveauXp={niveauXp}
                    conMod={conMod}
                    classes={classes.map(c => ({
                      id: c.characterClass.id,
                      nom: c.classe.nom,
                      niveau: c.characterClass.niveau,
                      de: getClasseInfo(c.classe.nom)?.de ?? 6,
                    }))}
                  />
                )}
              </div>

              {/* Portrait */}
              <PhotoPortrait
                personnageId={character.id}
                photoUrl={character.photoUrl ?? null}
                nom={character.nom}
                visuels={visuelsActifs}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid gap-4">

        {/* ── IDENTITÉ + CARACTÉRISTIQUES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section titre="Identité">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ['Race', race?.nom],
                ['Sexe', character.sexe],
                ['Âge', character.age ? `${character.age} ans` : null],
                ['Taille', character.taille],
                ['Poids', character.poids ? `${character.poids} lbs` : null],
                ['Yeux', character.yeux],
                ['Cheveux', character.cheveux],
                ['Dieu', god?.nom],
              ].map(([label, val]) => val ? (
                <div key={label as string} className="contents">
                  <dt className="text-stone-400">{label}</dt>
                  <dd className="text-stone-100 font-medium">{val}</dd>
                </div>
              ) : null)}
            </dl>
            {languages.length > 0 && (
              <p className="text-stone-400 text-xs mt-3">
                Langues : {languages.map(l => l.language.nom).join(', ')}
              </p>
            )}
          </Section>

          <Section titre="Caractéristiques">
            {abilityScores && (
              <div className="grid grid-cols-3 gap-2">
                <CaracteristiqueBadge label="FOR" base={abilityScores.forBase ?? 10} magic={abilityScores.forMagique ?? 0} sort={effCarac.FOR} />
                <CaracteristiqueBadge label="DEX" base={abilityScores.dexBase ?? 10} magic={abilityScores.dexMagique ?? 0} sort={effCarac.DEX} />
                <CaracteristiqueBadge label="CON" base={abilityScores.conBase ?? 10} magic={abilityScores.conMagique ?? 0} sort={effCarac.CON} />
                <CaracteristiqueBadge label="INT" base={abilityScores.intBase ?? 10} magic={abilityScores.intMagique ?? 0} sort={effCarac.INT} />
                <CaracteristiqueBadge label="SAG" base={abilityScores.sagBase ?? 10} magic={abilityScores.sagMagique ?? 0} sort={effCarac.SAG} />
                <CaracteristiqueBadge label="CHA" base={abilityScores.chaBase ?? 10} magic={abilityScores.chaMagique ?? 0} sort={effCarac.CHA} />
              </div>
            )}
          </Section>
        </div>

        {/* ── COMBAT ── */}
        <Section titre="Combat">
          {/* Barre d'actions de table : Repos · Butin · Journal. flex-wrap pour qu'un
              téléphone étroit renvoie le groupe à la ligne plutôt que de déborder. */}
          <div className="flex flex-wrap justify-between items-start gap-2 -mt-1 mb-2">
            <NuitDeRepos personnageId={character.id} estLanceur={casterClasses.length > 0} />
            <div className="flex items-center gap-2 shrink-0">
              <ButinDrawer personnageId={character.id} nomPersonnage={character.nom} />
              <JournalDrawer personnageId={character.id} nomPersonnage={character.nom} />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            <LiveHP personnageId={character.id} pvActuels={combatStats?.pvActuels ?? 0} pvMax={combatStats?.pvMax ?? 0} />
            <DetailBonus
              titre="Classe d'armure"
              base={10}
              total={caTotal}
              lignes={[
                ...(bonusArmurePortee !== 0 ? [{ label: 'armure', valeur: bonusArmurePortee }] : []),
                ...(bonusBouclierPorte !== 0 ? [{ label: 'bouclier', valeur: bonusBouclierPorte }] : []),
                { label: 'DEX', valeur: dexModCA, note: dexMod > maxDex ? `plafonné par l'armure (max +${maxDex}, DEX réel ${signedNum(dexMod)})` : undefined },
                ...((combatStats?.caNaturelle ?? 0) !== 0 ? [{ label: 'naturelle', valeur: combatStats!.caNaturelle! }] : []),
                ...((combatStats?.caDeflexion ?? 0) !== 0 ? [{ label: 'déflexion', valeur: combatStats!.caDeflexion! }] : []),
                ...((combatStats?.caDivers ?? 0) !== 0 ? [{ label: 'divers', valeur: combatStats!.caDivers! }] : []),
                ...(caMagique !== 0 ? [{ label: 'objets magiques', valeur: caMagique, note: magicItems.filter(({ item }) => (item.bonus ?? 0) !== 0).map(({ item }) => `${item.nom} +${item.bonus}`).join(', ') }] : []),
                ...contributionsCA.filter(c => c.effective !== 0).map(c => ({ label: `sort : ${c.nom}`, valeur: c.effective })),
                ...donsPassifs.caConditionnelle.map(b => ({ label: b.label, valeur: b.value, conditionnel: true, note: b.conditional })),
              ]}
            >
              <StatBlock label="CA" value={caTotal} sub={`(armure +${caArmure} · DEX ${dexModCA >= 0 ? '+' : ''}${dexModCA}${caMagique ? ` · mag +${caMagique}` : ''}${bonusSortsCA ? ` · sorts ${bonusSortsCA > 0 ? '+' : ''}${bonusSortsCA}` : ''})`} />
            </DetailBonus>
            <DetailBonus
              titre="Initiative"
              total={signedNum(initiativeTotal)}
              lignes={[
                { label: 'DEX', valeur: dexMod },
                ...donsPassifs.initiative.map(b => ({ label: b.label, valeur: b.value })),
                ...((combatStats?.initiativeBonus ?? 0) !== 0 ? [{ label: 'divers', valeur: combatStats!.initiativeBonus!, note: 'objets et bonus hors dons (ex. heaume) — les dons sont déjà comptés au-dessus' }] : []),
              ]}
            >
              <StatBlock label="Initiative" value={signedNum(initiativeTotal)} sub={donsPassifs.initiative.length > 0 ? 'DEX + don + divers' : 'DEX + divers'} />
            </DetailBonus>
            <StatBlock label="Déplacement" value={`${deplacement}m`} sub={bonusDepl > 0 ? `base ${baseDepl}m · sort +${bonusDepl}m` : deplacement !== baseDepl ? `base ${baseDepl}m, réduit armure` : undefined} />
            <StatBlock label="Karma" value={combatStats?.karma ?? 0} />
            <StatBlock label="Dé de vie" value={classes[0]?.classe.deVie ?? '—'} />
          </div>

          {/* Sorts actifs (CA, caractéristiques, déplacement, visuels, suivi) — le joueur retire selon le temps de jeu */}
          <EffetsSorts personnageId={character.id} contributions={[...contributionsCA, ...contributionsCarac, ...contributionsDepl, ...contributionsVisuels, ...contributionsSuivi]} />

          {/* Jets de sauvegarde */}
          {savingThrows && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Réflexes', carac: 'DEX', base: savingThrows.reflexesBase, mod: dexMod, mag: savingThrows.reflexesMagique, dons: donsPassifs.reflexes },
                { label: 'Vigueur', carac: 'CON', base: savingThrows.vigueurBase, mod: modSauvegarde(abilityScores?.conBase, abilityScores?.conMagique, race?.bonusCon ?? 0, effCarac.CON), mag: savingThrows.vigueurMagique, dons: donsPassifs.vigueur },
                { label: 'Volonté', carac: 'SAG', base: savingThrows.volonteBase, mod: modSauvegarde(abilityScores?.sagBase, abilityScores?.sagMagique, race?.bonusSag ?? 0, effCarac.SAG), mag: savingThrows.volonteMagique, dons: donsPassifs.volonte },
              ].map(({ label, carac, base, mod, mag, dons }) => {
                const totalJS = (base ?? 0) + mod + (mag ?? 0) + sommeBonus(dons)
                return (
                <DetailBonus
                  key={label}
                  titre={`Jet de ${label}`}
                  total={signedNum(totalJS)}
                  lignes={[
                    { label: 'base (classes)', valeur: base ?? 0 },
                    { label: carac, valeur: mod },
                    ...dons.map(b => ({ label: b.label, valeur: b.value })),
                    ...((mag ?? 0) !== 0 ? [{ label: 'magique', valeur: mag! }] : []),
                  ]}
                >
                  <div className="bg-stone-800/60 rounded p-3 text-center">
                    <div className="text-amber-500 text-xs uppercase tracking-wide">{label}</div>
                    <div className="text-white text-2xl font-bold">{signedNum(totalJS)}</div>
                    <div className="text-stone-500 text-xs">base {signedNum(base ?? 0)} · car. {signedNum(mod)}{sommeBonus(dons) > 0 ? ` · don ${signedNum(sommeBonus(dons))}` : ''}{(mag ?? 0) > 0 ? ` · mag. ${signedNum(mag ?? 0)}` : ''}</div>
                  </div>
                </DetailBonus>
                )
              })}
            </div>
          )}

          {/* PV attendus */}
          {niveauTotal > 0 && pvAttenduMin > 0 && (
            <div className="text-stone-600 text-xs mb-3">
              PV attendus niv.{niveauTotal} (d{primaryDe}{conMod >= 0 ? `+${conMod}` : conMod}/niv.{pvDons > 0 ? ` · Robustesse +${pvDons}` : ''}) :
              <span className="text-stone-500"> {pvAttenduMin}–{pvAttenduMax}</span>
              {combatStats?.pvMax != null && combatStats.pvMax < pvAttenduMin && (
                <span className="text-amber-600 ml-1">⚠ sous la normale</span>
              )}
              {combatStats?.pvMax != null && combatStats.pvMax > pvAttenduMax && (
                <span className="text-amber-400 ml-1">★ au-dessus du max théorique</span>
              )}
            </div>
          )}

          {/* Encombrement */}
          {poidsTotal > 0 && (
            <div className="text-stone-600 text-xs mb-3 flex items-center gap-2 flex-wrap">
              <span>Charge portée : <span className="text-stone-400">{poidsTotal.toFixed(1)} lbs</span></span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                chargeCategorie === 'légère' ? 'bg-green-900/40 text-green-400' :
                chargeCategorie === 'moyenne' ? 'bg-yellow-900/40 text-yellow-400' :
                chargeCategorie === 'lourde' ? 'bg-orange-900/40 text-orange-400' :
                'bg-red-900/40 text-red-400'
              }`}>{chargeCategorie}</span>
              <span className="text-stone-700">légère ≤{chargeLimites.legere} · moy. ≤{chargeLimites.moyenne} · lourde ≤{chargeLimites.lourde}</span>
            </div>
          )}

          {/* Attaques */}
          <div className="grid grid-cols-2 gap-3">
            <DetailBonus
              titre="Attaque au corps à corps"
              total={attackSeq(bbaCorpsTotal, rawBabCorps)}
              lignes={[
                { label: 'bonus de base (BAB)', valeur: rawBabCorps, note: rawBabCorps >= 6 ? 'BAB ≥ 6 : attaques multiples, chacune à −5 de la précédente' : undefined },
                { label: 'FOR', valeur: forMod },
              ]}
            >
              <div className="bg-stone-800/60 rounded p-3 text-left">
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-1">Corps à corps</div>
                <div className="text-white font-semibold">{attackSeq(bbaCorpsTotal, rawBabCorps)}</div>
                <div className="text-stone-500 text-xs mt-0.5">BAB {rawBabCorps} + FOR {signedNum(forMod)}</div>
              </div>
            </DetailBonus>
            <DetailBonus
              titre="Attaque à distance"
              total={attackSeq(bbaProjTotal, rawBabProj)}
              lignes={[
                { label: 'bonus de base (BAB)', valeur: rawBabProj, note: rawBabProj >= 6 ? 'BAB ≥ 6 : attaques multiples, chacune à −5 de la précédente' : undefined },
                { label: 'DEX', valeur: dexMod },
              ]}
            >
              <div className="bg-stone-800/60 rounded p-3 text-left">
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-1">Projectiles</div>
                <div className="text-white font-semibold">{attackSeq(bbaProjTotal, rawBabProj)}</div>
                <div className="text-stone-500 text-xs mt-0.5">BAB {rawBabProj} + DEX {signedNum(dexMod)}</div>
              </div>
            </DetailBonus>
          </div>
        </Section>

        {/* ── ARMES ── */}
        {weapons.length > 0 && (
          <Section titre="Armes">
            <div className="space-y-3">
              {weapons.map(({ weapon, charWeapon }) => {
                const isRanged   = weapon.portee != null
                const rawBab     = isRanged ? rawBabProj : rawBabCorps
                const bbaTotal   = isRanged ? bbaProjTotal : bbaCorpsTotal
                const wpnBonus   = charWeapon.bonusMagique ?? 0

                const { attackItems, damageItems } = getFeatWeaponBonuses(
                  feats.map(f => f.feat.nom),
                  weapon.nom,
                  isRanged
                )
                const featAtkBonus    = attackItems.reduce((s, b) => s + b.value, 0)
                const featDmgBonus   = damageItems.reduce((s, b) => s + b.value, 0)
                const munitionsBonus = isRanged ? (charWeapon.bonusMunitions ?? 0) : 0

                const coteDeForce   = charWeapon.coteDeForce ?? null
                const isComposite   = coteDeForce !== null || weapon.nom.toLowerCase().includes('composite')
                // Arc composite : FOR plafonné à la côte de Force ; autres distances : pas de FOR aux dégâts
                const abilityDmgMod = !isRanged
                  ? forMod
                  : coteDeForce !== null
                    ? Math.min(forMod, coteDeForce)
                    : isComposite ? forMod : 0
                const totalDmgMod   = wpnBonus + munitionsBonus + abilityDmgMod + featDmgBonus
                const deArme        = weapon.degats ?? '—'
                const dmgStr        = totalDmgMod === 0
                  ? deArme
                  : `${deArme}${totalDmgMod > 0 ? '+' : ''}${totalDmgMod}`

                // Nom affiché : (Force +N) pour la côte, +N pour la magie
                const nomDisplay = weapon.nom
                  + (coteDeForce !== null ? ` (Force +${coteDeForce})` : '')
                  + (wpnBonus > 0 ? ` +${wpnBonus}` : '')

                // Décomposition « Pourquoi +9/+5? » — mêmes termes que le calcul
                // du total juste dessous (attackSeq et dmgStr).
                const LABELS_DONS: Record<string, string> = {
                  'Préd.': 'don : Arme de prédilection',
                  'Maîtr. sup.': 'don : Maîtrise martiale sup.',
                  'Spéc.': 'don : Spécialisation martiale',
                  'Spéc. sup.': 'don : Spécialisation sup.',
                  'TBP': 'don : Tir à bout portant',
                }
                const ligneDon = (b: { label: string; value: number; conditional?: string }) => ({
                  label: LABELS_DONS[b.label] ?? b.label,
                  valeur: b.value,
                  note: b.conditional ? `seulement à ${b.conditional}` : undefined,
                })
                const atkLignes = [
                  { label: 'bonus de base (BAB)', valeur: rawBab, note: rawBab >= 6 ? 'BAB ≥ 6 : attaques multiples — la séquence vient du BAB seul (−5 chacune), tous les bonus s’appliquent à chaque attaque' : undefined },
                  { label: isRanged ? 'DEX' : 'FOR', valeur: isRanged ? dexMod : forMod },
                  ...(wpnBonus > 0       ? [{ label: 'arme magique',       valeur: wpnBonus }]       : []),
                  ...(munitionsBonus > 0 ? [{ label: 'munitions magiques', valeur: munitionsBonus }] : []),
                  ...attackItems.map(ligneDon),
                ]
                const dmgLignes = [
                  ...(abilityDmgMod !== 0 ? [{
                    label: isRanged ? 'FOR (arc composite)' : 'FOR',
                    valeur: abilityDmgMod,
                    note: coteDeForce !== null && forMod > coteDeForce
                      ? `FOR ${signedNum(forMod)} plafonnée par la côte de Force de l'arc (max +${coteDeForce})`
                      : undefined,
                  }] : []),
                  ...(wpnBonus > 0       ? [{ label: 'arme magique',       valeur: wpnBonus }]       : []),
                  ...(munitionsBonus > 0 ? [{ label: 'munitions magiques', valeur: munitionsBonus }] : []),
                  ...damageItems.map(ligneDon),
                ]

                return (
                  <div key={charWeapon.id} className="bg-stone-800/60 rounded p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-white font-semibold">
                            {nomDisplay}
                          </span>
                          <span className="text-stone-500 text-xs">Att.</span>
                          <DetailBonus
                            titre={`Attaque — ${nomDisplay}`}
                            total={attackSeq(bbaTotal + featAtkBonus + munitionsBonus, rawBab, wpnBonus)}
                            lignes={atkLignes}
                            inline
                          >
                            <span className="text-amber-300 font-bold text-sm">
                              {attackSeq(bbaTotal + featAtkBonus + munitionsBonus, rawBab, wpnBonus)}
                            </span>
                          </DetailBonus>
                        </div>
                        <div className="text-stone-400 text-xs mt-1 space-x-3">
                          <DetailBonus
                            titre={`Dégâts — ${nomDisplay}`}
                            base={deArme}
                            baseLabel="dé de l'arme"
                            total={dmgStr}
                            lignes={dmgLignes}
                            inline
                          >
                            <span>Dégâts : <span className="text-amber-300">{dmgStr}</span></span>
                          </DetailBonus>
                          <span>Critique : <span className="text-amber-300">{weapon.critiqueMin}-20 ×{weapon.critiqueMult}</span></span>
                          {weapon.portee && <span>Portée : <span className="text-amber-300">{weapon.portee}m</span></span>}
                          <span>Type : {weapon.typeDegats}</span>
                        </div>
                      </div>
                      <LiveAttaque personnageId={character.id} nomArme={nomDisplay} />
                    </div>
                    {charWeapon.proprietesSpeciales && (
                      <p className="text-purple-300 text-xs mt-2 italic">{charWeapon.proprietesSpeciales}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* ── SORTS (une section par classe lanceuse) ── */}
        {casterClasses.map(casterC => {
          const nomClasse = casterC.classe.nom
          const estDivin = DIVIN_CLASSES.includes(nomClasse)
          // Niveau de lanceur effectif : classe de base + classes de prestige à progression de sorts
          const niveauLanceur = getNiveauLanceurEffectif(
            nomClasse,
            classes.map(c => ({ classe: c.classe.nom, niveau: c.characterClass.niveau }))
          ) || casterC.characterClass.niveau
          const estDefaut = classeSortDefaut != null && casterC.characterClass.id === classeSortDefaut.characterClass.id
          // Sorts de cette classe : attribution explicite, ou sans attribution pour la classe par défaut
          const sortsClasse = spells.filter(s =>
            s.charSpell.classe === nomClasse || (s.charSpell.classe == null && estDefaut)
          )
          const customSpells = sortsClasse
            .filter(s => s.charSpell.estConnu === 2)
            .map(s => ({
              charSpellId: s.charSpell.id,
              nom: s.spell.nom,
              ecole: s.spell.ecole ?? '',
              niveau: s.charSpell.niveau ?? 0,
              estPersonnalise: true as const,
            }))
          const divineAvailableSpells = estDivin
            ? availableSpellsFor(nomClasse, niveauLanceur, customSpells)
            : undefined
          const byNiveau = sortsClasse.reduce<Record<number, typeof spells>>((acc, s) => {
            const n = s.charSpell.niveau ?? 0
            acc[n] = acc[n] ?? []
            acc[n].push(s)
            return acc
          }, {})
          const niveaux = Object.keys(byNiveau).map(Number).sort((a, b) => a - b)
          const niveauLabel = (n: number) => n === 0 ? 'Oraisons (niv. 0)' : `Niveau ${n}`
          const spellsMapped = sortsClasse.map(s => {
            // Deux catalogues cohabitent : la définition enregistrée en base
            // (spell.description) et celle du catalogue statique SORTS_DND35.
            // Même ordre de priorité que l'affichage de la fiche juste dessous.
            const isCustom = s.charSpell.estConnu === 2
            const ref = !isCustom ? sortsRefMap.get(s.spell.nom) : undefined
            const meta = [
              s.spell.composantes || ref?.composantes,
              s.spell.portee || ref?.portee,
              s.spell.duree || ref?.duree,
              s.spell.jetDeSauvegarde ? `JS : ${s.spell.jetDeSauvegarde}` : null,
            ].filter(Boolean).join(' · ')
            return {
              charSpellId: s.charSpell.id,
              nom: s.spell.nom,
              niveau: s.charSpell.niveau ?? 0,
              ecole: s.spell.ecole ?? '',
              estPrepare: s.charSpell.estPrepare ?? 0,
              description: !isCustom ? (s.spell.description || ref?.description || null) : null,
              meta: meta || null,
            }
          })
          const maxNiveau = divineAvailableSpells
            ? Math.max(...divineAvailableSpells.map(s => s.niveau), 0)
            : 9
          // Compteur d'emplacements par niveau de sort.
          // Le total préparé est la SOMME des estPrepare (un sort préparé deux fois
          // vaut 2) — comptePreparations s'en charge. Le dénominateur vient de
          // getEmplacementsNiveau, le même calcul que la modale 🙏 Prier / 📖 Étudier.
          // La fiche est un composant serveur et depenseSort appelle revalidatePath :
          // le compteur décroît donc tout seul dès qu'un sort est lancé.
          const estSpontane = nomClasse === 'Ensorceleur' || nomClasse === 'Barde'
          // DD des sorts de cette classe : 10 + niveau du sort + mod. de la caractéristique d'incantation
          const inc = CARAC_INCANTATION[nomClasse]
          const aDomaine = Boolean(combatStats?.domaine1 || combatStats?.domaine2)
          const compteurs = Array.from({ length: 10 }, (_, n) => ({
            niveau: n,
            prepares: comptePreparations(spellsMapped, n),
            emplacements: getEmplacementsNiveau(nomClasse, niveauLanceur, n),
          })).filter(c => c.emplacements > 0 || c.prepares > 0)
          return (
            <Section
              key={casterC.characterClass.id}
              titre={casterClasses.length > 1 ? `Sorts — ${nomClasse} ${casterC.characterClass.niveau}` : 'Sorts'}
              action={
                <PreparerSorts
                  personnageId={character.id}
                  classe={nomClasse}
                  niveau={niveauLanceur}
                  spells={spellsMapped}
                  availableSpells={divineAvailableSpells}
                  classeAttribution={casterClasses.length > 1 ? nomClasse : undefined}
                />
              }
            >
              {ARCANE_CLASSES.includes(nomClasse) && risqueEchecTotal > 0 && (
                <div className="mb-3 flex items-center gap-2 bg-red-950/60 border border-red-800/50 rounded-lg px-3 py-2">
                  <span className="text-red-400 text-lg">⚠</span>
                  <span className="text-red-300 text-sm font-medium">Risque d'échec arcanique : <span className="text-red-200 font-bold">{risqueEchecTotal}%</span></span>
                  <span className="text-red-500 text-xs">(armure portée)</span>
                </div>
              )}
              {/* Compteur d'emplacements : préparés restants / emplacements du jour */}
              {compteurs.length > 0 && (
                <div className="mb-3 p-2 bg-stone-900/60 rounded-lg border border-stone-700/40">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-stone-500 text-xs mr-1">
                      {estSpontane ? 'Emplacements restants :' : 'Sorts préparés :'}
                    </span>
                    {compteurs.map(({ niveau: n, prepares, emplacements }) => {
                      const epuise = prepares === 0 && emplacements > 0
                      const depasse = prepares > emplacements
                      return (
                        <span
                          key={n}
                          title={
                            depasse
                              ? `Niveau ${n} : ${prepares} préparés pour ${emplacements} emplacements de base — le surplus vient d'une caractéristique élevée ou du domaine.`
                              : `Niveau ${n} : ${prepares} sur ${emplacements} emplacements de base`
                          }
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            depasse
                              ? 'bg-violet-900/30 border-violet-700/50 text-violet-300'
                              : epuise
                                ? 'bg-stone-800/60 border-stone-700/50 text-stone-600'
                                : 'bg-amber-900/30 border-amber-800/40 text-amber-300'
                          }`}
                        >
                          <span className="text-stone-500">{n === 0 ? 'Oraisons ' : `Niv. ${n} `}</span>
                          <span className="font-bold font-mono">{prepares}</span>
                          <span className="opacity-60 font-mono">/{emplacements}</span>
                        </span>
                      )
                    })}
                  </div>
                  <p className="text-stone-600 text-[11px] mt-1.5 leading-snug">
                    Emplacements <strong>de base</strong> — hors bonus de caractéristique élevée
                    {estDivin && aDomaine && <> et hors emplacement de domaine (+1 par niveau de sort ≥ 1, à gérer vous-même)</>}.
                  </p>
                </div>
              )}

              {sortsClasse.length === 0 ? (
                <>
                  <p className="text-stone-600 text-sm italic">
                    {estDivin
                      ? 'Aucun sort préparé — cliquez sur Prier pour commencer la journée.'
                      : 'Aucun sort dans le grimoire.'}
                  </p>
                  <AjouterSort personnageId={character.id} maxNiveau={maxNiveau} classe={casterClasses.length > 1 ? nomClasse : undefined} />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {niveaux.map(n => (
                      <div key={n}>
                        <div className="text-amber-500 text-xs uppercase tracking-widest font-bold mb-2">{niveauLabel(n)}</div>
                        <div className="space-y-1">
                          {byNiveau[n].map(({ spell, charSpell }) => {
                            const isCustom = charSpell.estConnu === 2
                            const sortRef = !isCustom ? sortsRefMap.get(spell.nom) : undefined
                            const desc = spell.description || sortRef?.description || null
                            const comp = spell.composantes || sortRef?.composantes || null
                            const port = spell.portee || sortRef?.portee || null
                            const dur = spell.duree || sortRef?.duree || null
                            const js = spell.jetDeSauvegarde || null
                            // Pas de DD quand la fiche dit « aucun » jet de sauvegarde
                            // (ex. Projectile magique). Champ vide = fiche pas encore
                            // relevée : on affiche, avec la nuance dans l'infobulle.
                            const dd = inc && !sansJetDeSauvegarde(js) ? 10 + n + inc.mod : null
                            const meta = [comp, port, dur, js ? `JS : ${js}` : null].filter(Boolean).join(' · ')
                            return (
                              <LigneSort
                                key={charSpell.id}
                                description={!isCustom ? desc : null}
                                meta={meta || null}
                                entete={
                                  <>
                                    <span className={`text-sm font-medium ${(charSpell.estPrepare ?? 0) > 0 ? 'text-amber-200' : 'text-stone-400'}`}>{spell.nom}</span>
                                    {isCustom && (
                                      <>
                                        <span className="text-amber-700 text-xs" title="Sort personnalisé">★</span>
                                        <SupprimerSort charSpellId={charSpell.id} personnageId={character.id} />
                                      </>
                                    )}
                                    {spell.ecole && <span className="text-stone-600 text-xs">· {spell.ecole}</span>}
                                    {dd !== null && inc && (
                                      <span
                                        className="text-cyan-600 text-xs font-medium whitespace-nowrap"
                                        title={`Degré de difficulté du jet de sauvegarde : 10 + niveau du sort (${n}) + mod. ${inc.carac} (${signedNum(inc.mod)})${js ? ` — JS : ${js}` : `. Fiche du sort pas encore relevée : si elle n'appelle aucun jet de sauvegarde, ce DD ne sert pas.`}`}
                                      >
                                        · DD {dd}
                                      </span>
                                    )}
                                    {!isCustom && (
                                      <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(spell.nom)}`} target="_blank" rel="noopener noreferrer" title="Chercher ce sort sur le web" className="text-stone-700 hover:text-amber-400 transition-colors text-xs">🔍</a>
                                    )}
                                  </>
                                }
                                actions={
                                  <>
                                    {spellEffects.some(e => e.nom === spell.nom) && (
                                      <span className="text-xs text-violet-300 bg-violet-900/40 border border-violet-700 rounded px-1.5 py-0.5 ml-2" title="Effet actif sur la CA — se retire dans la section Combat">🛡 actif</span>
                                    )}
                                    <LiveSort charSpellId={charSpell.id} personnageId={character.id} estPrepare={charSpell.estPrepare ?? 0} />
                                  </>
                                }
                              >
                                {isCustom && (
                                  <DescriptionSort sortId={spell.id} description={spell.description ?? null} personnageId={character.id} />
                                )}
                              </LigneSort>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <AjouterSort personnageId={character.id} maxNiveau={maxNiveau} classe={casterClasses.length > 1 ? nomClasse : undefined} />
                </>
              )}
            </Section>
          )
        })}

        {/* ── COMPÉTENCES + DONS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.length > 0 && (
            <Section titre="Compétences">
              <div className="space-y-1">
                {skills.map(({ skill, charSkill }) => {
                  const carac = abilityScores
                    ? { FOR: Math.floor((((abilityScores.forBase ?? 10) + (abilityScores.forMagique ?? 0) + effCarac.FOR) - 10) / 2),
                        DEX: Math.floor((((abilityScores.dexBase ?? 10) + (abilityScores.dexMagique ?? 0) + effCarac.DEX) - 10) / 2),
                        CON: Math.floor((((abilityScores.conBase ?? 10) + (abilityScores.conMagique ?? 0) + effCarac.CON) - 10) / 2),
                        INT: Math.floor((((abilityScores.intBase ?? 10) + (abilityScores.intMagique ?? 0) + effCarac.INT) - 10) / 2),
                        SAG: Math.floor((((abilityScores.sagBase ?? 10) + (abilityScores.sagMagique ?? 0) + effCarac.SAG) - 10) / 2),
                        CHA: Math.floor((((abilityScores.chaBase ?? 10) + (abilityScores.chaMagique ?? 0) + effCarac.CHA) - 10) / 2) }
                    : { FOR: 0, DEX: 0, CON: 0, INT: 0, SAG: 0, CHA: 0 }
                  const caracSkill = caracteristiqueDe(skill.nom, skill.caracteristique)
                  const caracMod = carac[caracSkill as keyof typeof carac] ?? 0
                  const hasArmorMalus = malusArmure > 0 && COMPETENCES_MALUS_ARMURE.includes(skill.nom)
                  const donsComp = donsPassifs.competences.filter(d => d.skillNoms.includes(skill.nom)).map(d => d.item)
                  const total = (charSkill.rangsInvestis ?? 0) + caracMod + (charSkill.modifDivers ?? 0) + sommeBonus(donsComp) - (hasArmorMalus ? malusArmure : 0)
                  return (
                    <div key={skill.id} className="flex items-center justify-between py-1 border-b border-stone-800 last:border-0">
                      <div>
                        <span className="text-stone-200 text-sm">{skill.nom}</span>
                        <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(skill.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="ml-1.5 text-stone-700 hover:text-amber-400 transition-colors text-xs">🔍</a>
                        <span className="text-stone-500 text-xs ml-2">({caracSkill})</span>
                        {hasArmorMalus && <span className="text-red-500 text-xs ml-1" title={`Malus armure −${malusArmure}`}>−{malusArmure}⚔</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 text-xs">{charSkill.rangsInvestis} rangs</span>
                        <DetailBonus
                          inline
                          titre={skill.nom}
                          total={signedNum(total)}
                          lignes={[
                            { label: 'rangs investis', valeur: charSkill.rangsInvestis ?? 0 },
                            { label: caracSkill, valeur: caracMod },
                            ...donsComp.map(b => ({ label: b.label, valeur: b.value })),
                            ...((charSkill.modifDivers ?? 0) !== 0 ? [{ label: 'divers', valeur: charSkill.modifDivers! }] : []),
                            ...(hasArmorMalus ? [{ label: 'malus d’armure', valeur: -malusArmure }] : []),
                          ]}
                        >
                          <span className={`font-bold w-8 text-right inline-block ${hasArmorMalus ? 'text-red-400' : 'text-amber-300'}`}>{signedNum(total)}</span>
                        </DetailBonus>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {feats.length > 0 && (
            <Section titre="Dons">
              <div className="space-y-2">
                {feats.map(({ feat }) => {
                  const featDef = FEATS_DND35.find(f => f.nom === feat.nom)
                  const donsNoms = feats.map(f => f.feat.nom)
                  const absScores = abilityScores ? {
                    for: (abilityScores.forBase ?? 10) + (abilityScores.forMagique ?? 0),
                    dex: (abilityScores.dexBase ?? 10) + (abilityScores.dexMagique ?? 0),
                    con: (abilityScores.conBase ?? 10) + (abilityScores.conMagique ?? 0),
                    int: (abilityScores.intBase ?? 10) + (abilityScores.intMagique ?? 0),
                    sag: (abilityScores.sagBase ?? 10) + (abilityScores.sagMagique ?? 0),
                    cha: (abilityScores.chaBase ?? 10) + (abilityScores.chaMagique ?? 0),
                  } : undefined
                  const manquants = featDef ? verifierPrerequisDon(featDef, donsNoms, bbaBase, absScores) : []
                  return (
                    <div key={feat.id} className="bg-stone-800/40 rounded p-2">
                      <div className="flex items-start gap-1.5">
                        <span className="text-stone-200 text-sm font-medium">{feat.nom}</span>
                        <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(feat.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="text-stone-700 hover:text-amber-400 transition-colors text-xs mt-0.5">🔍</a>
                        {manquants.length > 0 && (
                          <span className="text-red-400 text-xs ml-auto shrink-0" title={`Prérequis manquants : ${manquants.join(', ')}`}>⚠ {manquants.join(', ')}</span>
                        )}
                      </div>
                      {(feat.effetMecanique || getFeatDescription(feat.nom)) && (
                        <div className="text-amber-400 text-xs mt-0.5">
                          {feat.effetMecanique ?? getFeatDescription(feat.nom)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}
        </div>

        {/* ── CAPACITÉS DE CLASSE ── */}
        {(() => {
          const allCaps = classes.flatMap(c =>
            getCapacitesPourPersonnage(c.classe.nom, c.characterClass.niveau).map(cap => ({
              ...cap,
              classe: c.classe.nom,
            }))
          )
          if (allCaps.length === 0) return null
          return (
            <Section titre="Capacités de classe">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allCaps.map((cap, i) => (
                  <div key={i} className="bg-stone-800/40 rounded p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-300 text-sm font-medium">{cap.nom}</span>
                      <span className="text-stone-600 text-xs">niv.{cap.niveau}</span>
                      {classes.length > 1 && <span className="text-stone-700 text-xs">· {cap.classe}</span>}
                    </div>
                    <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">{cap.detail}</p>
                  </div>
                ))}
              </div>
            </Section>
          )
        })()}

        {/* ── DOMAINES DIVINS ── */}
        {(d1Info || d2Info) && (
          <Section titre="Domaines divins">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[d1Info, d2Info].filter(Boolean).map((d, i) => d && (
                <div key={i} className="bg-stone-800/40 rounded-lg p-3">
                  <div className="text-amber-300 font-semibold text-sm mb-1">{d.nom}</div>
                  <p className="text-stone-400 text-xs mb-2 leading-relaxed">{d.pouvoir}</p>
                  <div className="text-stone-600 text-xs uppercase tracking-widest mb-1">Sorts de domaine</div>
                  <div className="space-y-0.5">
                    {d.sorts.map((s, idx) => {
                      const jsDomaine = jsParNomSort.get(normNomSort(s)) ?? null
                      return (
                        <div key={idx} className="flex items-baseline gap-1.5">
                          <span className="text-amber-700 text-xs shrink-0">Niv.{idx + 1}</span>
                          <span className="text-stone-300 text-xs">{s}</span>
                          {!sansJetDeSauvegarde(jsDomaine) && (
                            <span
                              className="text-cyan-600 text-xs shrink-0"
                              title={`DD du jet de sauvegarde : 10 + niveau du sort (${idx + 1}) + mod. SAG (${signedNum(sagMod)})${jsDomaine ? ` — JS : ${jsDomaine}` : ''}`}
                            >
                              DD {10 + (idx + 1) + sagMod}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── ARMURE + OBJETS MAGIQUES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {armor.length > 0 && (
            <Section titre="Armure portée">
              {armor.map(({ armor: a, charArmor }) => (
                <div key={charArmor.id} className="bg-stone-800/60 rounded p-3">
                  <div className="text-white font-semibold">
                    {a.nom}{charArmor.bonusMagique ? ` +${charArmor.bonusMagique}` : ''}
                  </div>
                  <div className="text-stone-400 text-xs mt-1 space-x-3">
                    <span>Bonus CA : <span className="text-amber-300">+{(a.bonusArmure ?? 0) + (charArmor.bonusMagique ?? 0)}</span></span>
                    {a.maxDex != null && <span>Max DEX : <span className="text-amber-300">+{a.maxDex}</span></span>}
                    {(a.malusCompetence ?? 0) !== 0 && <span>Malus compétences : <span className="text-red-400">−{Math.abs(a.malusCompetence ?? 0)}</span></span>}
                    {(a.risqueEchecMagique ?? 0) > 0 && <span>Échec arcanique : <span className="text-red-400">{a.risqueEchecMagique}%</span></span>}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {magicItems.length > 0 && (
            <Section titre="Équipement magique">
              <div className="space-y-1.5">
                {magicItems.map(({ item, charItem }) => (
                  <div key={charItem.id} className="flex items-center gap-2 py-1 border-b border-stone-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-purple-300 text-sm font-medium">{item.nom}</span>
                      <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(item.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="ml-1.5 text-stone-700 hover:text-amber-400 transition-colors text-xs">🔍</a>
                      {charItem.emplacement && <span className="text-stone-600 text-xs ml-2">{charItem.emplacement}</span>}
                      {item.description && (
                        <p className="text-stone-500 text-xs mt-0.5 truncate">{item.description}</p>
                      )}
                      {/* Note propre à CE personnage (provenance du butin), comme pour les potions */}
                      {charItem.notes && (
                        <p className="text-amber-600 text-xs italic mt-0.5">{charItem.notes}</p>
                      )}
                    </div>
                    {(charItem.chargesRestantes != null || item.chargesMax != null) && (
                      <LiveCharge
                        charItemId={charItem.id}
                        personnageId={character.id}
                        chargesRestantes={charItem.chargesRestantes ?? item.chargesMax ?? 0}
                        chargesMax={item.chargesMax ?? charItem.chargesRestantes ?? 0}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── POTIONS + MONNAIE ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {potions.length > 0 && (
            <Section titre="Potions">
              <div className="space-y-2">
                {potions.map(({ potion, charPotion }) => (
                  <div key={charPotion.id} className="flex items-start justify-between bg-stone-800/40 rounded p-2">
                    <div>
                      <span className="text-green-300 text-sm">{potion.nom}</span>
                      {potion.sortEffet && (
                        <p className="text-stone-400 text-xs mt-0.5">{potion.sortEffet}</p>
                      )}
                      {potion.description && (
                        <p className="text-stone-500 text-xs mt-0.5">{potion.description}</p>
                      )}
                      {charPotion.notes && (
                        <p className="text-amber-600 text-xs italic mt-0.5">{charPotion.notes}</p>
                      )}
                    </div>
                    <LivePotion charPotionId={charPotion.id} personnageId={character.id} chargesRestantes={charPotion.chargesRestantes ?? 1} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section titre="Trésor & Compagnons">
            {currency && (
              <div className="mb-4">
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-2">Monnaie</div>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: 'PP', nom: 'Platine',  val: currency.pp },
                    { label: 'PO', nom: 'Or',       val: currency.po },
                    { label: 'PE', nom: 'Électrum',  val: currency.pe },
                    { label: 'PA', nom: 'Argent',   val: currency.pa },
                    { label: 'PC', nom: 'Cuivre',   val: currency.pc },
                    { label: 'PM', nom: 'Mithral',  val: currency.pm },
                  ].filter(c => Number(c.val) > 0).map(({ label, nom, val }) => (
                    <div key={label} className="bg-stone-800/60 rounded px-3 py-2 text-center">
                      <div className="text-amber-300 text-sm font-bold">{Number(val).toLocaleString('fr-FR')}</div>
                      <div className="text-stone-500 text-xs font-semibold">{label}</div>
                      <div className="text-stone-600 text-xs">{nom}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gems.length > 0 && (
              <div className="mb-4">
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-2">Gemmes</div>
                <div className="space-y-1">
                  {gems.map(g => {
                    const val = parseFloat(g.valeur?.toString() ?? '0')
                    const qte = g.quantite ?? 1
                    return (
                      <div key={g.id} className="flex items-baseline justify-between bg-stone-800/40 rounded px-2 py-1.5">
                        <div>
                          <span className="text-cyan-300 text-sm">{g.nom}</span>
                          {qte > 1 && <span className="text-stone-500 text-xs ml-1">×{qte}</span>}
                          {g.notes && <span className="text-stone-600 text-xs italic ml-2">{g.notes}</span>}
                        </div>
                        <span className="text-amber-300 text-sm font-mono shrink-0 ml-2">
                          {formatPo(val)} {uniteCourte(g.unite ?? 'po')}
                          {qte > 1 && <span className="text-stone-500 text-xs"> ch.</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="text-right text-xs text-stone-400 mt-1.5">
                  Total :{' '}
                  <span className="text-amber-300 font-bold font-mono">{formatPo(totalGem.po)} po</span>
                  {totalGem.horsTotal.map(h => (
                    <span key={h.unite} className="text-amber-300 font-bold font-mono"> + {formatPo(h.total)} {uniteCourte(h.unite)}</span>
                  ))}
                </div>
              </div>
            )}

            {creatures.length > 0 && (
              <div className="mb-3">
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-2">Monture</div>
                {creatures.map(({ creature, charCreature }) => (
                  <div key={charCreature.id} className="bg-stone-800/40 rounded p-2">
                    <span className="text-white font-medium">{charCreature.nomPersonnalise}</span>
                    <span className="text-stone-400 text-sm ml-2">({creature.nom})</span>
                    <span className="text-stone-500 text-xs ml-2">· {charCreature.role}</span>
                  </div>
                ))}
              </div>
            )}

            {companions.length > 0 && (
              <div>
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-2">Compagnons</div>
                <div className="space-y-1">
                  {companions.map(c => (
                    <div key={c.id} className="bg-stone-800/40 rounded p-2 text-sm">
                      <span className="text-white font-medium">{c.nom}</span>
                      {c.race && <span className="text-stone-400 ml-2">{c.race}</span>}
                      {c.joueur && <span className="text-stone-500 ml-2 text-xs">(joué par {c.joueur})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ── TRAITS RACIAUX ── */}
        {racialFeatures.length > 0 && (
          <Section titre={`Traits raciaux — ${race?.nom ?? 'Race'}`}>
            <div className="grid gap-2 sm:grid-cols-2">
              {racialFeatures.map(f => (
                <div key={f.id} className="bg-stone-800/40 rounded-lg px-3 py-2">
                  <div className="text-amber-200 text-sm font-semibold">{f.nom}</div>
                  {f.description && <div className="text-stone-400 text-xs mt-0.5 leading-relaxed">{f.description}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── HISTORIQUE ── */}
        {character.historique && (
          <Section titre="Historique">
            <p className="text-stone-300 text-sm whitespace-pre-wrap">{character.historique}</p>
          </Section>
        )}

        {/* ── NOTES ── */}
        <Section titre="Note générale">
          <LiveNotes personnageId={character.id} notes={character.notes ?? ''} />
        </Section>
      </main>
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCharacter } from '@/lib/queries/character'
import { DeleteButton } from '@/components/fiche/DeleteButton'
import { getClasseInfo, getSortsSlotsParJour } from '@/lib/dnd35/classes'
import { getMultiClassBab, XP_PAR_NIVEAU } from '@/lib/dnd35/rules'
import { getNiveauLanceurEffectif } from '@/lib/dnd35/prestige-classes'
import { getCapacitesPourPersonnage } from '@/lib/dnd35/class-features'
import { SORTS_DND35, type ClasseSortKey } from '@/lib/dnd35/spells'
import { getFeatWeaponBonuses, getFeatDescription } from '@/lib/dnd35/feat-bonuses'
import { getDomaineInfo } from '@/lib/dnd35/domains'
import { getChargeCategorie, getChargeLimites } from '@/lib/dnd35/encumbrance'
import { FEATS_DND35, verifierPrerequisDon } from '@/lib/dnd35/feats'

export const dynamic = 'force-dynamic'
import { Section } from '@/components/fiche/Section'
import { CaracteristiqueBadge } from '@/components/fiche/CaracteristiqueBadge'
import { StatBlock } from '@/components/fiche/StatBlock'
import { PhotoPortrait } from '@/components/fiche/PhotoPortrait'
import { LiveHP } from '@/components/fiche/LiveHP'
import { LiveSort } from '@/components/fiche/LiveSort'
import { LivePotion } from '@/components/fiche/LivePotion'
import { LiveCharge } from '@/components/fiche/LiveCharge'
import { LiveNotes } from '@/components/fiche/LiveNotes'
import { PreparerSorts } from '@/components/fiche/PreparerSorts'
import { AjouterSort } from '@/components/fiche/AjouterSort'
import { SupprimerSort } from '@/components/fiche/SupprimerSort'
import { DescriptionSort } from '@/components/fiche/DescriptionSort'
import { EffetsSorts } from '@/components/fiche/EffetsSorts'
import { LiveAttaque } from '@/components/fiche/LiveAttaque'
import { JournalDrawer } from '@/components/fiche/JournalDrawer'
import { calculeBonusEffetsCA, calculeBonusEffetsCarac } from '@/lib/dnd35/spell-effects'

function modif(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function signedNum(n: number) {
  return n >= 0 ? `+${n}` : `${n}`
}

export default async function FichePersonnage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCharacter(Number(id))
  if (!data) notFound()

  const { character, race, clan, god, classes, abilityScores, combatStats, savingThrows, skills, feats, racialFeatures, spells, weapons, armor, magicItems, potions, currency, languages, creatures, companions, spellEffects } = data

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
  const caMagique = magicItems.reduce((sum, { item }) => sum + (item.bonus ?? 0), 0)
  const caArmure = armor.reduce((sum, { armor: a, charArmor }) => sum + (a.bonusArmure ?? 0) + (charArmor.bonusMagique ?? 0), 0)
  const maxDex = armor.length > 0 ? Math.min(...armor.map(({ armor: a }) => a.maxDex ?? 10)) : 10
  const dexModCA = Math.min(dexMod, maxDex)
  // Malus de compétence cumulé (valeurs stockées en négatif en DB — on prend la valeur absolue)
  const malusArmure = armor.reduce((sum, { armor: a }) => sum + Math.abs(a.malusCompetence ?? 0), 0)
  // Risque d'échec arcanique cumulé (s'additionnent si plusieurs armures)
  const risqueEchecTotal = armor.reduce((sum, { armor: a }) => sum + (a.risqueEchecMagique ?? 0), 0)
  // Compétences pénalisées par le malus d'armure (PHB 3.5)
  const COMPETENCES_MALUS_ARMURE = ['Acrobaties', 'Discrétion', 'Déplacement silencieux', 'Escalade', 'Évasion', 'Natation', 'Saut', 'Tour de passe-passe']
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
  const initiativeTotal = combatStats ? dexMod + (combatStats.initiativeBonus ?? 0) : 0

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
  const xpProchain = XP_PAR_NIVEAU[niveauTotal + 1] ?? null

  // PV attendus : plage selon dé de vie et CON (après niveauTotal)
  const conT = (abilityScores?.conBase ?? 10) + (abilityScores?.conMagique ?? 0) + (race?.bonusCon ?? 0) + effCarac.CON
  const conMod = Math.floor((conT - 10) / 2)
  const primaryDe = classes[0] ? (getClasseInfo(classes[0].classe.nom)?.de ?? 6) : 6
  const pvAttenduMax = niveauTotal > 0 ? niveauTotal * (primaryDe + conMod) : 0
  const pvAttenduMin = niveauTotal > 0 ? Math.max(niveauTotal, niveauTotal * (1 + conMod)) : 0

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

  // Pour les multi-classés : afficher les options de prochain niveau
  const optsNiveauSuivant = classes.map(c => `${c.classe.nom} ${c.characterClass.niveau + 1}`)
  const prochainesOptions = classes.length > 1 && xpProchain != null
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
      .map(s => ({ nom: s.nom, ecole: s.ecole, niveau: s.niveaux[classeKey]!, estPersonnalise: false as const }))
    // Fusionner avec les sorts personnalisés (en évitant les doublons)
    const nomsPredefined = new Set(predefined.map(s => s.nom))
    const customExtra = customSpells.filter(cs => !nomsPredefined.has(cs.nom))
    return [...predefined, ...customExtra]
      .sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom, 'fr'))
  }

  const sortsRefMap = new Map(SORTS_DND35.map(s => [s.nom, s]))

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* ── EN-TÊTE ── */}
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-8 px-6">
        <div className="max-w-5xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 text-sm transition-colors">
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
                  {xpProchain != null ? `Prochain niveau : ${xpProchain.toLocaleString('fr-FR')} XP` : 'Niveau maximum atteint'}
                </div>
                {prochainesOptions && (
                  <div className="text-stone-600 text-xs mt-0.5">→ {prochainesOptions}</div>
                )}
                <div className="mt-2 w-48 bg-stone-800 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: xpProchain != null ? `${Math.min(100, ((character.xp ?? 0) / xpProchain) * 100)}%` : '100%' }}
                  />
                </div>
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
          <div className="flex justify-end -mt-1 mb-2">
            <JournalDrawer personnageId={character.id} nomPersonnage={character.nom} />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            <LiveHP personnageId={character.id} pvActuels={combatStats?.pvActuels ?? 0} pvMax={combatStats?.pvMax ?? 0} />
            <StatBlock label="CA" value={caTotal} sub={`(armure +${caArmure} · DEX ${dexModCA >= 0 ? '+' : ''}${dexModCA}${caMagique ? ` · mag +${caMagique}` : ''}${bonusSortsCA ? ` · sorts ${bonusSortsCA > 0 ? '+' : ''}${bonusSortsCA}` : ''})`} />
            <StatBlock label="Initiative" value={signedNum(initiativeTotal)} sub="DEX + divers + Science" />
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
                { label: 'Réflexes', base: savingThrows.reflexesBase, mod: dexMod, mag: savingThrows.reflexesMagique },
                { label: 'Vigueur', base: savingThrows.vigueurBase, mod: Math.floor(((abilityScores?.conBase ?? 10) + (abilityScores?.conMagique ?? 0) + effCarac.CON - 10) / 2), mag: savingThrows.vigueurMagique },
                { label: 'Volonté', base: savingThrows.volonteBase, mod: Math.floor(((abilityScores?.sagBase ?? 10) + (abilityScores?.sagMagique ?? 0) + effCarac.SAG - 10) / 2), mag: savingThrows.volonteMagique },
              ].map(({ label, base, mod, mag }) => (
                <div key={label} className="bg-stone-800/60 rounded p-3 text-center">
                  <div className="text-amber-500 text-xs uppercase tracking-wide">{label}</div>
                  <div className="text-white text-2xl font-bold">{signedNum((base ?? 0) + mod + (mag ?? 0))}</div>
                  <div className="text-stone-500 text-xs">base {signedNum(base ?? 0)} · car. {signedNum(mod)}{(mag ?? 0) > 0 ? ` · mag. ${signedNum(mag ?? 0)}` : ''}</div>
                </div>
              ))}
            </div>
          )}

          {/* PV attendus */}
          {niveauTotal > 0 && pvAttenduMin > 0 && (
            <div className="text-stone-600 text-xs mb-3">
              PV attendus niv.{niveauTotal} (d{primaryDe}{conMod >= 0 ? `+${conMod}` : conMod}/niv.) :
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
            <div className="bg-stone-800/60 rounded p-3">
              <div className="text-amber-500 text-xs uppercase tracking-wide mb-1">Corps à corps</div>
              <div className="text-white font-semibold">{attackSeq(bbaCorpsTotal, rawBabCorps)}</div>
              <div className="text-stone-500 text-xs mt-0.5">BAB {rawBabCorps} + FOR {signedNum(forMod)}</div>
            </div>
            <div className="bg-stone-800/60 rounded p-3">
              <div className="text-amber-500 text-xs uppercase tracking-wide mb-1">Projectiles</div>
              <div className="text-white font-semibold">{attackSeq(bbaProjTotal, rawBabProj)}</div>
              <div className="text-stone-500 text-xs mt-0.5">BAB {rawBabProj} + DEX {signedNum(dexMod)}</div>
            </div>
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
                const dmgStr        = totalDmgMod === 0
                  ? weapon.degats
                  : `${weapon.degats}${totalDmgMod > 0 ? '+' : ''}${totalDmgMod}`

                // Nom affiché : (Force +N) pour la côte, +N pour la magie
                const nomDisplay = weapon.nom
                  + (coteDeForce !== null ? ` (Force +${coteDeForce})` : '')
                  + (wpnBonus > 0 ? ` +${wpnBonus}` : '')

                const atkBreakdown = [
                  { label: 'BAB',                    value: rawBab },
                  { label: isRanged ? 'DEX' : 'FOR', value: isRanged ? dexMod : forMod },
                  ...(wpnBonus > 0       ? [{ label: 'mag.',  value: wpnBonus }]       : []),
                  ...(munitionsBonus > 0 ? [{ label: 'fl.',   value: munitionsBonus }] : []),
                  ...attackItems,
                ].filter(b => b.value !== 0)

                const dmgBreakdown = [
                  ...(wpnBonus > 0        ? [{ label: 'mag.',                          value: wpnBonus }]       : []),
                  ...(munitionsBonus > 0  ? [{ label: 'fl.',                           value: munitionsBonus }] : []),
                  ...(abilityDmgMod !== 0 ? [{ label: isRanged ? 'FOR(arc)' : 'FOR',   value: abilityDmgMod }] : []),
                  ...damageItems,
                ].filter(b => b.value !== 0)

                const hasConditional = [...attackItems, ...damageItems].some(b => b.conditional)
                const fmtItem = (b: { label: string; value: number; conditional?: string }) =>
                  `${b.label} ${b.value >= 0 ? '+' : ''}${b.value}${b.conditional ? '*' : ''}`
                const showBreakdown = atkBreakdown.length > 0 || dmgBreakdown.length > 0

                return (
                  <div key={charWeapon.id} className="bg-stone-800/60 rounded p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-white font-semibold">
                            {nomDisplay}
                          </span>
                          <span className="text-stone-500 text-xs">Att.</span>
                          <span className="text-amber-300 font-bold text-sm">
                            {attackSeq(bbaTotal + featAtkBonus + munitionsBonus, rawBab, wpnBonus)}
                          </span>
                        </div>
                        <div className="text-stone-400 text-xs mt-1 space-x-3">
                          <span>Dégâts : <span className="text-amber-300">{dmgStr}</span></span>
                          <span>Critique : <span className="text-amber-300">{weapon.critiqueMin}-20 ×{weapon.critiqueMult}</span></span>
                          {weapon.portee && <span>Portée : <span className="text-amber-300">{weapon.portee}m</span></span>}
                          <span>Type : {weapon.typeDegats}</span>
                        </div>
                        {showBreakdown && (
                          <div className="text-stone-500 text-xs mt-1.5 leading-relaxed">
                            {atkBreakdown.length > 0 && (
                              <><span className="text-stone-600">att. :</span> {atkBreakdown.map(fmtItem).join(', ')}</>
                            )}
                            {dmgBreakdown.length > 0 && (
                              <> · <span className="text-stone-600">dég. :</span> {dmgBreakdown.map(fmtItem).join(', ')}</>
                            )}
                            {hasConditional && <span className="text-stone-600"> — *≤9m</span>}
                          </div>
                        )}
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
          const spellsMapped = sortsClasse.map(s => ({
            charSpellId: s.charSpell.id,
            nom: s.spell.nom,
            niveau: s.charSpell.niveau ?? 0,
            ecole: s.spell.ecole ?? '',
            estPrepare: s.charSpell.estPrepare ?? 0,
          }))
          const maxNiveau = divineAvailableSpells
            ? Math.max(...divineAvailableSpells.map(s => s.niveau), 0)
            : 9
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
                            const meta = [comp, port, dur].filter(Boolean).join(' · ')
                            return (
                              <div key={charSpell.id} className="py-1.5 border-b border-stone-800/60 last:border-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center min-w-0 flex-wrap gap-x-1">
                                    <span className={`text-sm font-medium ${(charSpell.estPrepare ?? 0) > 0 ? 'text-amber-200' : 'text-stone-400'}`}>{spell.nom}</span>
                                    {isCustom && (
                                      <>
                                        <span className="text-amber-700 text-xs" title="Sort personnalisé">★</span>
                                        <SupprimerSort charSpellId={charSpell.id} personnageId={character.id} />
                                      </>
                                    )}
                                    {spell.ecole && <span className="text-stone-600 text-xs">· {spell.ecole}</span>}
                                    {!isCustom && (
                                      <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(spell.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="text-stone-700 hover:text-amber-400 transition-colors text-xs">🔍</a>
                                    )}
                                  </div>
                                  <span className="flex items-center shrink-0">
                                    {spellEffects.some(e => e.nom === spell.nom) && (
                                      <span className="text-xs text-violet-300 bg-violet-900/40 border border-violet-700 rounded px-1.5 py-0.5 ml-2" title="Effet actif sur la CA — se retire dans la section Combat">🛡 actif</span>
                                    )}
                                    <LiveSort charSpellId={charSpell.id} personnageId={character.id} estPrepare={charSpell.estPrepare ?? 0} />
                                  </span>
                                </div>
                                {!isCustom && desc && (
                                  <div className="mt-0.5 space-y-0.5">
                                    <p className="text-xs text-stone-400 leading-snug">{desc}</p>
                                    {meta && <p className="text-xs text-stone-600">{meta}</p>}
                                  </div>
                                )}
                                {isCustom && (
                                  <DescriptionSort sortId={spell.id} description={spell.description ?? null} personnageId={character.id} />
                                )}
                              </div>
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
                  const caracMod = carac[skill.caracteristique as keyof typeof carac] ?? 0
                  const hasArmorMalus = malusArmure > 0 && COMPETENCES_MALUS_ARMURE.includes(skill.nom)
                  const total = (charSkill.rangsInvestis ?? 0) + caracMod + (charSkill.modifDivers ?? 0) - (hasArmorMalus ? malusArmure : 0)
                  return (
                    <div key={skill.id} className="flex items-center justify-between py-1 border-b border-stone-800 last:border-0">
                      <div>
                        <span className="text-stone-200 text-sm">{skill.nom}</span>
                        <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(skill.nom)}`} target="_blank" rel="noopener noreferrer" title="Voir la description D&D 3.5" className="ml-1.5 text-stone-700 hover:text-amber-400 transition-colors text-xs">🔍</a>
                        <span className="text-stone-500 text-xs ml-2">({skill.caracteristique})</span>
                        {hasArmorMalus && <span className="text-red-500 text-xs ml-1" title={`Malus armure −${malusArmure}`}>−{malusArmure}⚔</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 text-xs">{charSkill.rangsInvestis} rangs</span>
                        <span className={`font-bold w-8 text-right ${hasArmorMalus ? 'text-red-400' : 'text-amber-300'}`}>{signedNum(total)}</span>
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
                    {d.sorts.map((s, idx) => (
                      <div key={idx} className="flex items-baseline gap-1.5">
                        <span className="text-amber-700 text-xs shrink-0">Niv.{idx + 1}</span>
                        <span className="text-stone-300 text-xs">{s}</span>
                      </div>
                    ))}
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
        <Section titre="Notes du joueur">
          <LiveNotes personnageId={character.id} notes={character.notes ?? ''} />
        </Section>
      </main>
    </div>
  )
}

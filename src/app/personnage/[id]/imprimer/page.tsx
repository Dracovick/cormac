import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCharacter } from '@/lib/queries/character'
import { getClasseInfo } from '@/lib/dnd35/classes'
import { getRaceInfo } from '@/lib/dnd35/races'
import { getModifier, getBab } from '@/lib/dnd35/rules'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'
import { PrintButton } from '@/components/fiche/PrintButton'

export const dynamic = 'force-dynamic'

function fm(n: number) { return n >= 0 ? `+${n}` : `${n}` }

function Cell({ label, value, sub }: { label: string; value?: React.ReactNode; sub?: string }) {
  return (
    <td style={{ border: '1px solid #000', padding: '2px 4px', verticalAlign: 'top', fontSize: '8pt' }}>
      <div style={{ fontSize: '6pt', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1 }}>{label}</div>
      {value !== undefined && <div style={{ fontSize: '10pt', fontWeight: 'bold', lineHeight: 1.2 }}>{value}</div>}
      {sub && <div style={{ fontSize: '7pt', color: '#555' }}>{sub}</div>}
    </td>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={20} style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '9pt', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
      </td>
    </tr>
  )
}

export default async function ImprimerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCharacter(Number(id))
  if (!data) notFound()

  const { character, race, clan, classes, abilityScores, combatStats, savingThrows,
    skills, feats, weapons, armor, magicItems, potions, currency, languages, companions } = data

  const firstClass = classes[0]
  const classeInfo = firstClass ? getClasseInfo(firstClass.classe.nom) : null
  const niveau = firstClass?.characterClass.niveau ?? 1
  const raceInfo = getRaceInfo(race?.nom ?? '')

  // Totaux caractéristiques
  const forT = (abilityScores?.forBase ?? 10) + (abilityScores?.forMagique ?? 0) + (raceInfo?.bonusFor ?? 0)
  const dexT = (abilityScores?.dexBase ?? 10) + (abilityScores?.dexMagique ?? 0) + (raceInfo?.bonusDex ?? 0)
  const conT = (abilityScores?.conBase ?? 10) + (abilityScores?.conMagique ?? 0) + (raceInfo?.bonusCon ?? 0)
  const intT = (abilityScores?.intBase ?? 10) + (abilityScores?.intMagique ?? 0) + (raceInfo?.bonusInt ?? 0)
  const sagT = (abilityScores?.sagBase ?? 10) + (abilityScores?.sagMagique ?? 0) + (raceInfo?.bonusSag ?? 0)
  const chaT = (abilityScores?.chaBase ?? 10) + (abilityScores?.chaMagique ?? 0) + (raceInfo?.bonusCha ?? 0)

  const forMod = getModifier(forT); const dexMod = getModifier(dexT); const conMod = getModifier(conT)
  const intMod = getModifier(intT); const sagMod = getModifier(sagT); const chaMod = getModifier(chaT)

  const bbaBase = classeInfo ? getBab(classeInfo.bab, niveau) : 0
  const bbaCorps = combatStats?.bbaCorpsACorps ?? (bbaBase + forMod)
  const bbaProj = combatStats?.bbaProjectiles ?? (bbaBase + dexMod)

  const saveBonnes = classeInfo?.bonsSauvegardes ?? []
  const vigBase = saveBonnes.includes('vigueur') ? 2 + Math.floor(niveau / 2) : Math.floor(niveau / 3)
  const refBase = saveBonnes.includes('reflexes') ? 2 + Math.floor(niveau / 2) : Math.floor(niveau / 3)
  const volBase = saveBonnes.includes('volonte') ? 2 + Math.floor(niveau / 2) : Math.floor(niveau / 3)
  const vigT = vigBase + conMod + (savingThrows?.vigueurMagique ?? 0)
  const refT = refBase + dexMod + (savingThrows?.reflexesMagique ?? 0)
  const volT = volBase + sagMod + (savingThrows?.volonteMagique ?? 0)

  const caTotal = 10 + dexMod + (combatStats?.caArme ?? 0) + (combatStats?.caBouclier ?? 0) + (combatStats?.caNaturelle ?? 0) + (combatStats?.caDeflexion ?? 0) + (combatStats?.caDivers ?? 0)
  const initT = dexMod + (combatStats?.initiativeBonus ?? 0)

  const abilMods: Record<string, number> = { FOR: forMod, DEX: dexMod, CON: conMod, INT: intMod, SAG: sagMod, CHA: chaMod }

  const skillsData = COMPETENCES_DND35.map(ref => {
    const saved = skills.find(s => s.skill.nom === ref.nom)
    const rangs = saved?.charSkill.rangsInvestis ?? 0
    const divers = saved?.charSkill.modifDivers ?? 0
    const abilMod = abilMods[ref.caracteristique] ?? 0
    const total = abilMod + rangs + divers
    const isClasse = ref.classesCompetence.includes(firstClass?.classe.nom ?? '')
    return { ...ref, rangs, divers, abilMod, total, isClasse }
  }).filter(s => s.rangs > 0 || s.divers !== 0)

  const totalRangs = skillsData.reduce((acc, s) => acc + s.rangs, 0)
  const isSpellcaster = classeInfo?.lanceurSorts ?? false

  const armurePortee = armor[0]
  const armureName = armurePortee
    ? `${armurePortee.armor.nom}${armurePortee.charArmor.bonusMagique ? ` +${armurePortee.charArmor.bonusMagique}` : ''}`
    : '—'

  const po = parseFloat(currency?.po?.toString() ?? '0')
  const pa = parseFloat(currency?.pa?.toString() ?? '0')
  const pc = parseFloat(currency?.pc?.toString() ?? '0')
  const pe = parseFloat(currency?.pe?.toString() ?? '0')
  const pm = parseFloat(currency?.pm?.toString() ?? '0')
  const monnaieStr = [
    po > 0 ? `${po} p.o.` : '',
    pa > 0 ? `${pa} p.a.` : '',
    pc > 0 ? `${pc} p.c.` : '',
    pe > 0 ? `${pe} p.e.` : '',
    pm > 0 ? `${pm} p.m.` : '',
  ].filter(Boolean).join('  ')

  const td = (content: React.ReactNode, style?: React.CSSProperties) => (
    <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', ...style }}>{content}</td>
  )
  const tdh = (content: React.ReactNode, style?: React.CSSProperties) => (
    <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', background: '#eee', ...style }}>{content}</td>
  )

  // Ligne save (Réflexes, Vigueur, Volonté)
  function SaveRow({ label, total, base, abilMod, magic }: { label: string; sub: string; total: number; base: number; abilMod: number; magic: number }) {
    return (
      <tr>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', fontWeight: 'bold', background: '#222', color: '#fff', width: '22%' }}>{label}</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '11pt', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>{fm(total)}</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', textAlign: 'center', color: '#333' }}>=</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '9pt', textAlign: 'center' }}>{fm(base)}</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', textAlign: 'center', color: '#555' }}>+</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '9pt', textAlign: 'center' }}>{fm(abilMod)}</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', textAlign: 'center', color: '#555' }}>+</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '9pt', textAlign: 'center' }}>{magic || ''}</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', textAlign: 'center', color: '#555' }}>+</td>
        <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', background: '#f5f5f5', width: '8%' }}></td>
      </tr>
    )
  }

  const TABLE = { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '4px' }
  const PAGE = { pageBreakAfter: 'always' as const, padding: '0', marginBottom: '0' }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff', maxWidth: '210mm', margin: '0 auto', padding: '0 10px' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          @page { size: A4; margin: 1cm; }
        }
        @media screen {
          body { background: #888; }
        }
      `}</style>

      {/* Boutons de navigation — masqués à l'impression */}
      <div className="no-print" style={{ background: '#1c1917', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', borderRadius: '8px', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href={`/personnage/${id}`} style={{ color: '#a8a29e', fontSize: '14px', textDecoration: 'none' }}>← Retour à la fiche</Link>
        <span style={{ color: '#57534e' }}>|</span>
        <PrintButton />
        <span style={{ color: '#78716c', fontSize: '13px', marginLeft: 'auto' }}>
          Dans la boîte de dialogue d'impression, choisir « Sauvegarder en PDF »
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 1 — Identité + caractéristiques + combat + armes
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={PAGE}>

        {/* En-tête */}
        <table style={{ ...TABLE, marginBottom: '0' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '14pt', fontWeight: 'bold', width: '30%' }}>{character.nom}</td>
              {td(race?.nom ?? '—', { fontWeight: 'bold', width: '10%' })}
              {td(character.sexe ?? '—', { width: '6%' })}
              {td(combatStats?.deplacement ?? '9', { width: '10%' })}
              {td(combatStats?.karma ?? 0, { width: '10%' })}
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '18%', fontFamily: 'serif', fontWeight: 'bold', fontSize: '11pt', color: '#8B0000', letterSpacing: '0.05em' }}>
                ⚔ D&amp;D 3e Éd.
              </td>
            </tr>
            <tr>
              {tdh('Nom du personnage', { width: '30%' })}
              {tdh('Race', { width: '10%' })}
              {tdh('Sexe', { width: '6%' })}
              {tdh('Déplacement', { width: '10%' })}
              {tdh('Karma', { width: '10%' })}
              {td('', { width: '18%' })}
            </tr>
            <tr>
              {td(character.alignement ?? '—', { width: '12%' })}
              {td(clan?.nom ?? '—', { width: '12%' })}
              {td(character.sexe === 'M' ? 'M' : character.sexe === 'F' ? 'F' : '—', { width: '5%' })}
              {td(character.taille ?? '—', { width: '8%' })}
              {td(character.poids ? `${character.poids}` : '—', { width: '8%' })}
              {td(character.yeux ?? '—', { width: '10%' })}
              {td(character.cheveux ?? '—', { width: '10%' })}
              {td(character.age ?? '—', { width: '8%' })}
            </tr>
            <tr>
              {tdh('Alignement')}
              {tdh('Dieu / Clan')}
              {tdh('Taille')}
              {tdh('Grandeur')}
              {tdh('Poids')}
              {tdh('Yeux')}
              {tdh('Cheveux')}
              {tdh('Âge')}
            </tr>
          </tbody>
        </table>

        {/* Caractéristiques + Classe/PV/CA */}
        <table style={{ ...TABLE, marginBottom: '0' }}>
          <tbody>
            <tr>
              {/* Colonne gauche : 6 caractéristiques */}
              <td style={{ border: '1px solid #000', padding: '2px', width: '22%', verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {tdh('Caract.', { width: '40%' })}
                      {tdh('Score', { width: '25%', textAlign: 'center' })}
                      {tdh('Mod.', { width: '20%', textAlign: 'center' })}
                      {tdh('Tmp', { width: '15%', textAlign: 'center' })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['FOR — Force', forT, forMod],
                      ['DEX — Dextérité', dexT, dexMod],
                      ['CON — Constitution', conT, conMod],
                      ['INT — Intelligence', intT, intMod],
                      ['SAG — Sagesse', sagT, sagMod],
                      ['CHA — Charisme', chaT, chaMod],
                    ].map(([lbl, score, mod]) => (
                      <tr key={lbl as string}>
                        <td style={{ border: '1px solid #ccc', padding: '2px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#222', color: '#fff' }}>{lbl as string}</td>
                        <td style={{ border: '1px solid #ccc', padding: '2px', fontSize: '13pt', fontWeight: 'bold', textAlign: 'center' }}>{score as number}</td>
                        <td style={{ border: '1px solid #ccc', padding: '2px', fontSize: '11pt', fontWeight: 'bold', textAlign: 'center' }}>{fm(mod as number)}</td>
                        <td style={{ border: '1px solid #ccc', padding: '2px', background: '#f5f5f5' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>

              {/* Colonne droite : classe, PV, CA, initiative, type armure */}
              <td style={{ border: '1px solid #000', padding: '2px', verticalAlign: 'top' }}>
                {/* Classe */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
                  <thead>
                    <tr>
                      {tdh('')}
                      {tdh('Classe')}
                      {tdh('Niv.', { textAlign: 'center' })}
                      {tdh('Dés vie', { textAlign: 'center' })}
                      {tdh('Bonus attaque base', { textAlign: 'center' })}
                      {tdh('XP acquise', { textAlign: 'center' })}
                      {tdh('Prochain niv.', { textAlign: 'center' })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {td('Principale')}
                      {td(firstClass?.classe.nom ?? '—', { fontWeight: 'bold' })}
                      {td(niveau, { textAlign: 'center', fontWeight: 'bold', fontSize: '11pt' })}
                      {td(classeInfo ? `d${classeInfo.de}` : '—', { textAlign: 'center' })}
                      {td(fm(bbaBase), { textAlign: 'center' })}
                      {td(character.xp?.toLocaleString('fr-FR') ?? 0, { textAlign: 'center' })}
                      {td(((character.xp ?? 0) < 1000 ? 1000 : Math.ceil((character.xp ?? 0) / 1000) * 1000 + 1000).toLocaleString('fr-FR'), { textAlign: 'center' })}
                    </tr>
                    <tr>
                      {td('Prestige / multi')}
                      {td('')}{td('')}{td('')}{td('')}{td('')}{td('')}
                    </tr>
                  </tbody>
                </table>

                {/* PV + Initiative */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', background: '#000', color: '#fff', width: '14%' }}>PV<br/><span style={{ fontSize: '7pt' }}>Pts vie</span></td>
                      <td style={{ border: '1px solid #000', padding: '2px', fontSize: '16pt', fontWeight: 'bold', textAlign: 'center', width: '12%' }}>{combatStats?.pvMax ?? 0}</td>
                      <td style={{ border: '1px solid #000', padding: '2px 6px', width: '32%', background: '#f5f5f5' }}><span style={{ fontSize: '7pt', color: '#777' }}>PV actuels: {combatStats?.pvActuels ?? 0}</span></td>
                      <td style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', background: '#000', color: '#fff', width: '16%', textAlign: 'center' }}>INITIATIVE<br/><span style={{ fontSize: '7pt' }}>Modificateur</span></td>
                      <td style={{ border: '1px solid #000', padding: '2px', fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>{fm(initT)}</td>
                      <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', color: '#555', fontSize: '9pt' }}>=</td>
                      <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: '9pt' }}>{fm(dexMod)}</td>
                      <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', color: '#555', fontSize: '9pt' }}>+</td>
                      <td style={{ border: '1px solid #000', padding: '2px', background: '#f5f5f5', width: '10%' }}></td>
                    </tr>
                    <tr>
                      <td colSpan={3}></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 4px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Modif. DEX</td>
                      <td></td><td></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 4px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>DEX</td>
                      <td></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 4px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Divers</td>
                    </tr>
                  </tbody>
                </table>

                {/* CA */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
                  <tbody>
                    <tr>
                      <td rowSpan={2} style={{ border: '1px solid #000', fontWeight: 'bold', fontSize: '9pt', background: '#000', color: '#fff', textAlign: 'center', padding: '4px', width: '8%' }}>CA<br/><span style={{ fontSize: '7pt' }}>Armure</span></td>
                      <td rowSpan={2} style={{ border: '1px solid #000', fontSize: '16pt', fontWeight: 'bold', textAlign: 'center', padding: '4px', width: '8%' }}>{caTotal}</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '9pt' }}>=</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>{combatStats?.caArme || 0}</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>{combatStats?.caBouclier || 0}</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>{fm(dexMod)}</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', background: '#f5f5f5', width: '6%' }}></td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>{combatStats?.caNaturelle || 0}</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                      <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>{combatStats?.caDivers || 0}</td>
                      <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '7pt', verticalAlign: 'top' }} rowSpan={2}>
                        <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '4px' }}>TYPE D'ARMURE</div>
                        <div style={{ fontSize: '8pt' }}>{armureName}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #aaa', padding: '1px 2px', fontSize: '6pt', color: '#888', textAlign: 'center' }}></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 2px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Armure</td>
                      <td></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 2px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Bouclier</td>
                      <td></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 2px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Mod.DEX</td>
                      <td></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 2px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Taille</td>
                      <td></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 2px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Natur.</td>
                      <td></td>
                      <td style={{ border: '1px solid #aaa', padding: '1px 2px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Divers</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Jets de sauvegarde */}
        <table style={{ ...TABLE, marginBottom: '0' }}>
          <thead>
            <tr>
              <td colSpan={10} style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '8pt', padding: '2px 6px', textTransform: 'uppercase' }}>Jets de sauvegarde</td>
            </tr>
            <tr>
              {['', 'Total', '=', 'Jet de base', '+', 'Caract.', '+', 'Magique', '+', 'Divers'].map((h, i) => (
                <td key={i} style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', textAlign: 'center', textTransform: 'uppercase' }}>{h}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            <SaveRow label="Réflexes (DEX)" sub="dextérité" total={refT} base={refBase} abilMod={dexMod} magic={savingThrows?.reflexesMagique ?? 0} />
            <SaveRow label="Vigueur (CON)" sub="constitution" total={vigT} base={vigBase} abilMod={conMod} magic={savingThrows?.vigueurMagique ?? 0} />
            <SaveRow label="Volonté (SAG)" sub="sagesse" total={volT} base={volBase} abilMod={sagMod} magic={savingThrows?.volonteMagique ?? 0} />
          </tbody>
        </table>

        {/* BBA */}
        <table style={{ ...TABLE, marginBottom: '0' }}>
          <thead>
            <tr>
              <td colSpan={10} style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '8pt', padding: '2px 6px', textTransform: 'uppercase' }}>Bonus d'attaque</td>
            </tr>
            <tr>
              {['', 'Bonus total', '=', 'Attaque base', '+', 'Caract.', '+', 'Taille', '+', 'Divers'].map((h, i) => (
                <td key={i} style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', textAlign: 'center', textTransform: 'uppercase' }}>{h}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', fontWeight: 'bold', background: '#222', color: '#fff', width: '22%' }}>Corps à corps</td>
              <td style={{ border: '1px solid #000', padding: '2px', fontSize: '11pt', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>{fm(bbaCorps)}</td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>=</td>
              <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: '9pt' }}>{fm(bbaBase)}</td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
              <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: '9pt' }}>{fm(forMod)}</td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
              <td style={{ border: '1px solid #000', padding: '2px', background: '#f5f5f5', width: '8%' }}></td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
              <td style={{ border: '1px solid #000', padding: '2px', background: '#f5f5f5', width: '8%' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', fontWeight: 'bold', background: '#222', color: '#fff' }}>Projectiles</td>
              <td style={{ border: '1px solid #000', padding: '2px', fontSize: '11pt', fontWeight: 'bold', textAlign: 'center' }}>{fm(bbaProj)}</td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>=</td>
              <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: '9pt' }}>{fm(bbaBase)}</td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
              <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', fontSize: '9pt' }}>{fm(dexMod)}</td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
              <td style={{ border: '1px solid #000', padding: '2px', background: '#f5f5f5' }}></td>
              <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
              <td style={{ border: '1px solid #000', padding: '2px', background: '#f5f5f5' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Langues */}
        {languages.length > 0 && (
          <table style={{ ...TABLE, marginBottom: '0' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', fontWeight: 'bold', background: '#000', color: '#fff', padding: '2px 6px', fontSize: '9pt', textTransform: 'uppercase', width: '12%' }}>Langues</td>
                <td style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '9pt' }}>{languages.map(l => l.language.nom).join(' · ')}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Armes */}
        <table style={{ ...TABLE, marginTop: '4px' }}>
          <thead>
            <tr style={{ background: '#000', color: '#fff' }}>
              <td style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', width: '30%' }}>Armes</td>
              {['Bonus Att.', 'Dégâts', 'Critique', 'Portée', 'Type', 'Grandeur'].map(h => (
                <td key={h} style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '8pt', textAlign: 'center', color: '#fff', background: '#000' }}>{h}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {weapons.length > 0 ? weapons.map((w, i) => {
              const bonus = (w.charWeapon.bonusMagique ?? 0)
              const bbaStr = bonus > 0 ? `${fm(bbaCorps + bonus)} / ${fm(bbaCorps - 5 + bonus)}` : `${fm(bbaCorps)} / ${fm(bbaCorps - 5)}`
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', fontWeight: 'bold' }}>
                    {w.weapon.nom}{bonus > 0 ? ` +${bonus}` : ''}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{bbaStr}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{w.weapon.degats ?? '—'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{w.weapon.critiqueMin ?? 20}–20/×{w.weapon.critiqueMult ?? 2}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{w.weapon.portee ? `${w.weapon.portee} m` : 'Contact'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt', textAlign: 'center' }}>{w.weapon.typeDegats ?? '—'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '9pt' }}></td>
                </tr>
              )
            }) : (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={7} style={{ border: '1px solid #eee', height: '18px' }}></td></tr>
              ))
            )}
            {weapons.length > 0 && weapons.length < 8 && Array.from({ length: 8 - weapons.length }).map((_, i) => (
              <tr key={`empty-${i}`}><td colSpan={7} style={{ border: '1px solid #eee', height: '18px' }}></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 2 — Compétences + Dons + Notes
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={PAGE}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              {/* Compétences */}
              <td style={{ verticalAlign: 'top', width: '60%', paddingRight: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#000', color: '#fff' }}>
                      <td colSpan={7} style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>Compétences</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', width: '32%' }}>Compétence</td>
                      <td style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', width: '5%', textAlign: 'center' }}>□</td>
                      <td style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', width: '8%', textAlign: 'center' }}>Car.</td>
                      <td style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', width: '12%', textAlign: 'center' }}>Total</td>
                      <td style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', width: '9%', textAlign: 'center' }}>Mod.Car.</td>
                      <td style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', width: '10%', textAlign: 'center' }}>Rangs</td>
                      <td style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', width: '10%', textAlign: 'center' }}>Divers</td>
                    </tr>
                  </thead>
                  <tbody>
                    {skillsData.map((s, i) => (
                      <tr key={s.nom} style={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                        <td style={{ border: '1px solid #ddd', padding: '1px 4px', fontSize: '8pt' }}>{s.nom}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1px', textAlign: 'center', fontSize: '8pt' }}>{s.isClasse ? '■' : '□'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1px', textAlign: 'center', fontSize: '7pt', color: '#555' }}>{s.caracteristique}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1px', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold' }}>{s.total}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1px', textAlign: 'center', fontSize: '8pt' }}>{fm(s.abilMod)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1px', textAlign: 'center', fontSize: '8pt' }}>{s.rangs}</td>
                        <td style={{ border: '1px solid #ddd', padding: '1px', textAlign: 'center', fontSize: '8pt' }}>{s.divers || ''}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 20 - skillsData.length) }).map((_, i) => (
                      <tr key={`es-${i}`}><td colSpan={7} style={{ border: '1px solid #eee', height: '16px' }}></td></tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7} style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '8pt', background: '#eee' }}>
                        <b>Classe principale</b> {firstClass?.classe.nom ?? '—'} &nbsp;&nbsp;
                        <b>Total investis</b> {totalRangs}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </td>

              {/* Dons et pouvoirs */}
              <td style={{ verticalAlign: 'top', width: '40%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#000', color: '#fff' }}>
                      <td style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>Dons et Pouvoirs</td>
                    </tr>
                  </thead>
                  <tbody>
                    {feats.map((f, i) => (
                      <tr key={f.feat.id} style={{ background: i % 2 === 0 ? '#f5f5f5' : '#fff' }}>
                        <td style={{ border: '1px solid #ddd', padding: '2px 6px', fontSize: '8pt' }}>{f.feat.nom}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 20 - feats.length) }).map((_, i) => (
                      <tr key={`ef-${i}`}><td style={{ border: '1px solid #eee', height: '18px' }}></td></tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Notes */}
        {(character.notes || companions.length > 0) && (
          <table style={{ ...TABLE, marginTop: '8px' }}>
            <thead>
              <tr style={{ background: '#000', color: '#fff' }}>
                <td colSpan={2} style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>Notes</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px', fontSize: '8pt', whiteSpace: 'pre-wrap', minHeight: '80px', verticalAlign: 'top' }}>
                  {character.notes ?? ''}
                  {companions.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <b>Compagnons :</b> {companions.map(c => `${c.nom} (${c.race || ''} ${c.classe || ''})`).join(', ')}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 3 — Monnaie + Équipement + Objets magiques
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={PAGE}>
        {/* Monnaie + Trésors */}
        <table style={{ ...TABLE, marginBottom: '4px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', width: '40%', verticalAlign: 'top' }}>
                <div style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '9pt', padding: '2px 6px', textTransform: 'uppercase', marginBottom: '4px' }}>Pièces de monnaie</div>
                <div style={{ padding: '4px 6px', fontSize: '10pt' }}>{monnaieStr || '—'}</div>
              </td>
              <td style={{ border: '1px solid #000', width: '60%', verticalAlign: 'top' }}>
                <div style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '9pt', padding: '2px 6px', textTransform: 'uppercase', marginBottom: '4px' }}>Trésors</div>
                <div style={{ padding: '4px 6px', minHeight: '60px' }}></div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Équipements (armures + potions) */}
        <table style={{ ...TABLE, marginBottom: '4px' }}>
          <thead>
            <tr style={{ background: '#000', color: '#fff' }}>
              <td style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', width: '60%' }}>Équipements</td>
              <td style={{ padding: '2px 6px', fontSize: '8pt', textAlign: 'center' }}>Localisation</td>
              <td style={{ padding: '2px 6px', fontSize: '8pt', textAlign: 'center' }}>Valeur (po)</td>
              <td style={{ padding: '2px 6px', fontSize: '8pt', textAlign: 'center' }}>Poids (kg)</td>
            </tr>
          </thead>
          <tbody>
            {armor.map((a, i) => (
              <tr key={a.armor.id} style={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px', fontSize: '9pt' }}>
                  {a.armor.nom}{a.charArmor.bonusMagique ? ` +${a.charArmor.bonusMagique}` : ''}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px' }}></td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px' }}></td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px' }}></td>
              </tr>
            ))}
            {potions.map((p, i) => (
              <tr key={p.potion.id} style={{ background: (armor.length + i) % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px', fontSize: '9pt' }}>
                  {p.potion.nom} {p.potion.sortEffet ? `— ${p.potion.sortEffet}` : ''} (×{p.charPotion.chargesRestantes})
                </td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px' }}></td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px' }}></td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px' }}></td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 20 - armor.length - potions.length) }).map((_, i) => (
              <tr key={`ee-${i}`}><td colSpan={4} style={{ border: '1px solid #eee', height: '18px' }}></td></tr>
            ))}
          </tbody>
        </table>

        {/* Objets magiques */}
        <table style={TABLE}>
          <thead>
            <tr style={{ background: '#000', color: '#fff' }}>
              <td colSpan={3} style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>Objets magiques</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#eee', width: '40%' }}>Objet</td>
              <td style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#eee', width: '30%' }}>Description / Bonus</td>
              <td style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#eee', width: '30%' }}>Emplacement</td>
            </tr>
          </thead>
          <tbody>
            {magicItems.map((m, i) => (
              <tr key={m.item.id} style={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px', fontSize: '9pt', fontWeight: 'bold' }}>{m.item.nom}</td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px', fontSize: '8pt' }}>{m.item.description ?? ''}{m.item.bonus ? ` : +${m.item.bonus}` : ''}</td>
                <td style={{ border: '1px solid #ddd', padding: '2px 6px', fontSize: '8pt' }}>{m.charItem.emplacement ?? ''}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - magicItems.length) }).map((_, i) => (
              <tr key={`em-${i}`}><td colSpan={3} style={{ border: '1px solid #eee', height: '20px' }}></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE SORTS — uniquement pour les classes lanceuses de sorts
      ══════════════════════════════════════════════════════════════════════ */}
      {isSpellcaster && (
        <div style={{ paddingBottom: '0' }}>
          <table style={TABLE}>
            <thead>
              <tr style={{ background: '#000', color: '#fff' }}>
                <td colSpan={4} style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ✦ Sorts — {firstClass?.classe.nom ?? ''} (niveau {niveau})
                </td>
              </tr>
              <tr>
                <td colSpan={4} style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '8pt', background: '#f5f5f5', fontStyle: 'italic' }}>
                  Caractéristique de lancement : <b>{classeInfo?.caracteristiqueSorts?.toUpperCase() ?? '—'}</b>
                  {classeInfo?.caracteristiqueSorts === 'intelligence' && `  ·  Mod. INT : ${fm(intMod)}  ·  DD de base : ${10 + intMod}`}
                  {classeInfo?.caracteristiqueSorts === 'sagesse' && `  ·  Mod. SAG : ${fm(sagMod)}  ·  DD de base : ${10 + sagMod}`}
                  {classeInfo?.caracteristiqueSorts === 'charisme' && `  ·  Mod. CHA : ${fm(chaMod)}  ·  DD de base : ${10 + chaMod}`}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#eee', width: '6%', textAlign: 'center' }}>Niv.</td>
                <td style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#eee', width: '28%' }}>Sort</td>
                <td style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#eee', width: '14%', textAlign: 'center' }}>École</td>
                <td style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#eee' }}>Description</td>
              </tr>
            </thead>
            <tbody>
              {/* TODO: sorts from DB — for now show empty rows for player to fill */}
              {Array.from({ length: 30 }).map((_, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #eee', height: '20px', textAlign: 'center', fontSize: '9pt' }}></td>
                  <td style={{ border: '1px solid #eee' }}></td>
                  <td style={{ border: '1px solid #eee' }}></td>
                  <td style={{ border: '1px solid #eee' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CharacterFormData } from '@/app/actions/character'
import { saveCharacter } from '@/app/actions/character'
import { getModifier, formatMod, ALIGNEMENTS, calcXpPenalite } from '@/lib/dnd35/rules'
import { CLASSES_DND35, getClasseInfo, getSortsSlotsParJour } from '@/lib/dnd35/classes'
import { RACES_DND35, getRaceInfo } from '@/lib/dnd35/races'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'
import { sortsByClasseEtNiveau, niveauxMaxForClasse, type ClasseSortKey, type SortDnD } from '@/lib/dnd35/spells'
import { getBab } from '@/lib/dnd35/rules'
import { WEAPONS_DND35, WEAPON_CATEGORIES, type WeaponTemplate } from '@/lib/dnd35/weapons'
import { FEATS_DND35, CATEGORIES_PAR_CLASSE, type FeatCategorie, type FeatDef } from '@/lib/dnd35/feats'

// ─── Styles ──────────────────────────────────────────────────────────────────
const INP = 'bg-stone-800 border border-stone-700 rounded px-2 py-1.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 w-full'
const INP_NUM = 'bg-stone-800 border border-stone-700 rounded px-1 py-1 text-stone-100 text-sm focus:outline-none focus:border-amber-500 text-center'
const LBL = 'text-stone-400 text-xs mb-1 block'
const CARD = 'bg-stone-900/60 rounded-lg p-4 border border-stone-800/50'
const SEC_H = 'text-amber-500 text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2'
const AUTO = 'bg-stone-800/40 rounded px-2 py-1.5 text-amber-400 font-bold font-mono text-sm text-center select-none'
const BTN_DEL = 'text-stone-600 hover:text-red-400 text-xs px-1 transition-colors shrink-0'
const BTN_ADD = 'mt-2 flex items-center gap-1.5 text-amber-500 hover:text-amber-300 text-xs transition-colors'
const SEL = 'bg-stone-800 border border-stone-700 rounded px-2 py-1.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 w-full'

// ─── Default form ─────────────────────────────────────────────────────────────
export const DEFAULT_FORM: CharacterFormData = {
  nom: '', surnom: '', sexe: '', age: '', taille: '', poids: '', yeux: '', cheveux: '',
  race: 'Humain', classe: 'Guerrier', niveau: 1,
  classes: [{ classe: 'Guerrier', niveau: 1 }],
  alignement: 'Neutre', divinite: '', clan: '', xp: 0, photoUrl: '',
  forBase: 10, forMagique: 0, dexBase: 10, dexMagique: 0,
  conBase: 10, conMagique: 0, intBase: 10, intMagique: 0,
  sagBase: 10, sagMagique: 0, chaBase: 10, chaMagique: 0,
  pvMax: 10, pvActuels: 10,
  caArme: 0, caBouclier: 0, caNaturelle: 0, caDeflexion: 0, caDivers: 0,
  initiativeBonus: 0, bbaCorpsOverride: null, bbaProjectilesOverride: null,
  deplacement: null, karma: 0,
  reflexesMagique: 0, vigueurMagique: 0, volonteMagique: 0,
  competences: COMPETENCES_DND35.map(c => ({ skillId: 0, nom: c.nom, caracteristique: c.caracteristique, rangs: 0, divers: 0 })),
  dons: [], armes: [], armures: [], objetsMagiques: [], potions: [],
  pp: 0, po: 0, pe: 0, pa: 0, pc: 0, pm: 0,
  langues: [], sorts: [],
  historique: '', notes: '', compagnons: [],
  joueurPrenom: '', joueurNom: '',
}

// ─── Derived stats ────────────────────────────────────────────────────────────
type Derived = ReturnType<typeof calcDerived>

function calcDerived(data: CharacterFormData) {
  const raceInfo = getRaceInfo(data.race)
  const allClasses = data.classes?.length > 0 ? data.classes : [{ classe: data.classe, niveau: data.niveau }]
  const primaryClasse = allClasses[0]?.classe ?? data.classe
  const classeInfo = getClasseInfo(primaryClasse)
  const forT = data.forBase + data.forMagique + (raceInfo?.bonusFor ?? 0)
  const dexT = data.dexBase + data.dexMagique + (raceInfo?.bonusDex ?? 0)
  const conT = data.conBase + data.conMagique + (raceInfo?.bonusCon ?? 0)
  const intT = data.intBase + data.intMagique + (raceInfo?.bonusInt ?? 0)
  const sagT = data.sagBase + data.sagMagique + (raceInfo?.bonusSag ?? 0)
  const chaT = data.chaBase + data.chaMagique + (raceInfo?.bonusCha ?? 0)
  const forMod = getModifier(forT); const dexMod = getModifier(dexT); const conMod = getModifier(conT)
  const intMod = getModifier(intT); const sagMod = getModifier(sagT); const chaMod = getModifier(chaT)
  const bbaBase = allClasses.reduce((sum, c) => {
    const info = getClasseInfo(c.classe)
    return sum + (info ? getBab(info.bab, c.niveau) : 0)
  }, 0)
  const vigBase = allClasses.reduce((sum, c) => {
    const info = getClasseInfo(c.classe); if (!info) return sum
    return sum + (info.bonsSauvegardes.includes('vigueur') ? 2 + Math.floor(c.niveau / 2) : Math.floor(c.niveau / 3))
  }, 0)
  const refBase = allClasses.reduce((sum, c) => {
    const info = getClasseInfo(c.classe); if (!info) return sum
    return sum + (info.bonsSauvegardes.includes('reflexes') ? 2 + Math.floor(c.niveau / 2) : Math.floor(c.niveau / 3))
  }, 0)
  const volBase = allClasses.reduce((sum, c) => {
    const info = getClasseInfo(c.classe); if (!info) return sum
    return sum + (info.bonsSauvegardes.includes('volonte') ? 2 + Math.floor(c.niveau / 2) : Math.floor(c.niveau / 3))
  }, 0)
  const niveauTotal = allClasses.reduce((sum, c) => sum + c.niveau, 0)
  const lanceurSorts = allClasses.some(c => getClasseInfo(c.classe)?.lanceurSorts ?? false)
  const casterClasses = allClasses.filter(c => getClasseInfo(c.classe)?.lanceurSorts)
  const xpPenalite = calcXpPenalite(allClasses, raceInfo?.classePreferee ?? 'any')
  return {
    forT, dexT, conT, intT, sagT, chaT, forMod, dexMod, conMod, intMod, sagMod, chaMod,
    bbaBase,
    bbaCorps: data.bbaCorpsOverride ?? (bbaBase + forMod),
    bbaProjectiles: data.bbaProjectilesOverride ?? (bbaBase + dexMod),
    vigBase, vigTotal: vigBase + conMod + data.vigueurMagique,
    refBase, refTotal: refBase + dexMod + data.reflexesMagique,
    volBase, volTotal: volBase + sagMod + data.volonteMagique,
    caTotal: 10 + dexMod + data.caArme + data.caBouclier + data.caNaturelle + data.caDeflexion + data.caDivers,
    initiativeTotal: dexMod + data.initiativeBonus,
    deplacement: data.deplacement ?? (raceInfo?.deplacement ?? 9),
    dv: classeInfo ? `d${classeInfo.de}` : '—',
    lanceurSorts,
    niveauMaxSorts: classeInfo?.niveauMaxSorts ?? 0,
    classeInfo, raceInfo, niveauTotal, casterClasses, xpPenalite, allClasses,
  }
}

type Upd = <K extends keyof CharacterFormData>(k: K, v: CharacterFormData[K]) => void

// ─── Section: Identité ───────────────────────────────────────────────────────
function SectionIdentite({ data, update }: { data: CharacterFormData; update: Upd }) {
  return (
    <div className="grid gap-4">
      <div className={CARD}>
        <div className={SEC_H}>Identité du personnage</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Nom *</label>
            <input className={INP} value={data.nom} onChange={e => update('nom', e.target.value)} placeholder="Nom du personnage" />
          </div>
          <div>
            <label className={LBL}>Surnom / Titre</label>
            <input className={INP} value={data.surnom} onChange={e => update('surnom', e.target.value)} placeholder="«&nbsp;Le Courageux&nbsp;»" />
          </div>
          <div>
            <label className={LBL}>Prénom du joueur</label>
            <input className={INP} value={data.joueurPrenom} onChange={e => update('joueurPrenom', e.target.value)} placeholder="Prénom" />
          </div>
          <div>
            <label className={LBL}>Nom du joueur</label>
            <input className={INP} value={data.joueurNom} onChange={e => update('joueurNom', e.target.value)} placeholder="Nom de famille" />
          </div>
          <div>
            <label className={LBL}>Race</label>
            <select className={SEL} value={data.race} onChange={e => update('race', e.target.value)}>
              {RACES_DND35.map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}
              <option value="">— Autre —</option>
            </select>
          </div>
          {/* Gestionnaire multi-classes — occupe toute la largeur */}
          <div className="sm:col-span-2">
            <label className={LBL}>Classes &amp; Niveaux</label>
            <div className="space-y-1.5">
              {(data.classes ?? [{ classe: data.classe, niveau: data.niveau }]).map((c, i) => {
                const classes = data.classes ?? [{ classe: data.classe, niveau: data.niveau }]
                return (
                  <div key={i} className="flex gap-2 items-center bg-stone-800/40 rounded px-2 py-1.5">
                    <select className={SEL + ' flex-1'} value={c.classe} onChange={e => {
                      const next = [...classes]; next[i] = { ...next[i], classe: e.target.value }
                      update('classes', next)
                    }}>
                      {CLASSES_DND35.map(cl => <option key={cl.nom} value={cl.nom}>{cl.nom}</option>)}
                    </select>
                    <span className="text-stone-500 text-xs shrink-0">niv.</span>
                    <input type="number" min={1} max={20} value={c.niveau} onChange={e => {
                      const next = [...classes]; next[i] = { ...next[i], niveau: Math.max(1, parseInt(e.target.value) || 1) }
                      update('classes', next)
                    }} className={INP_NUM + ' w-14'} />
                    {classes.length > 1 && (
                      <button onClick={() => update('classes', classes.filter((_, j) => j !== i))} className={BTN_DEL}>✕</button>
                    )}
                  </div>
                )
              })}
              <div className="flex items-center gap-4 pt-0.5">
                <button onClick={() => {
                  const classes = data.classes ?? [{ classe: data.classe, niveau: data.niveau }]
                  update('classes', [...classes, { classe: 'Guerrier', niveau: 1 }])
                }} className={BTN_ADD + ' mt-0'}><span className="text-lg">+</span> Ajouter une classe</button>
                {(data.classes ?? []).length > 0 && (
                  <span className="text-stone-500 text-xs">Niveau total : {(data.classes ?? []).reduce((s, c) => s + c.niveau, 0)}</span>
                )}
              </div>
              {/* Avertissement pénalité XP */}
              {(() => {
                const classes = data.classes ?? []
                if (classes.length <= 1) return null
                const raceInfo = getRaceInfo(data.race)
                const classePreferee = raceInfo?.classePreferee ?? 'any'
                const penalty = calcXpPenalite(classes, classePreferee)
                if (penalty === 0 && classePreferee !== 'any') return null
                const effectiveFavored = classePreferee === 'any' && classes.length > 0
                  ? classes.reduce((a, b) => a.niveau >= b.niveau ? a : b).classe
                  : classePreferee
                const favLabel = classePreferee === 'any'
                  ? `${effectiveFavored} (auto — la plus haute)`
                  : effectiveFavored
                return (
                  <div className={`text-xs px-3 py-1.5 rounded border ${penalty > 0 ? 'bg-amber-900/20 border-amber-800/40 text-amber-300' : 'bg-stone-800/30 border-stone-700/40 text-stone-400'}`}>
                    {penalty > 0
                      ? `⚠ Pénalité XP : −${penalty}% · Classe préférée : ${favLabel}`
                      : `✓ Pas de pénalité XP · Classe préférée : ${favLabel}`
                    }
                  </div>
                )
              })()}
            </div>
          </div>
          <div>
            <label className={LBL}>Alignement</label>
            <select className={SEL} value={data.alignement} onChange={e => update('alignement', e.target.value)}>
              <option value="">—</option>
              {ALIGNEMENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={LBL}>Points d'expérience (XP)</label>
            <input className={INP} type="number" min={0} value={data.xp} onChange={e => update('xp', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className={LBL}>Divinité</label>
            <input className={INP} value={data.divinite} onChange={e => update('divinite', e.target.value)} placeholder="Nom de la divinité" />
          </div>
          <div>
            <label className={LBL}>Clan / Organisation</label>
            <input className={INP} value={data.clan} onChange={e => update('clan', e.target.value)} placeholder="Nom du clan" />
          </div>
          <div>
            <label className={LBL}>URL portrait</label>
            <input className={INP} value={data.photoUrl} onChange={e => update('photoUrl', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>
      <div className={CARD}>
        <div className={SEC_H}>Description physique</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([['Sexe', 'sexe', 'text', 'M / F'], ['Âge', 'age', 'number', '—'], ['Taille', 'taille', 'text', '1m80'], ['Poids', 'poids', 'number', 'lbs']] as const).map(([lbl, key, type, ph]) => (
            <div key={key}>
              <label className={LBL}>{lbl}</label>
              <input className={INP} type={type} value={(data as any)[key]} onChange={e => update(key as any, type === 'number' ? (parseInt(e.target.value) || '') : e.target.value)} placeholder={ph} />
            </div>
          ))}
          {([['Yeux', 'yeux', 'Couleur'], ['Cheveux', 'cheveux', 'Couleur']] as const).map(([lbl, key, ph]) => (
            <div key={key}>
              <label className={LBL}>{lbl}</label>
              <input className={INP} value={(data as any)[key]} onChange={e => update(key as any, e.target.value)} placeholder={ph} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Caractéristiques ───────────────────────────────────────────────
const SCORES = [
  { label: 'Force', abbr: 'FOR', base: 'forBase' as const, magic: 'forMagique' as const, mod: 'forMod' as const, tot: 'forT' as const },
  { label: 'Dextérité', abbr: 'DEX', base: 'dexBase' as const, magic: 'dexMagique' as const, mod: 'dexMod' as const, tot: 'dexT' as const },
  { label: 'Constitution', abbr: 'CON', base: 'conBase' as const, magic: 'conMagique' as const, mod: 'conMod' as const, tot: 'conT' as const },
  { label: 'Intelligence', abbr: 'INT', base: 'intBase' as const, magic: 'intMagique' as const, mod: 'intMod' as const, tot: 'intT' as const },
  { label: 'Sagesse', abbr: 'SAG', base: 'sagBase' as const, magic: 'sagMagique' as const, mod: 'sagMod' as const, tot: 'sagT' as const },
  { label: 'Charisme', abbr: 'CHA', base: 'chaBase' as const, magic: 'chaMagique' as const, mod: 'chaMod' as const, tot: 'chaT' as const },
]

function SectionCaracteristiques({ data, update, derived }: { data: CharacterFormData; update: Upd; derived: Derived }) {
  const raceInfo = derived.raceInfo
  const BONUS_RACIAL: Record<string, number> = {
    forBase: raceInfo?.bonusFor ?? 0, dexBase: raceInfo?.bonusDex ?? 0, conBase: raceInfo?.bonusCon ?? 0,
    intBase: raceInfo?.bonusInt ?? 0, sagBase: raceInfo?.bonusSag ?? 0, chaBase: raceInfo?.bonusCha ?? 0,
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SCORES.map(s => {
        const racial = BONUS_RACIAL[s.base] ?? 0
        const total = (derived as any)[s.tot] as number
        const mod = (derived as any)[s.mod] as number
        return (
          <div key={s.abbr} className={`${CARD} text-center`}>
            <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-3">{s.abbr}<span className="text-stone-500 text-xs font-normal ml-1">({s.label})</span></div>
            <div className="grid grid-cols-3 gap-1 items-center mb-2">
              <div>
                <div className={LBL + ' text-center'}>Base</div>
                <input className={INP_NUM + ' w-full'} type="number" min={1} max={30} value={(data as any)[s.base]} onChange={e => update(s.base, parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <div className={LBL + ' text-center'}>Racial</div>
                <div className={`${AUTO} ${racial > 0 ? 'text-green-400' : racial < 0 ? 'text-red-400' : 'text-stone-600'}`}>{racial >= 0 ? `+${racial}` : racial}</div>
              </div>
              <div>
                <div className={LBL + ' text-center'}>Magique</div>
                <input className={INP_NUM + ' w-full'} type="number" min={0} value={(data as any)[s.magic]} onChange={e => update(s.magic, parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="flex items-center justify-between bg-stone-800 rounded p-2">
              <span className="text-stone-400 text-xs">Total</span>
              <span className="text-white font-bold text-lg">{total}</span>
            </div>
            <div className="mt-2 bg-amber-900/30 border border-amber-700/40 rounded p-2">
              <div className="text-stone-400 text-xs">Modificateur</div>
              <div className="text-amber-300 text-3xl font-bold font-mono">{formatMod(mod)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section: Combat ─────────────────────────────────────────────────────────
function SectionCombat({ data, update, derived }: { data: CharacterFormData; update: Upd; derived: Derived }) {
  const fm = formatMod
  const isAutoCorps = data.bbaCorpsOverride === null
  const isAutoProj = data.bbaProjectilesOverride === null
  return (
    <div className="grid gap-4">
      {/* PV + Karma */}
      <div className={CARD}>
        <div className={SEC_H}>Points de vie</div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 items-end">
          <div><label className={LBL}>PV actuels</label><input className={INP_NUM + ' w-full text-lg'} type="number" value={data.pvActuels} onChange={e => update('pvActuels', parseInt(e.target.value) || 0)} /></div>
          <div><label className={LBL}>PV maximum</label><input className={INP_NUM + ' w-full text-lg'} type="number" value={data.pvMax} onChange={e => update('pvMax', parseInt(e.target.value) || 0)} /></div>
          <div><label className={LBL}>Dé de vie</label><div className={AUTO}>{derived.dv}</div></div>
          <div><label className={LBL}>Karma</label><input className={INP_NUM + ' w-full'} type="number" value={data.karma} onChange={e => update('karma', parseInt(e.target.value) || 0)} /></div>
          <div><label className={LBL}>Déplacement (m)</label><div className="flex gap-1"><input className={INP_NUM + ' flex-1'} type="number" placeholder="auto" value={data.deplacement ?? ''} onChange={e => update('deplacement', e.target.value ? parseInt(e.target.value) : null)} /><div className={AUTO + ' shrink-0'}>{derived.deplacement}m</div></div></div>
        </div>
      </div>

      {/* CA */}
      <div className={CARD}>
        <div className={SEC_H}>Classe d'armure</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 items-end">
          <div><label className={LBL}>CA totale</label><div className={AUTO + ' text-xl font-bold text-white py-2'}>{derived.caTotal}</div></div>
          <div><label className={LBL}>Armure</label><input className={INP_NUM + ' w-full'} type="number" value={data.caArme} onChange={e => update('caArme', parseInt(e.target.value) || 0)} /></div>
          <div><label className={LBL}>Bouclier</label><input className={INP_NUM + ' w-full'} type="number" value={data.caBouclier} onChange={e => update('caBouclier', parseInt(e.target.value) || 0)} /></div>
          <div><label className={LBL}>Naturelle</label><input className={INP_NUM + ' w-full'} type="number" value={data.caNaturelle} onChange={e => update('caNaturelle', parseInt(e.target.value) || 0)} /></div>
          <div><label className={LBL}>Déviation</label><input className={INP_NUM + ' w-full'} type="number" value={data.caDeflexion} onChange={e => update('caDeflexion', parseInt(e.target.value) || 0)} /></div>
          <div><label className={LBL}>Divers</label><input className={INP_NUM + ' w-full'} type="number" value={data.caDivers} onChange={e => update('caDivers', parseInt(e.target.value) || 0)} /></div>
        </div>
        <div className="mt-2 text-stone-500 text-xs">10 + DEX({fm(derived.dexMod)}) + armure({data.caArme}) + bouclier({data.caBouclier}) + nat.({data.caNaturelle}) + dév.({data.caDeflexion}) + div.({data.caDivers})</div>
      </div>

      {/* Initiative + BBA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={CARD}>
          <div className={SEC_H}>Initiative</div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div><label className={LBL}>Bonus divers</label><input className={INP_NUM + ' w-full'} type="number" value={data.initiativeBonus} onChange={e => update('initiativeBonus', parseInt(e.target.value) || 0)} /></div>
            <div><label className={LBL}>Total</label><div className={AUTO + ' text-xl text-white py-1.5'}>{fm(derived.initiativeTotal)}</div></div>
          </div>
          <div className="mt-1 text-stone-500 text-xs">DEX({fm(derived.dexMod)}) + divers({data.initiativeBonus})</div>
        </div>
        <div className={CARD}>
          <div className={SEC_H}>Bonus de Base à l'Attaque</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Corps à corps {isAutoCorps && <span className="text-amber-600">(auto)</span>}</label>
              <div className="flex gap-1">
                <input className={INP_NUM + ' flex-1'} type="number" placeholder="auto" value={data.bbaCorpsOverride ?? ''} onChange={e => update('bbaCorpsOverride', e.target.value ? parseInt(e.target.value) : null)} />
                <div className={AUTO + ' shrink-0'}>{fm(derived.bbaCorps)}</div>
              </div>
              <div className="text-stone-600 text-xs mt-0.5">BBA base {derived.bbaBase} + FOR({fm(derived.forMod)})</div>
            </div>
            <div>
              <label className={LBL}>Projectiles {isAutoProj && <span className="text-amber-600">(auto)</span>}</label>
              <div className="flex gap-1">
                <input className={INP_NUM + ' flex-1'} type="number" placeholder="auto" value={data.bbaProjectilesOverride ?? ''} onChange={e => update('bbaProjectilesOverride', e.target.value ? parseInt(e.target.value) : null)} />
                <div className={AUTO + ' shrink-0'}>{fm(derived.bbaProjectiles)}</div>
              </div>
              <div className="text-stone-600 text-xs mt-0.5">BBA base {derived.bbaBase} + DEX({fm(derived.dexMod)})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Jets de sauvegarde */}
      <div className={CARD}>
        <div className={SEC_H}>Jets de sauvegarde</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Vigueur', key: 'vigueurMagique' as const, base: derived.vigBase, total: derived.vigTotal, mod: derived.conMod, modLabel: 'CON' },
            { label: 'Réflexes', key: 'reflexesMagique' as const, base: derived.refBase, total: derived.refTotal, mod: derived.dexMod, modLabel: 'DEX' },
            { label: 'Volonté', key: 'volonteMagique' as const, base: derived.volBase, total: derived.volTotal, mod: derived.sagMod, modLabel: 'SAG' },
          ].map(sv => (
            <div key={sv.label} className="bg-stone-800/60 rounded-lg p-3 text-center">
              <div className="text-amber-500 text-xs font-bold uppercase tracking-wide mb-2">{sv.label}</div>
              <div className="text-3xl font-bold text-white font-mono mb-2">{fm(sv.total)}</div>
              <div className="text-stone-500 text-xs mb-2">base {fm(sv.base)} · {sv.modLabel}({fm(sv.mod)})</div>
              <div><label className={LBL + ' text-center'}>Bonus magique</label><input className={INP_NUM + ' w-full'} type="number" value={(data as any)[sv.key]} onChange={e => update(sv.key, parseInt(e.target.value) || 0)} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Compétences ────────────────────────────────────────────────────
function SectionCompetences({ data, update, derived }: { data: CharacterFormData; update: Upd; derived: Derived }) {
  const allClassNames = (data.classes ?? [{ classe: data.classe, niveau: data.niveau }]).map(c => c.classe)
  const getAbilMod = (car: string) => {
    const m: Record<string, number> = { FOR: derived.forMod, DEX: derived.dexMod, CON: derived.conMod, INT: derived.intMod, SAG: derived.sagMod, CHA: derived.chaMod }
    return m[car] ?? 0
  }
  return (
    <div className={CARD}>
      <div className={SEC_H}>Compétences <span className="text-stone-500 font-normal">(Cl = compétence de classe)</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-stone-500 border-b border-stone-800">
              <th className="text-left py-2 pr-2 font-normal">Compétence</th>
              <th className="text-center py-2 px-1 font-normal w-10">Car.</th>
              <th className="text-center py-2 px-1 font-normal w-8">Cl</th>
              <th className="text-center py-2 px-1 font-normal w-16">Rangs</th>
              <th className="text-center py-2 px-1 font-normal w-14">Divers</th>
              <th className="text-center py-2 px-1 font-normal w-14">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.competences.map((comp, idx) => {
              const ref = COMPETENCES_DND35.find(c => c.nom === comp.nom)
              const isClasse = ref?.classesCompetence.some(cc => allClassNames.includes(cc)) ?? false
              const maxRangs = isClasse ? data.niveau + 3 : Math.floor((data.niveau + 3) / 2)
              const abilMod = getAbilMod(comp.caracteristique)
              const total = comp.rangs + abilMod + comp.divers
              const hasData = comp.rangs > 0 || comp.divers > 0
              return (
                <tr key={comp.nom} className={`border-b border-stone-900 ${hasData ? 'bg-amber-900/10' : 'hover:bg-stone-800/30'}`}>
                  <td className="py-1 pr-2 text-stone-300">{comp.nom}</td>
                  <td className="text-center text-stone-500 px-1">{comp.caracteristique}</td>
                  <td className="text-center px-1">{isClasse ? <span className="text-amber-600">●</span> : <span className="text-stone-700">○</span>}</td>
                  <td className="px-1">
                    <input type="number" min={0} max={maxRangs} value={comp.rangs}
                      onChange={e => { const cs = [...data.competences]; cs[idx] = { ...cs[idx], rangs: Math.min(maxRangs, parseInt(e.target.value) || 0) }; update('competences', cs) }}
                      className="w-full bg-stone-800 border border-stone-700 rounded px-1 py-0.5 text-stone-100 text-center focus:outline-none focus:border-amber-500" />
                  </td>
                  <td className="px-1">
                    <input type="number" value={comp.divers}
                      onChange={e => { const cs = [...data.competences]; cs[idx] = { ...cs[idx], divers: parseInt(e.target.value) || 0 }; update('competences', cs) }}
                      className="w-full bg-stone-800 border border-stone-700 rounded px-1 py-0.5 text-stone-100 text-center focus:outline-none focus:border-amber-500" />
                  </td>
                  <td className={`text-center font-bold font-mono px-1 ${total > 0 ? 'text-amber-400' : 'text-stone-600'}`}>{total > 0 ? formatMod(total) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Section: Dons ───────────────────────────────────────────────────────────
function SectionDons({ data, update }: { data: CharacterFormData; update: Upd }) {
  const [catFilter, setCatFilter] = useState<FeatCategorie | 'Tous'>('Tous')
  const [pendingFeat, setPendingFeat] = useState<FeatDef | null>(null)
  const [selectedWeapon, setSelectedWeapon] = useState('')
  const [customDon, setCustomDon] = useState('')

  const allClasses = (data.classes ?? [{ classe: data.classe, niveau: data.niveau }]).map(c => c.classe)

  // Catégories pertinentes pour les classes du personnage (union multi-classes)
  const relevantCats = new Set<FeatCategorie>(['Général'])
  allClasses.forEach(cls => (CATEGORIES_PAR_CLASSE[cls] ?? []).forEach(cat => relevantCats.add(cat)))
  const CAT_ORDER: FeatCategorie[] = ['Combat', 'Tir', 'Magie', 'Métamagie', 'Divin', 'Général']
  const visibleCats = CAT_ORDER.filter(c => relevantCats.has(c))

  // Dons à afficher selon le filtre actif
  const displayedFeats = FEATS_DND35.filter(f =>
    relevantCats.has(f.categorie) && (catFilter === 'Tous' || f.categorie === catFilter)
  )

  // Armes disponibles : SRD + armes personnalisées du personnage
  const customWeaponNames = data.armes
    .map(a => a.nom)
    .filter(n => n && !WEAPONS_DND35.some(w => w.nom === n))
  const weaponOptions: { groupe: string; noms: string[] }[] = [
    ...WEAPON_CATEGORIES.map(cat => ({
      groupe: cat,
      noms: WEAPONS_DND35.filter(w => w.categorie === cat).map(w => w.nom),
    })).filter(g => g.noms.length > 0),
    ...(customWeaponNames.length > 0 ? [{ groupe: 'Personnalisées', noms: customWeaponNames }] : []),
  ]
  const allWeaponNames = weaponOptions.flatMap(g => g.noms)

  function selectFeat(feat: FeatDef) {
    if (feat.needsWeapon) {
      setPendingFeat(feat)
      setSelectedWeapon(allWeaponNames[0] ?? '')
    } else {
      if (!data.dons.includes(feat.nom)) update('dons', [...data.dons, feat.nom])
    }
  }

  function confirmWeapon() {
    if (!pendingFeat || !selectedWeapon) return
    update('dons', [...data.dons, `${pendingFeat.nom} (${selectedWeapon})`])
    setPendingFeat(null)
  }

  function addCustom() {
    if (!customDon.trim()) return
    update('dons', [...data.dons, customDon.trim()])
    setCustomDon('')
  }

  return (
    <div className={CARD}>
      <div className={SEC_H}>Dons</div>

      {/* Filtre par catégorie */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button onClick={() => setCatFilter('Tous')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${catFilter === 'Tous' ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}>
          Tous
        </button>
        {visibleCats.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${catFilter === cat ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Sélecteur d'arme pour les dons ciblant une arme */}
      {pendingFeat && (
        <div className="mb-3 p-3 bg-stone-800/60 rounded border border-amber-700/40">
          <p className="text-amber-300 text-sm font-medium mb-2">{pendingFeat.nom} — choisir l'arme :</p>
          <div className="flex gap-2">
            <select className={SEL + ' flex-1'} value={selectedWeapon} onChange={e => setSelectedWeapon(e.target.value)}>
              {weaponOptions.map(g => (
                <optgroup key={g.groupe} label={g.groupe}>
                  {g.noms.map(n => <option key={n} value={n}>{n}</option>)}
                </optgroup>
              ))}
            </select>
            <button onClick={confirmWeapon} className="shrink-0 bg-amber-700 hover:bg-amber-600 text-white text-sm px-3 py-1.5 rounded transition-colors">Ajouter</button>
            <button onClick={() => setPendingFeat(null)} className={BTN_DEL}>✕</button>
          </div>
        </div>
      )}

      {/* Liste des dons disponibles */}
      <div className="grid gap-1 max-h-72 overflow-y-auto pr-1 mb-4">
        {displayedFeats.length === 0 && <p className="text-stone-600 text-sm italic">Aucun don dans cette catégorie.</p>}
        {displayedFeats.map(feat => {
          const alreadyAdded = !feat.needsWeapon && data.dons.includes(feat.nom)
          return (
            <button key={feat.nom} disabled={alreadyAdded} onClick={() => selectFeat(feat)}
              className={`text-left flex items-center justify-between gap-3 px-3 py-2 rounded border transition-colors ${alreadyAdded ? 'opacity-40 cursor-default bg-stone-800/20 border-transparent' : 'bg-stone-800/50 border-transparent hover:bg-amber-900/25 hover:border-amber-700/40'}`}>
              <div className="min-w-0">
                <div className="text-stone-100 text-sm font-medium truncate">
                  {feat.nom}{feat.needsWeapon && <span className="text-stone-500 ml-1 text-xs">(arme…)</span>}
                </div>
                <div className="text-amber-500 text-xs mt-0.5 truncate">{feat.description}</div>
              </div>
              <span className={`shrink-0 text-xs ${alreadyAdded ? 'text-amber-600' : 'text-stone-600'}`}>
                {alreadyAdded ? '✓' : '+'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Don hors liste (saisie libre) */}
      <div className="flex gap-2 mb-4 pt-3 border-t border-stone-800">
        <input className={INP} value={customDon} onChange={e => setCustomDon(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Don hors liste (saisie libre)…" />
        <button onClick={addCustom} className="shrink-0 bg-stone-700 hover:bg-stone-600 text-white text-sm px-4 py-1.5 rounded transition-colors">+</button>
      </div>

      {/* Dons sélectionnés */}
      <div className="space-y-1.5">
        <div className="text-stone-500 text-xs mb-1">Dons du personnage ({data.dons.length})</div>
        {data.dons.map((don, idx) => (
          <div key={idx} className="flex items-center justify-between bg-stone-800/60 rounded px-3 py-2">
            <span className="text-stone-100 text-sm">{don}</span>
            <button onClick={() => update('dons', data.dons.filter((_, i) => i !== idx))} className={BTN_DEL}>✕</button>
          </div>
        ))}
        {data.dons.length === 0 && <p className="text-stone-600 text-sm italic">Aucun don sélectionné.</p>}
      </div>
    </div>
  )
}

// ─── Section: Équipement ─────────────────────────────────────────────────────
function SectionEquipement({ data, update, derived }: { data: CharacterFormData; update: Upd; derived: Derived }) {
  const [newLang, setNewLang] = useState('')
  // Track which weapon rows are in custom-name mode (nom doesn't match any template)
  const [customRows, setCustomRows] = useState<Set<number>>(() => new Set(
    data.armes.map((a, i) => ({ a, i }))
      .filter(({ a }) => a.nom !== '' && !WEAPONS_DND35.find(w => w.nom === a.nom))
      .map(({ i }) => i)
  ))
  const newArme = () => update('armes', [...data.armes, { nom: '', degats: '1d6', crit: '20-20/×2', typeDegats: 'T', portee: 'Contact', bonusMagique: 0, coteDeForce: null, bonusMunitions: null, quantite: 1 }])
  const delArme = (i: number) => {
    setCustomRows(prev => {
      const s = new Set<number>()
      prev.forEach(idx => { if (idx < i) s.add(idx); else if (idx > i) s.add(idx - 1) })
      return s
    })
    update('armes', data.armes.filter((_, j) => j !== i))
  }
  const setArme = (i: number, k: string, v: any) => { const a = [...data.armes]; (a[i] as any)[k] = v; update('armes', a) }
  const selectArmeTemplate = (i: number, t: WeaponTemplate) => {
    setCustomRows(prev => { const s = new Set(prev); s.delete(i); return s })
    const a = [...data.armes]
    a[i] = { ...a[i], nom: t.nom, degats: t.degats, crit: t.crit, typeDegats: t.typeDegats, portee: t.portee }
    update('armes', a)
  }
  const newArmure = () => update('armures', [...data.armures, { nom: '', type: 'Légère', bonusCA: 0, maxDex: 10, malusComp: 0, bonusMagique: 0 }])
  const delArmure = (i: number) => update('armures', data.armures.filter((_, j) => j !== i))
  const setArmure = (i: number, k: string, v: any) => { const a = [...data.armures]; (a[i] as any)[k] = v; update('armures', a) }
  const newObj = () => update('objetsMagiques', [...data.objetsMagiques, { nom: '', type: '', emplacement: '', bonus: '', description: '', charges: 0 }])
  const delObj = (i: number) => update('objetsMagiques', data.objetsMagiques.filter((_, j) => j !== i))
  const setObj = (i: number, k: string, v: any) => { const a = [...data.objetsMagiques]; (a[i] as any)[k] = v; update('objetsMagiques', a) }
  const newPot = () => update('potions', [...data.potions, { nom: '', effet: '', charges: 1 }])
  const delPot = (i: number) => update('potions', data.potions.filter((_, j) => j !== i))
  const setPot = (i: number, k: string, v: any) => { const a = [...data.potions]; (a[i] as any)[k] = v; update('potions', a) }
  const addLang = () => { if (!newLang.trim()) return; update('langues', [...data.langues, newLang.trim()]); setNewLang('') }

  return (
    <div className="grid gap-4">
      {/* Armes */}
      <div className={CARD}>
        <div className={SEC_H}>Armes</div>
        {data.armes.map((a, i) => (
          <div key={i} className="mb-2 bg-stone-800/30 rounded p-2">
            {/* Rangée principale */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-end">
              <div className="sm:col-span-2">
                <label className={LBL}>Arme</label>
                {(() => {
                  const template = WEAPONS_DND35.find(w => w.nom === a.nom)
                  const isCustom = customRows.has(i) || (a.nom !== '' && !template)
                  const selectVal = template ? a.nom : (isCustom ? '__custom__' : '')
                  return (
                    <>
                      <select className={SEL} value={selectVal} onChange={e => {
                        const val = e.target.value
                        if (val === '__custom__') {
                          setCustomRows(prev => new Set([...prev, i]))
                          setArme(i, 'nom', '')
                        } else if (val === '') {
                          setCustomRows(prev => { const s = new Set(prev); s.delete(i); return s })
                          setArme(i, 'nom', '')
                        } else {
                          const t = WEAPONS_DND35.find(w => w.nom === val)!
                          selectArmeTemplate(i, t)
                        }
                      }}>
                        <option value="">— Choisir une arme —</option>
                        {WEAPON_CATEGORIES.map(cat => (
                          <optgroup key={cat} label={`Armes ${cat === 'Courante' ? 'courantes' : cat === 'Guerre' ? 'de guerre' : 'exotiques'}`}>
                            {WEAPONS_DND35.filter(w => w.categorie === cat).map(w => (
                              <option key={w.nom} value={w.nom}>{w.nom}</option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="__custom__">— Arme personnalisée —</option>
                      </select>
                      {isCustom && (
                        <input className={INP + ' mt-1'} value={a.nom} onChange={e => setArme(i, 'nom', e.target.value)} placeholder="Nom de l'arme..." />
                      )}
                    </>
                  )
                })()}
              </div>
              <div><label className={LBL}>Dégâts</label><input className={INP} value={a.degats} onChange={e => setArme(i, 'degats', e.target.value)} placeholder="1d8" /></div>
              <div><label className={LBL}>Crit</label><input className={INP} value={a.crit} onChange={e => setArme(i, 'crit', e.target.value)} placeholder="20/×2" /></div>
              <div><label className={LBL}>Type</label><select className={SEL} value={a.typeDegats} onChange={e => setArme(i, 'typeDegats', e.target.value)}><option value="T">T (tranchant)</option><option value="C">C (contondant)</option><option value="P">P (perforant)</option></select></div>
              <div><label className={LBL}>+Mag</label><input className={INP_NUM + ' w-full'} type="number" value={a.bonusMagique} onChange={e => setArme(i, 'bonusMagique', parseInt(e.target.value) || 0)} /></div>
              <div className="flex items-end gap-1"><div className="flex-1"><label className={LBL}>Qté</label><input className={INP_NUM + ' w-full'} type="number" min={1} value={a.quantite} onChange={e => setArme(i, 'quantite', parseInt(e.target.value) || 1)} /></div><button onClick={() => delArme(i)} className={BTN_DEL + ' mb-2'}>✕</button></div>
            </div>
            {/* Sous-rangée conditionnelle : arc composite (côte Force) et arcs/arbalètes (munitions) */}
            {(() => {
              const nomL = a.nom.toLowerCase()
              const isComposite = nomL.includes('composite')
              const isRanged = isComposite || /arc|arbalète|arbalette/i.test(a.nom) || a.portee !== 'Contact'
              if (!isComposite && !isRanged) return null
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5 pt-1.5 border-t border-stone-700/30 items-end">
                  {isComposite && (
                    <div><label className={LBL} title="Bonus de Force maximal ajouté aux dégâts (ne s'applique pas au jet d'attaque)">Côte Force</label><input className={INP_NUM + ' w-full'} type="number" min={0} value={a.coteDeForce ?? ''} placeholder="—" onChange={e => setArme(i, 'coteDeForce', e.target.value === '' ? null : parseInt(e.target.value) || 0)} /></div>
                  )}
                  {isRanged && (
                    <div><label className={LBL} title="Flèches +1, bolts +2, etc. S'ajoute à l'attaque ET aux dégâts.">Munitions +Mag</label><input className={INP_NUM + ' w-full'} type="number" min={0} value={a.bonusMunitions ?? ''} placeholder="—" onChange={e => setArme(i, 'bonusMunitions', e.target.value === '' ? null : parseInt(e.target.value) || 0)} /></div>
                  )}
                  <div className={`${isComposite && isRanged ? '' : 'sm:col-span-3'} flex items-end pb-1`}>
                    <span className="text-stone-600 text-xs italic">
                      {isComposite ? 'Arc composite : côte Force plafonne le bonus FOR aux dégâts' : 'Munitions magiques : flèches, bolts, etc.'}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        ))}
        <div className="flex gap-4 mt-2">
          <button onClick={newArme} className={BTN_ADD}><span className="text-xl">+</span> Ajouter une arme</button>
          <button onClick={() => {
            const idx = data.armes.length
            update('armes', [...data.armes, { nom: '', degats: '1d6', crit: '20-20/×2', typeDegats: 'T', portee: 'Contact', bonusMagique: 0, coteDeForce: null, bonusMunitions: null, quantite: 1 }])
            setCustomRows(prev => new Set([...prev, idx]))
          }} className={BTN_ADD + ' text-purple-400 hover:text-purple-200'}><span className="text-xl">+</span> Arme personnalisée</button>
        </div>
      </div>

      {/* Armure */}
      <div className={CARD}>
        <div className={SEC_H}>Armure &amp; Boucliers</div>
        {data.armures.map((a, i) => (
          <div key={i} className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2 items-end bg-stone-800/30 rounded p-2">
            <div className="sm:col-span-2"><label className={LBL}>Nom</label><input className={INP} value={a.nom} onChange={e => setArmure(i, 'nom', e.target.value)} placeholder="Chemise de mailles" /></div>
            <div><label className={LBL}>Type</label><select className={SEL} value={a.type} onChange={e => setArmure(i, 'type', e.target.value)}><option>Légère</option><option>Intermédiaire</option><option>Lourde</option><option>Bouclier</option></select></div>
            <div><label className={LBL}>Bonus CA</label><input className={INP_NUM + ' w-full'} type="number" value={a.bonusCA} onChange={e => setArmure(i, 'bonusCA', parseInt(e.target.value) || 0)} /></div>
            <div><label className={LBL}>+Mag</label><input className={INP_NUM + ' w-full'} type="number" value={a.bonusMagique} onChange={e => setArmure(i, 'bonusMagique', parseInt(e.target.value) || 0)} /></div>
            <div className="flex items-end"><button onClick={() => delArmure(i)} className={BTN_DEL + ' mb-2 ml-auto'}>✕</button></div>
          </div>
        ))}
        <button onClick={newArmure} className={BTN_ADD}><span className="text-xl">+</span> Ajouter une armure</button>
      </div>

      {/* Objets magiques */}
      <div className={CARD}>
        <div className={SEC_H}>Objets magiques</div>
        {data.objetsMagiques.map((o, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-2 items-end bg-stone-800/30 rounded p-2">
            <div className="sm:col-span-2"><label className={LBL}>Nom</label><input className={INP} value={o.nom} onChange={e => setObj(i, 'nom', e.target.value)} placeholder="Cape de protection +1" /></div>
            <div><label className={LBL}>Emplacement</label><input className={INP} value={o.emplacement} onChange={e => setObj(i, 'emplacement', e.target.value)} placeholder="Épaules" /></div>
            <div><label className={LBL}>Bonus</label><input className={INP} value={o.bonus} onChange={e => setObj(i, 'bonus', e.target.value)} placeholder="+1 CA" /></div>
            <div><label className={LBL}>Charges</label><input className={INP_NUM + ' w-full'} type="number" min={0} value={o.charges} onChange={e => setObj(i, 'charges', parseInt(e.target.value) || 0)} title="0 = pas de charges" /></div>
            <div className="flex items-end"><button onClick={() => delObj(i)} className={BTN_DEL + ' mb-2 ml-auto'}>✕</button></div>
          </div>
        ))}
        <button onClick={newObj} className={BTN_ADD}><span className="text-xl">+</span> Ajouter un objet magique</button>
      </div>

      {/* Potions */}
      <div className={CARD}>
        <div className={SEC_H}>Potions &amp; Parchemins</div>
        {data.potions.map((p, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 items-end bg-stone-800/30 rounded p-2">
            <div><label className={LBL}>Nom</label><input className={INP} value={p.nom} onChange={e => setPot(i, 'nom', e.target.value)} placeholder="Potion de soins" /></div>
            <div className="sm:col-span-2"><label className={LBL}>Effet</label><input className={INP} value={p.effet} onChange={e => setPot(i, 'effet', e.target.value)} placeholder="Soins modérés (2d8+5)" /></div>
            <div className="flex items-end gap-1"><div className="flex-1"><label className={LBL}>Charges</label><input className={INP_NUM + ' w-full'} type="number" min={1} value={p.charges} onChange={e => setPot(i, 'charges', parseInt(e.target.value) || 1)} /></div><button onClick={() => delPot(i)} className={BTN_DEL + ' mb-2'}>✕</button></div>
          </div>
        ))}
        <button onClick={newPot} className={BTN_ADD}><span className="text-xl">+</span> Ajouter une potion</button>
      </div>

      {/* Trésor */}
      <div className={CARD}>
        <div className={SEC_H}>Trésor</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {([
            ['pp', 'PP', 'Platine'],
            ['po', 'PO', "Or"],
            ['pe', 'PE', 'Électrum'],
            ['pa', 'PA', 'Argent'],
            ['pc', 'PC', 'Cuivre'],
            ['pm', 'PM', 'Mithral'],
          ] as const).map(([k, lbl, nom]) => (
            <div key={k} className="flex flex-col">
              <label className={LBL + ' text-center'}>{lbl}</label>
              <input className={INP_NUM + ' w-full text-center'} type="number" min={0} value={(data as any)[k]} onChange={e => update(k, parseFloat(e.target.value) || 0)} />
              <span className="text-stone-600 text-xs text-center mt-0.5">{nom}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Langues */}
      <div className={CARD}>
        <div className={SEC_H}>Langues</div>
        <div className="flex gap-2 mb-3">
          <input className={INP} value={newLang} onChange={e => setNewLang(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLang()} placeholder="Commun, Elfique, Nain..." />
          <button onClick={addLang} className="shrink-0 bg-stone-700 hover:bg-stone-600 text-white text-sm px-3 py-1.5 rounded transition-colors">+</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.langues.map((l, i) => (
            <span key={i} className="flex items-center gap-1 bg-stone-800 text-stone-300 text-xs px-2 py-1 rounded">
              {l}<button onClick={() => update('langues', data.langues.filter((_, j) => j !== i))} className="text-stone-600 hover:text-red-400 ml-1">✕</button>
            </span>
          ))}
          {data.langues.length === 0 && <span className="text-stone-600 text-xs italic">Aucune langue.</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Sorts ──────────────────────────────────────────────────────────
function SectionSorts({ data, update, derived }: { data: CharacterFormData; update: Upd; derived: Derived }) {
  const [spellLevel, setSpellLevel] = useState(0)

  // Si plusieurs classes lanceurs de sorts, permettre le choix de la classe active
  const casterClassNames = derived.casterClasses.map(c => c.classe)
  const [activeCasterClass, setActiveCasterClass] = useState<string>(casterClassNames[0] ?? data.classe)
  const effectiveCaster = casterClassNames.includes(activeCasterClass) ? activeCasterClass : (casterClassNames[0] ?? data.classe)
  // Niveau de la classe lanceur active (pas le niveau total)
  const activeCasterNiveau = (data.classes ?? [{ classe: data.classe, niveau: data.niveau }])
    .find(c => c.classe === effectiveCaster)?.niveau ?? data.niveau

  const classeKey = effectiveCaster as ClasseSortKey
  const nMax = niveauxMaxForClasse(classeKey)
  const levels = Array.from({ length: nMax + 1 }, (_, i) => i)
  const sortsLevel = sortsByClasseEtNiveau(classeKey, spellLevel)
  const slots = getSortsSlotsParJour(effectiveCaster, activeCasterNiveau)
  const selectedAtLevel = data.sorts.filter(s => s.niveau === spellLevel).reduce((sum, s) => sum + (s.nombrePrepare ?? 0), 0)
  const slotsAtLevel = slots[spellLevel] ?? 0

  function toggle(sort: SortDnD) {
    const exists = data.sorts.some(s => s.nom === sort.nom)
    if (exists) {
      update('sorts', data.sorts.filter(s => s.nom !== sort.nom))
    } else {
      update('sorts', [...data.sorts, { nom: sort.nom, niveau: sort.niveaux[classeKey] ?? spellLevel, ecole: sort.ecole, nombrePrepare: 0 }])
    }
  }

  function setPrep(nom: string, delta: number) {
    update('sorts', data.sorts.map(s => s.nom === nom ? { ...s, nombrePrepare: Math.max(0, (s.nombrePrepare ?? 0) + delta) } : s))
  }

  const classeLabel = (data.classes ?? [{ classe: data.classe, niveau: data.niveau }]).map(c => `${c.classe} ${c.niveau}`).join(' / ')

  return (
    <div className={CARD}>
      <div className={SEC_H}>Sorts — {classeLabel} <span className="text-stone-500 font-normal">({data.sorts.length} sort{data.sorts.length > 1 ? 's' : ''} au total)</span></div>

      {/* Sélecteur de classe si multi-lanceur */}
      {casterClassNames.length > 1 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {casterClassNames.map(cn => {
            const niv = (data.classes ?? []).find(c => c.classe === cn)?.niveau ?? 1
            return (
              <button key={cn} onClick={() => { setActiveCasterClass(cn); setSpellLevel(0) }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${effectiveCaster === cn ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}>
                {cn} niv.{niv}
              </button>
            )
          })}
        </div>
      )}

      {derived.casterClasses.find(c => c.classe === effectiveCaster) && (
        <p className="text-stone-400 text-xs mb-3">
          Caractéristique de lancement ({effectiveCaster}) : <span className="text-amber-400 font-semibold">{getClasseInfo(effectiveCaster)?.caracteristiqueSorts}</span>
        </p>
      )}

      {/* Résumé des emplacements disponibles */}
      {slots.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-2 bg-stone-900/60 rounded border border-stone-700/40">
          <span className="text-stone-500 text-xs self-center">Emplacements/jour :</span>
          {slots.map((n, i) => n > 0 && (
            <span key={i} className="text-xs px-2 py-0.5 rounded bg-stone-800 border border-stone-700">
              <span className="text-stone-500">niv.{i} </span>
              <span className="text-amber-400 font-bold">{n}</span>
            </span>
          ))}
          <span className="text-stone-600 text-xs self-center ml-auto italic">+ bonus hautes carac.</span>
        </div>
      )}

      {/* Onglets par niveau */}
      <div className="flex flex-wrap gap-1 mb-2">
        {levels.map(l => {
          const slotCount = slots[l] ?? 0
          const selCount = data.sorts.filter(s => s.niveau === l).reduce((sum, s) => sum + (s.nombrePrepare ?? 0), 0)
          const knownCount = data.sorts.filter(s => s.niveau === l).length
          return (
            <button key={l} onClick={() => setSpellLevel(l)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${spellLevel === l ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}>
              Niv.{l}
              {knownCount > 0 && <span className="text-stone-600 text-xs ml-0.5">({knownCount})</span>}
              {slotCount > 0 && <span className={`ml-1 text-xs ${selCount >= slotCount ? 'text-amber-400' : 'text-stone-500'}`}>[{selCount}/{slotCount}]</span>}
            </button>
          )
        })}
      </div>

      {/* Info emplacements pour le niveau sélectionné */}
      {slotsAtLevel > 0 && (
        <div className={`text-xs mb-3 px-2 py-1 rounded ${selectedAtLevel >= slotsAtLevel ? 'bg-amber-900/30 text-amber-400' : 'bg-stone-800/40 text-stone-500'}`}>
          Niveau {spellLevel} : <span className="font-bold">{selectedAtLevel}</span> préparation{selectedAtLevel > 1 ? 's' : ''} · {slotsAtLevel} emplacement{slotsAtLevel > 1 ? 's' : ''} de base
          {selectedAtLevel > slotsAtLevel && <span className="text-amber-500 ml-1">(dépassement — bonus de carac. requis)</span>}
        </div>
      )}
      {slotsAtLevel === 0 && spellLevel > 0 && (
        <p className="text-stone-600 text-xs mb-3 italic">Niveau {spellLevel} non accessible au niveau {data.niveau}.</p>
      )}

      {/* Liste des sorts pour ce niveau */}
      <div className="grid gap-1.5 max-h-96 overflow-y-auto pr-1">
        {sortsLevel.length === 0 && <p className="text-stone-600 text-sm italic">Aucun sort de ce niveau dans la liste.</p>}
        {sortsLevel.map(sort => {
          const selected = data.sorts.some(s => s.nom === sort.nom)
          return (
            <label key={sort.nom} className={`flex items-start gap-3 p-2.5 rounded cursor-pointer transition-colors ${selected ? 'bg-amber-900/30 border border-amber-700/40' : 'bg-stone-800/40 hover:bg-stone-800/70'}`}>
              <input type="checkbox" checked={selected} onChange={() => toggle(sort)} className="mt-0.5 shrink-0 accent-amber-600" />
              <div>
                <div className="text-stone-100 text-sm font-medium">
                  {sort.nom} <span className="text-stone-500 text-xs">({sort.ecole})</span>
                  <a href={`https://www.google.com/search?q=site:regles-donjons-dragons.com+${encodeURIComponent(sort.nom)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Voir la description D&D 3.5" className="ml-1.5 text-stone-600 hover:text-amber-400 transition-colors">🔍</a>
                </div>
                <div className="text-stone-400 text-xs mt-0.5">{sort.description}</div>
                <div className="text-stone-600 text-xs mt-0.5">{sort.composantes} · {sort.portee} · {sort.duree}</div>
              </div>
            </label>
          )
        })}
      </div>

      {/* Sorts sélectionnés résumé */}
      {data.sorts.length > 0 && (
        <details className="mt-4" open>
          <summary className="text-amber-500 text-xs cursor-pointer hover:text-amber-300">
            ▸ Grimoire ({data.sorts.length} sort{data.sorts.length > 1 ? 's' : ''}) — cliquer +/− pour préparer
          </summary>
          <div className="mt-2 grid gap-1">
            {(() => {
              const sorted = [...data.sorts].sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom))
              const levels = [...new Set(sorted.map(s => s.niveau))].sort((a, b) => a - b)
              return levels.map(lvl => {
                const sortsLvl = sorted.filter(s => s.niveau === lvl)
                const slotsLvl = slots[lvl] ?? 0
                const prepLvl = sortsLvl.reduce((sum, s) => sum + (s.nombrePrepare ?? 0), 0)
                return (
                  <div key={lvl}>
                    <div className="flex items-center gap-2 mt-3 mb-1 first:mt-1">
                      <span className="text-amber-500 text-xs font-bold shrink-0">Niv. {lvl}</span>
                      {slotsLvl > 0 && (
                        <span className={`text-xs shrink-0 ${prepLvl >= slotsLvl ? 'text-amber-400 font-semibold' : 'text-stone-500'}`}>
                          · {prepLvl}/{slotsLvl} empl.
                        </span>
                      )}
                      <div className="flex-1 h-px bg-stone-700/50" />
                      <span className="text-stone-600 text-xs shrink-0">{sortsLvl.length} sort{sortsLvl.length > 1 ? 's' : ''}</span>
                    </div>
                    {sortsLvl.map(s => (
                      <div key={s.nom} className={`flex items-center justify-between rounded px-2 py-1.5 text-xs mb-0.5 ${(s.nombrePrepare ?? 0) > 0 ? 'bg-amber-900/20 border border-amber-800/40' : 'bg-stone-800/50'}`}>
                        <span className={(s.nombrePrepare ?? 0) > 0 ? 'text-amber-200 font-medium' : 'text-stone-400'}>{s.nom}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setPrep(s.nom, -1)} className="w-5 h-5 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 text-center leading-none transition-colors">−</button>
                          <span className={`w-6 text-center font-bold ${(s.nombrePrepare ?? 0) > 0 ? 'text-amber-400' : 'text-stone-600'}`}>
                            {(s.nombrePrepare ?? 0) > 0 ? `×${s.nombrePrepare}` : '○'}
                          </span>
                          <button onClick={() => setPrep(s.nom, +1)} className="w-5 h-5 rounded bg-stone-700 hover:bg-amber-700 text-stone-300 text-center leading-none transition-colors">+</button>
                          <button onClick={() => update('sorts', data.sorts.filter(x => x.nom !== s.nom))} className={BTN_DEL + ' ml-1'}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })
            })()}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Section: Notes ──────────────────────────────────────────────────────────
function SectionNotes({ data, update }: { data: CharacterFormData; update: Upd }) {
  const newComp = () => update('compagnons', [...data.compagnons, { nom: '', race: '', classe: '', joueur: '', notes: '' }])
  const delComp = (i: number) => update('compagnons', data.compagnons.filter((_, j) => j !== i))
  const setComp = (i: number, k: string, v: any) => { const c = [...data.compagnons]; (c[i] as any)[k] = v; update('compagnons', c) }
  return (
    <div className="grid gap-4">
      <div className={CARD}>
        <div className={SEC_H}>Historique</div>
        <textarea rows={6} className={INP + ' resize-y'} value={data.historique} onChange={e => update('historique', e.target.value)} placeholder="Origines, motivations, background du personnage..." />
      </div>
      <div className={CARD}>
        <div className={SEC_H}>Notes diverses</div>
        <textarea rows={5} className={INP + ' resize-y'} value={data.notes} onChange={e => update('notes', e.target.value)} placeholder="Quêtes en cours, informations importantes..." />
      </div>
      <div className={CARD}>
        <div className={SEC_H}>Compagnons &amp; Alliés</div>
        {data.compagnons.map((c, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 items-end bg-stone-800/30 rounded p-2">
            <div><label className={LBL}>Nom *</label><input className={INP} value={c.nom} onChange={e => setComp(i, 'nom', e.target.value)} placeholder="Grimdor" /></div>
            <div><label className={LBL}>Race</label><input className={INP} value={c.race} onChange={e => setComp(i, 'race', e.target.value)} placeholder="Nain" /></div>
            <div><label className={LBL}>Classe</label><input className={INP} value={c.classe} onChange={e => setComp(i, 'classe', e.target.value)} placeholder="Guerrier" /></div>
            <div className="flex items-end gap-1"><div className="flex-1"><label className={LBL}>Joueur</label><input className={INP} value={c.joueur} onChange={e => setComp(i, 'joueur', e.target.value)} placeholder="Prénom" /></div><button onClick={() => delComp(i)} className={BTN_DEL + ' mb-2'}>✕</button></div>
          </div>
        ))}
        <button onClick={newComp} className={BTN_ADD}><span className="text-xl">+</span> Ajouter un compagnon</button>
      </div>
    </div>
  )
}

// ─── Main form component ──────────────────────────────────────────────────────
export function CharacterForm({ personnageId, initialData }: { personnageId?: number; initialData?: CharacterFormData }) {
  const [data, setData] = useState<CharacterFormData>(initialData ?? DEFAULT_FORM)
  const [tab, setTab] = useState('identite')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const update = useCallback(<K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setData(d => {
      const next = { ...d, [key]: value }
      if (key === 'classes') {
        const cls = value as { classe: string; niveau: number }[]
        next.classe = cls[0]?.classe ?? d.classe
        next.niveau = cls.reduce((sum, c) => sum + c.niveau, 0) || 1
      }
      return next
    })
  }, [])

  const derived = calcDerived(data)

  const TABS = [
    { id: 'identite', label: 'Identité' },
    { id: 'caracteristiques', label: 'Caractéristiques' },
    { id: 'combat', label: 'Combat' },
    { id: 'competences', label: 'Compétences' },
    { id: 'dons', label: 'Dons' },
    { id: 'equipement', label: 'Équipement' },
    ...(derived.lanceurSorts ? [{ id: 'sorts', label: 'Sorts ✨' }] : []),
    { id: 'notes', label: 'Notes' },
  ]

  function handleSubmit() {
    if (!data.nom.trim()) { setError('Le nom du personnage est obligatoire.'); return }
    setError(null)
    startTransition(async () => {
      try {
        const result = await saveCharacter(data, personnageId)
        router.push(`/personnage/${result.id}`)
      } catch (e) {
        setError('Erreur lors de la sauvegarde. Vérifiez votre connexion.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 bg-stone-900 border-b border-amber-900/40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-stone-500 hover:text-amber-300 text-sm shrink-0 transition-colors">← Grimoire</Link>
            <span className="text-stone-700">|</span>
            <h1 className="text-amber-300 font-bold truncate">{data.nom || 'Nouveau personnage'}</h1>
            {(data.classes?.length > 0 ? data.classes : data.classe ? [{ classe: data.classe, niveau: data.niveau }] : []).length > 0 && (
              <span className="text-stone-500 text-sm shrink-0">
                {(data.classes ?? [{ classe: data.classe, niveau: data.niveau }]).map(c => `${c.classe} ${c.niveau}`).join(' / ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={personnageId ? `/aide/creation?from=/personnage/${personnageId}/modifier` : '/aide/creation'}
              className="inline-flex items-center gap-1.5 bg-stone-800/50 hover:bg-stone-700/60 border border-stone-700/50 hover:border-stone-500 text-stone-400 hover:text-stone-200 text-sm px-3 py-2 rounded-lg transition-all"
              title="Aide — Guide de création"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Aide
            </Link>
            <button onClick={handleSubmit} disabled={isPending || !data.nom.trim()} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {isPending ? 'Sauvegarde...' : personnageId ? 'Enregistrer' : 'Créer le personnage'}
            </button>
          </div>
        </div>
        {error && <div className="bg-red-900/50 border-t border-red-700/50 px-4 py-2 text-red-300 text-sm">{error}</div>}
        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-4 flex gap-0.5 overflow-x-auto pb-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm whitespace-nowrap transition-colors border-b-2 ${tab === t.id ? 'border-amber-500 text-amber-300 font-medium' : 'border-transparent text-stone-500 hover:text-stone-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'identite' && <SectionIdentite data={data} update={update} />}
        {tab === 'caracteristiques' && <SectionCaracteristiques data={data} update={update} derived={derived} />}
        {tab === 'combat' && <SectionCombat data={data} update={update} derived={derived} />}
        {tab === 'competences' && <SectionCompetences data={data} update={update} derived={derived} />}
        {tab === 'dons' && <SectionDons data={data} update={update} />}
        {tab === 'equipement' && <SectionEquipement data={data} update={update} derived={derived} />}
        {tab === 'sorts' && derived.lanceurSorts && <SectionSorts data={data} update={update} derived={derived} />}
        {tab === 'notes' && <SectionNotes data={data} update={update} />}

        {/* Bottom save */}
        <div className="mt-8 flex justify-end">
          <button onClick={handleSubmit} disabled={isPending || !data.nom.trim()} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
            {isPending ? '⏳ Sauvegarde en cours...' : personnageId ? '💾 Enregistrer les modifications' : '⚔️ Créer le personnage'}
          </button>
        </div>
      </main>
    </div>
  )
}

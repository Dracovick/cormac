'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CharacterFormData } from '@/app/actions/character'
import { saveCharacter } from '@/app/actions/character'
import { getModifier, formatMod, ALIGNEMENTS } from '@/lib/dnd35/rules'
import { CLASSES_DND35, getClasseInfo } from '@/lib/dnd35/classes'
import { RACES_DND35, getRaceInfo } from '@/lib/dnd35/races'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'
import { sortsByClasseEtNiveau, niveauxMaxForClasse, type ClasseSortKey, type SortDnD } from '@/lib/dnd35/spells'
import { getBab } from '@/lib/dnd35/rules'

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
  po: 0, pa: 0, pc: 0, pe: 0, pm: 0,
  langues: [], sorts: [],
  historique: '', notes: '', compagnons: [],
}

// ─── Derived stats ────────────────────────────────────────────────────────────
type Derived = ReturnType<typeof calcDerived>

function calcDerived(data: CharacterFormData) {
  const raceInfo = getRaceInfo(data.race)
  const classeInfo = getClasseInfo(data.classe)
  const forT = data.forBase + data.forMagique + (raceInfo?.bonusFor ?? 0)
  const dexT = data.dexBase + data.dexMagique + (raceInfo?.bonusDex ?? 0)
  const conT = data.conBase + data.conMagique + (raceInfo?.bonusCon ?? 0)
  const intT = data.intBase + data.intMagique + (raceInfo?.bonusInt ?? 0)
  const sagT = data.sagBase + data.sagMagique + (raceInfo?.bonusSag ?? 0)
  const chaT = data.chaBase + data.chaMagique + (raceInfo?.bonusCha ?? 0)
  const forMod = getModifier(forT); const dexMod = getModifier(dexT); const conMod = getModifier(conT)
  const intMod = getModifier(intT); const sagMod = getModifier(sagT); const chaMod = getModifier(chaT)
  const bbaBase = classeInfo ? getBab(classeInfo.bab, data.niveau) : 0
  const saves = classeInfo?.bonsSauvegardes ?? []
  const vigBase = saves.includes('vigueur') ? 2 + Math.floor(data.niveau / 2) : Math.floor(data.niveau / 3)
  const refBase = saves.includes('reflexes') ? 2 + Math.floor(data.niveau / 2) : Math.floor(data.niveau / 3)
  const volBase = saves.includes('volonte') ? 2 + Math.floor(data.niveau / 2) : Math.floor(data.niveau / 3)
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
    lanceurSorts: classeInfo?.lanceurSorts ?? false,
    niveauMaxSorts: classeInfo?.niveauMaxSorts ?? 0,
    classeInfo, raceInfo,
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
            <label className={LBL}>Race</label>
            <select className={SEL} value={data.race} onChange={e => update('race', e.target.value)}>
              {RACES_DND35.map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}
              <option value="">— Autre —</option>
            </select>
          </div>
          <div>
            <label className={LBL}>Classe</label>
            <select className={SEL} value={data.classe} onChange={e => update('classe', e.target.value)}>
              {CLASSES_DND35.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className={LBL}>Niveau</label>
            <input className={INP_NUM + ' w-full'} type="number" min={1} max={20} value={data.niveau} onChange={e => update('niveau', Math.max(1, parseInt(e.target.value) || 1))} />
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
              const isClasse = ref?.classesCompetence.includes(data.classe) ?? false
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
  const [input, setInput] = useState('')
  const add = () => { if (!input.trim()) return; update('dons', [...data.dons, input.trim()]); setInput('') }
  return (
    <div className={CARD}>
      <div className={SEC_H}>Dons</div>
      <div className="flex gap-2 mb-4">
        <input className={INP} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Nom du don..." />
        <button onClick={add} className="shrink-0 bg-amber-700 hover:bg-amber-600 text-white text-sm px-4 py-1.5 rounded transition-colors">Ajouter</button>
      </div>
      <div className="space-y-1.5">
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
  const newArme = () => update('armes', [...data.armes, { nom: '', degats: '1d6', crit: '20/×2', typeDegats: 'T', portee: 'Contact', bonusMagique: 0, quantite: 1 }])
  const delArme = (i: number) => update('armes', data.armes.filter((_, j) => j !== i))
  const setArme = (i: number, k: string, v: any) => { const a = [...data.armes]; (a[i] as any)[k] = v; update('armes', a) }
  const newArmure = () => update('armures', [...data.armures, { nom: '', type: 'Légère', bonusCA: 0, maxDex: 10, malusComp: 0, bonusMagique: 0 }])
  const delArmure = (i: number) => update('armures', data.armures.filter((_, j) => j !== i))
  const setArmure = (i: number, k: string, v: any) => { const a = [...data.armures]; (a[i] as any)[k] = v; update('armures', a) }
  const newObj = () => update('objetsMagiques', [...data.objetsMagiques, { nom: '', type: '', emplacement: '', bonus: '', description: '' }])
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
          <div key={i} className="grid grid-cols-2 sm:grid-cols-7 gap-2 mb-2 items-end bg-stone-800/30 rounded p-2">
            <div className="sm:col-span-2"><label className={LBL}>Nom</label><input className={INP} value={a.nom} onChange={e => setArme(i, 'nom', e.target.value)} placeholder="Épée longue" /></div>
            <div><label className={LBL}>Dégâts</label><input className={INP} value={a.degats} onChange={e => setArme(i, 'degats', e.target.value)} placeholder="1d8" /></div>
            <div><label className={LBL}>Crit</label><input className={INP} value={a.crit} onChange={e => setArme(i, 'crit', e.target.value)} placeholder="20/×2" /></div>
            <div><label className={LBL}>Type</label><select className={SEL} value={a.typeDegats} onChange={e => setArme(i, 'typeDegats', e.target.value)}><option value="T">T (tranchant)</option><option value="C">C (contondant)</option><option value="P">P (perforant)</option></select></div>
            <div><label className={LBL}>+Mag</label><input className={INP_NUM + ' w-full'} type="number" value={a.bonusMagique} onChange={e => setArme(i, 'bonusMagique', parseInt(e.target.value) || 0)} /></div>
            <div className="flex items-end gap-1"><div className="flex-1"><label className={LBL}>Qté</label><input className={INP_NUM + ' w-full'} type="number" min={1} value={a.quantite} onChange={e => setArme(i, 'quantite', parseInt(e.target.value) || 1)} /></div><button onClick={() => delArme(i)} className={BTN_DEL + ' mb-2'}>✕</button></div>
          </div>
        ))}
        <button onClick={newArme} className={BTN_ADD}><span className="text-xl">+</span> Ajouter une arme</button>
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
          <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2 items-end bg-stone-800/30 rounded p-2">
            <div className="sm:col-span-2"><label className={LBL}>Nom</label><input className={INP} value={o.nom} onChange={e => setObj(i, 'nom', e.target.value)} placeholder="Cape de protection +1" /></div>
            <div><label className={LBL}>Emplacement</label><input className={INP} value={o.emplacement} onChange={e => setObj(i, 'emplacement', e.target.value)} placeholder="Épaules" /></div>
            <div><label className={LBL}>Bonus</label><input className={INP} value={o.bonus} onChange={e => setObj(i, 'bonus', e.target.value)} placeholder="+1 CA" /></div>
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
        <div className="grid grid-cols-5 gap-3">
          {([['po', 'PO'], ['pa', 'PA'], ['pc', 'PC'], ['pe', 'PE'], ['pm', 'PM']] as const).map(([k, lbl]) => (
            <div key={k}><label className={LBL + ' text-center'}>{lbl}</label><input className={INP_NUM + ' w-full'} type="number" min={0} value={(data as any)[k]} onChange={e => update(k, parseFloat(e.target.value) || 0)} /></div>
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
  const classeKey = data.classe as ClasseSortKey
  const nMax = niveauxMaxForClasse(classeKey)
  const levels = Array.from({ length: nMax + 1 }, (_, i) => i)
  const sortsLevel = sortsByClasseEtNiveau(classeKey, spellLevel)

  function toggle(sort: SortDnD) {
    const exists = data.sorts.some(s => s.nom === sort.nom)
    if (exists) {
      update('sorts', data.sorts.filter(s => s.nom !== sort.nom))
    } else {
      update('sorts', [...data.sorts, { nom: sort.nom, niveau: sort.niveaux[classeKey] ?? 0, ecole: sort.ecole, estPrepare: false }])
    }
  }

  return (
    <div className={CARD}>
      <div className={SEC_H}>Sorts — {data.classe} <span className="text-stone-500 font-normal">({data.sorts.length} sélectionné{data.sorts.length > 1 ? 's' : ''})</span></div>
      {derived.classeInfo?.caracteristiqueSorts && <p className="text-stone-400 text-xs mb-3">Caractéristique de lancement : <span className="text-amber-400 font-semibold">{derived.classeInfo.caracteristiqueSorts}</span></p>}

      {/* Onglets par niveau */}
      <div className="flex flex-wrap gap-1 mb-4">
        {levels.map(l => (
          <button key={l} onClick={() => setSpellLevel(l)} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${spellLevel === l ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}>
            Niv. {l}
          </button>
        ))}
      </div>

      {/* Liste des sorts pour ce niveau */}
      <div className="grid gap-1.5 max-h-96 overflow-y-auto pr-1">
        {sortsLevel.length === 0 && <p className="text-stone-600 text-sm italic">Aucun sort de ce niveau.</p>}
        {sortsLevel.map(sort => {
          const selected = data.sorts.some(s => s.nom === sort.nom)
          return (
            <label key={sort.nom} className={`flex items-start gap-3 p-2.5 rounded cursor-pointer transition-colors ${selected ? 'bg-amber-900/30 border border-amber-700/40' : 'bg-stone-800/40 hover:bg-stone-800/70'}`}>
              <input type="checkbox" checked={selected} onChange={() => toggle(sort)} className="mt-0.5 shrink-0 accent-amber-600" />
              <div>
                <div className="text-stone-100 text-sm font-medium">{sort.nom} <span className="text-stone-500 text-xs">({sort.ecole})</span></div>
                <div className="text-stone-400 text-xs mt-0.5">{sort.description}</div>
                <div className="text-stone-600 text-xs mt-0.5">{sort.composantes} · {sort.portee} · {sort.duree}</div>
              </div>
            </label>
          )
        })}
      </div>

      {/* Sorts sélectionnés résumé */}
      {data.sorts.length > 0 && (
        <details className="mt-4">
          <summary className="text-amber-500 text-xs cursor-pointer hover:text-amber-300">▸ Sorts sélectionnés ({data.sorts.length})</summary>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {data.sorts.sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom)).map(s => (
              <div key={s.nom} className="flex items-center justify-between bg-stone-800/50 rounded px-2 py-1 text-xs">
                <span className="text-stone-300">{s.nom} <span className="text-stone-600">(niv.{s.niveau})</span></span>
                <button onClick={() => update('sorts', data.sorts.filter(x => x.nom !== s.nom))} className={BTN_DEL}>✕</button>
              </div>
            ))}
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
    setData(d => ({ ...d, [key]: value }))
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
            {data.classe && <span className="text-stone-500 text-sm shrink-0">{data.classe} niv.{data.niveau}</span>}
          </div>
          <button onClick={handleSubmit} disabled={isPending || !data.nom.trim()} className="shrink-0 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {isPending ? 'Sauvegarde...' : personnageId ? 'Enregistrer' : 'Créer le personnage'}
          </button>
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

'use client'

import { useState, useTransition } from 'react'
import { preparerSorts, preparerSortsDivins } from '@/app/actions/character'
import { getSortsSlotsParJour } from '@/lib/dnd35/classes'

const ARCANE = ['Magicien', 'Ensorceleur', 'Barde']
const DIVIN  = ['Prêtre', 'Druide', 'Paladin', 'Rôdeur']

type Spell = { charSpellId: number; nom: string; niveau: number; ecole: string; estPrepare: number }
type AvailableSpell = { nom: string; ecole: string; niveau: number; estPersonnalise?: boolean }

type Props = {
  personnageId: number
  classe: string
  niveau: number
  spells: Spell[]
  availableSpells?: AvailableSpell[]  // liste complète pour les lanceurs divins
}

export function PreparerSorts({ personnageId, classe, niveau, spells, availableSpells }: Props) {
  const [open, setOpen] = useState(false)
  // Map<string, number> — clé = charSpellId.toString() pour arcane, spell.nom pour divin
  const [preps, setPreps] = useState<Map<string, number>>(new Map())
  const [isPending, startTransition] = useTransition()

  const isArcane = ARCANE.includes(classe)
  const isDivin  = DIVIN.includes(classe)
  if (!isArcane && !isDivin) return null

  const label = isDivin ? '🙏 Prier' : '📖 Étudier'
  const titre = isDivin ? `Prier — Préparer les sorts (${classe})` : `Étudier — Préparer les sorts (${classe})`
  const slots = getSortsSlotsParJour(classe, niveau)

  // Source de la liste affichée dans la modale
  const listSpells: AvailableSpell[] = isDivin && availableSpells
    ? availableSpells
    : spells.map(s => ({ nom: s.nom, ecole: s.ecole, niveau: s.niveau }))

  const niveaux = [...new Set(listSpells.map(s => s.niveau))].sort((a, b) => a - b)

  function getKey(s: AvailableSpell): string {
    if (isDivin) return s.nom
    const match = spells.find(sp => sp.nom === s.nom)
    return match ? match.charSpellId.toString() : s.nom
  }

  function openModal() {
    const m = new Map<string, number>()
    listSpells.forEach(s => m.set(getKey(s), 0))
    // Initialiser avec les valeurs déjà préparées
    spells.forEach(s => {
      const key = isDivin ? s.nom : s.charSpellId.toString()
      m.set(key, s.estPrepare)
    })
    setPreps(new Map(m))
    setOpen(true)
  }

  function getSlotMax(niv: number): number {
    if (classe === 'Paladin' || classe === 'Rôdeur') {
      return niv === 0 ? 0 : (slots[niv - 1] ?? 0)
    }
    return slots[niv] ?? 0
  }

  function usedAtLevel(niv: number): number {
    return listSpells
      .filter(s => s.niveau === niv)
      .reduce((sum, s) => sum + (preps.get(getKey(s)) ?? 0), 0)
  }

  function setPrep(s: AvailableSpell, niv: number, delta: number) {
    const key = getKey(s)
    const cur  = preps.get(key) ?? 0
    const used = usedAtLevel(niv)
    const max  = getSlotMax(niv)
    const next = cur + delta
    if (next < 0) return
    if (delta > 0 && used >= max) return
    setPreps(m => { const n = new Map(m); n.set(key, next); return n })
  }

  function clearAll() {
    setPreps(m => { const n = new Map(m); n.forEach((_, k) => n.set(k, 0)); return n })
  }

  function confirm() {
    startTransition(async () => {
      if (isDivin && availableSpells) {
        const preparations = availableSpells.map(s => ({
          nom: s.nom, ecole: s.ecole, niveau: s.niveau,
          estPrepare: preps.get(s.nom) ?? 0,
          estPersonnalise: s.estPersonnalise ?? false,
        }))
        await preparerSortsDivins(personnageId, preparations)
      } else {
        const preparations = spells.map(s => ({
          charSpellId: s.charSpellId,
          estPrepare: preps.get(s.charSpellId.toString()) ?? 0,
        }))
        await preparerSorts(personnageId, preparations)
      }
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 border border-stone-700 hover:border-amber-600/50 text-stone-400 hover:text-amber-300 px-2.5 py-1 rounded-lg transition-all"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-stone-900 border border-amber-900/50 rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">

            {/* En-tête */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
              <h3 className="text-amber-300 font-bold text-sm">{titre}</h3>
              <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-300 text-lg leading-none">✕</button>
            </div>

            {/* Résumé des emplacements */}
            <div className="px-5 pt-3 pb-2 flex flex-wrap gap-2">
              {niveaux.map(n => {
                const max  = getSlotMax(n)
                const used = usedAtLevel(n)
                if (max === 0) return null
                const full = used >= max
                return (
                  <span key={n} className={`text-xs px-2 py-0.5 rounded-full border ${full ? 'bg-amber-900/40 border-amber-700/60 text-amber-300' : 'bg-stone-800 border-stone-700 text-stone-400'}`}>
                    {n === 0 ? 'Oraisons' : `Niv.${n}`} {used}/{max}
                  </span>
                )
              })}
            </div>

            {/* Liste des sorts */}
            <div className="overflow-y-auto flex-1 px-5 py-2 space-y-4">
              {niveaux.map(n => {
                const max  = getSlotMax(n)
                const used = usedAtLevel(n)
                const spellsAtLevel = listSpells.filter(s => s.niveau === n)
                return (
                  <div key={n}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">
                        {n === 0 ? 'Oraisons (niv. 0)' : `Niveau ${n}`}
                      </span>
                      <span className={`text-xs ml-auto ${used >= max ? 'text-amber-400 font-semibold' : 'text-stone-600'}`}>
                        {used}/{max} emplacements
                      </span>
                    </div>
                    {max === 0 && (
                      <p className="text-stone-700 text-xs italic">Aucun emplacement à ce niveau.</p>
                    )}
                    <div className="space-y-1">
                      {spellsAtLevel.map(s => {
                        const key  = getKey(s)
                        const cur  = preps.get(key) ?? 0
                        const full = used >= max && cur === 0
                        return (
                          <div key={key} className="flex items-center gap-2 py-1 border-b border-stone-800/60 last:border-0">
                            <span className={`text-sm flex-1 ${cur > 0 ? 'text-amber-200' : 'text-stone-400'}`}>
                              {s.nom}
                              {s.estPersonnalise && <span className="text-amber-700 text-xs ml-1" title="Sort personnalisé">★</span>}
                            </span>
                            {s.ecole && <span className="text-stone-700 text-xs shrink-0">{s.ecole}</span>}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setPrep(s, n, -1)}
                                disabled={cur <= 0}
                                className="w-6 h-6 flex items-center justify-center rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 text-sm transition-colors"
                              >−</button>
                              <span className={`w-6 text-center text-sm font-mono ${cur > 0 ? 'text-amber-300 font-bold' : 'text-stone-600'}`}>{cur}</span>
                              <button
                                onClick={() => setPrep(s, n, 1)}
                                disabled={full || used >= max}
                                className="w-6 h-6 flex items-center justify-center rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 text-sm transition-colors"
                              >+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pied de page */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-stone-800">
              <button onClick={clearAll} className="text-xs text-stone-600 hover:text-stone-400 transition-colors">
                Tout effacer
              </button>
              <div className="flex-1" />
              <button onClick={() => setOpen(false)} className="text-xs text-stone-500 hover:text-stone-300 px-3 py-1.5 transition-colors">
                Annuler
              </button>
              <button
                onClick={confirm}
                disabled={isPending}
                className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {isPending ? 'Sauvegarde...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

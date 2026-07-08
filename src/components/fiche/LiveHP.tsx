'use client'

import { useState, useTransition } from 'react'
import { updatePvActuels } from '@/app/actions/character'

type Props = { personnageId: number; pvActuels: number; pvMax: number }

export function LiveHP({ personnageId, pvActuels, pvMax }: Props) {
  const [current, setCurrent] = useState(pvActuels)
  const [mode, setMode] = useState<'degats' | 'soins' | null>(null)
  const [amount, setAmount] = useState('')
  const [isPending, startTransition] = useTransition()

  const pct = pvMax > 0 ? Math.max(0, Math.round((current / pvMax) * 100)) : 0
  const barColor = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444'
  const textColor = current < 0 ? 'text-red-500' : pct > 50 ? 'text-green-400' : pct > 25 ? 'text-amber-400' : 'text-red-400'

  function apply() {
    const n = parseInt(amount, 10)
    if (!n || n < 0) return
    const delta = mode === 'degats' ? -n : n
    // Règle 3.5 : mourant de −1 à −9, mort à −10 (le plancher)
    const newVal = Math.min(pvMax, Math.max(-10, current + delta))
    setCurrent(newVal)
    setMode(null)
    setAmount('')
    startTransition(async () => { await updatePvActuels(personnageId, newVal) })
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') apply()
    if (e.key === 'Escape') { setMode(null); setAmount('') }
  }

  return (
    <div className="flex flex-col items-center bg-stone-800/60 rounded p-2 text-center min-w-[90px]">
      <span className="text-amber-500 text-xs uppercase tracking-wide mb-1">PV</span>

      {/* Valeur */}
      <div className="flex items-baseline gap-0.5 leading-none">
        <span className={`text-2xl font-bold font-mono ${textColor} ${isPending ? 'opacity-50' : ''}`}>{current}</span>
        <span className="text-stone-500 text-sm font-mono"> / {pvMax}</span>
      </div>

      {/* Barre de vie */}
      <div className="w-full mt-1.5 h-1.5 bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      {/* PV négatifs : mourant (−1 à −9) ou mort (−10) — perd 1 PV/round s'il n'est pas stabilisé */}
      {current < 0 && (
        <span className="text-[10px] font-semibold text-red-500 mt-0.5 uppercase tracking-wide">
          {current <= -10 ? '☠ mort' : '🩸 mourant'}
        </span>
      )}

      {/* Boutons Dégâts / Soins */}
      {mode === null ? (
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => { setMode('degats'); setAmount('') }}
            className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 rounded px-1.5 py-0.5 transition-colors"
            title="Recevoir des dégâts"
          >⚔ −</button>
          <button
            onClick={() => { setMode('soins'); setAmount('') }}
            className="text-xs bg-green-900/40 hover:bg-green-800/60 text-green-500 hover:text-green-300 rounded px-1.5 py-0.5 transition-colors"
            title="Recevoir des soins"
          >✚ +</button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-1">
          <div className={`text-xs font-medium ${mode === 'degats' ? 'text-red-400' : 'text-green-400'}`}>
            {mode === 'degats' ? '⚔ Dégâts' : '✚ Soins'}
          </div>
          <div className="flex gap-1">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
              className="w-16 sm:w-14 bg-stone-700 border border-stone-600 rounded px-1 py-0.5 text-stone-100 text-base sm:text-sm text-center focus:outline-none focus:border-amber-500"
              placeholder="0"
            />
            <button
              onClick={apply}
              disabled={!amount || parseInt(amount) <= 0}
              className="text-xs bg-amber-700 hover:bg-amber-600 disabled:opacity-30 text-white rounded px-1.5 py-0.5 transition-colors"
            >OK</button>
            <button
              onClick={() => { setMode(null); setAmount('') }}
              className="text-xs text-stone-500 hover:text-stone-300 px-1 transition-colors"
            >✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

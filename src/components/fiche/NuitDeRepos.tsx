'use client'

import { useState, useTransition } from 'react'
import { nuitDeRepos } from '@/app/actions/character'

type Props = { personnageId: number; estLanceur: boolean }

export function NuitDeRepos({ personnageId, estLanceur }: Props) {
  const [confirmation, setConfirmation] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reposer() {
    setConfirmation(false)
    startTransition(async () => {
      const res = await nuitDeRepos(personnageId)
      if (!res) return
      const rappelSorts = estLanceur ? ' Pensez à préparer vos sorts.' : ''
      if (res.statut === 'negatif') {
        setMessage('PV négatifs — aucune guérison naturelle. Il faut d’abord être stabilisé et soigné.')
      } else if (res.statut === 'complet') {
        setMessage(`Nuit reposante — PV déjà au maximum.${rappelSorts}`)
      } else {
        setMessage(`💤 ${res.gain} PV récupérés (${res.pvApres} PV).${rappelSorts}`)
      }
      setTimeout(() => setMessage(null), 8000)
    })
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      {confirmation ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-sky-300">Dormir 8 h ?</span>
          <button
            onClick={reposer}
            className="text-xs bg-sky-900/50 hover:bg-sky-800/60 text-sky-300 border border-sky-800/60 rounded px-1.5 py-0.5 transition-colors"
          >✓ Oui</button>
          <button
            onClick={() => setConfirmation(false)}
            className="text-xs text-stone-500 hover:text-stone-300 px-1 transition-colors"
          >✕</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmation(true)}
          disabled={isPending}
          className="text-xs bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 hover:text-sky-300 rounded px-2 py-1 transition-colors disabled:opacity-50 whitespace-nowrap"
          title="Nuit de repos (8 h) : récupère 1 PV par niveau — règle 3.5"
        >🌙 Nuit de repos</button>
      )}
      {message && (
        <span className="text-xs text-sky-300/90 leading-tight truncate sm:whitespace-normal">{message}</span>
      )}
    </div>
  )
}

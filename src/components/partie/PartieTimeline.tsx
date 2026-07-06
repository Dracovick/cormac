'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { EntreeJournalPartie } from '@/app/actions/journal'
import { heureQuebec, iconeEntree } from '@/lib/journal-format'

type Props = { entrees: EntreeJournalPartie[] }

// Couleurs des badges de personnage (attribuées par ordre d'apparition dans la journée)
const COULEURS = [
  'bg-amber-900/50 text-amber-300 border-amber-700/60',
  'bg-sky-900/50 text-sky-300 border-sky-700/60',
  'bg-emerald-900/50 text-emerald-300 border-emerald-700/60',
  'bg-purple-900/50 text-purple-300 border-purple-700/60',
  'bg-rose-900/50 text-rose-300 border-rose-700/60',
  'bg-teal-900/50 text-teal-300 border-teal-700/60',
  'bg-orange-900/50 text-orange-300 border-orange-700/60',
  'bg-indigo-900/50 text-indigo-300 border-indigo-700/60',
]

// Chronologie fusionnée de la table : les personnages actifs de la journée sont détectés
// automatiquement ; le MJ peut en masquer d'un clic sur leur pastille.
export function PartieTimeline({ entrees }: Props) {
  // Personnages actifs de la journée, dans l'ordre de leur première action
  const personnages = useMemo(() => {
    const vus = new Map<number, { id: number; nom: string; nb: number }>()
    for (const e of entrees) {
      if (e.personnageId == null) continue
      const p = vus.get(e.personnageId)
      if (p) p.nb++
      else vus.set(e.personnageId, { id: e.personnageId, nom: e.nomPersonnage ?? `#${e.personnageId}`, nb: 1 })
    }
    return [...vus.values()]
  }, [entrees])

  const [masques, setMasques] = useState<Set<number>>(new Set())

  function basculer(id: number) {
    setMasques(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  const couleurDe = (id: number) => COULEURS[personnages.findIndex(p => p.id === id) % COULEURS.length]

  const visibles = entrees.filter(e => e.personnageId == null || !masques.has(e.personnageId))

  if (entrees.length === 0) {
    return (
      <div className="bg-stone-900/70 border border-stone-800 rounded-lg p-8 text-center">
        <div className="text-stone-500">Aucune action ce jour-là.</div>
        <div className="text-stone-600 text-xs mt-2">
          Les journées où vos joueurs ont utilisé leur fiche apparaîtront ici.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Pastilles des personnages actifs (cliquer pour masquer/afficher) */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-stone-600 text-xs uppercase tracking-wide">À la table :</span>
        {personnages.map(p => (
          <button
            key={p.id}
            onClick={() => basculer(p.id)}
            className={`text-xs border rounded-full px-2.5 py-0.5 transition-all ${
              masques.has(p.id)
                ? 'bg-stone-900 text-stone-600 border-stone-700 line-through'
                : couleurDe(p.id)
            }`}
            title={masques.has(p.id) ? 'Cliquer pour réafficher' : 'Cliquer pour masquer'}
          >
            {p.nom} <span className="opacity-60">({p.nb})</span>
          </button>
        ))}
      </div>

      {/* Chronologie */}
      <div className="bg-stone-900/70 border border-stone-800 rounded-lg px-4 py-3 space-y-1">
        {visibles.map(e => {
          if (e.type === 'round') {
            return (
              <div key={e.id} className="flex items-center gap-2 py-1.5">
                <div className="flex-1 h-px bg-amber-900/60" />
                <span className="text-amber-500 text-xs font-semibold uppercase tracking-wide">{e.description}</span>
                <div className="flex-1 h-px bg-amber-900/60" />
              </div>
            )
          }
          const { icone, couleur } = iconeEntree(e.type, e.valeur)
          return (
            <div key={e.id} className="flex items-start gap-2 text-sm rounded px-1 py-0.5 hover:bg-stone-800/60">
              <span className="text-stone-600 text-xs font-mono mt-0.5 shrink-0 w-10">{heureQuebec(new Date(e.createdAt))}</span>
              {e.personnageId != null && (
                <Link
                  href={`/personnage/${e.personnageId}`}
                  className={`text-xs border rounded-full px-2 shrink-0 mt-px hover:brightness-125 transition-all ${couleurDe(e.personnageId)}`}
                >
                  {e.nomPersonnage}
                </Link>
              )}
              <span className={`shrink-0 ${couleur}`}>{icone}</span>
              <span className="text-stone-300 flex-1 leading-snug">{e.description}</span>
            </div>
          )
        })}
        {visibles.length === 0 && (
          <div className="text-stone-600 text-sm italic py-2 text-center">Tous les personnages sont masqués.</div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { getJournal, marquerRound, supprimerEntreeJournal, type EntreeJournal } from '@/app/actions/journal'
import { journeeLudique, journeeLudiqueCourante, dateLisible, heureQuebec, iconeEntree } from '@/lib/journal-format'

type Props = { personnageId: number; nomPersonnage: string }

// Tiroir « 📜 Journal » de la fiche : chronologie des actions de jeu du personnage
// (écrites automatiquement par les boutons de la fiche) + marqueurs de round globaux.
export function JournalDrawer({ personnageId, nomPersonnage }: Props) {
  const [open, setOpen] = useState(false)
  const [entrees, setEntrees] = useState<EntreeJournal[] | null>(null)
  const [isPending, startTransition] = useTransition()

  function charger() {
    startTransition(async () => {
      setEntrees(await getJournal(personnageId))
    })
  }

  function ouvrir() {
    setOpen(true)
    charger()
  }

  function round(action: 'debut' | 'suivant' | 'fin') {
    startTransition(async () => {
      await marquerRound(action)
      setEntrees(await getJournal(personnageId))
    })
  }

  function supprimer(id: number) {
    setEntrees(prev => prev?.filter(e => e.id !== id) ?? null)
    startTransition(async () => {
      await supprimerEntreeJournal(id, personnageId)
    })
  }

  // Groupement par journée ludique, en antichronologique : la dernière action en haut,
  // pas besoin de scroller pendant la partie. Un marqueur de round fait alors office de
  // « plancher » : tout ce qui est au-dessus appartient à ce round.
  const jours: { jour: string; items: EntreeJournal[] }[] = []
  for (const e of entrees ?? []) {
    const jour = journeeLudique(new Date(e.createdAt))
    let bloc = jours.find(j => j.jour === jour)
    if (!bloc) {
      bloc = { jour, items: [] }
      jours.push(bloc)
    }
    bloc.items.push(e)
  }

  return (
    <>
      <button
        onClick={ouvrir}
        className="text-xs rounded px-2 py-1 border bg-stone-800/80 hover:bg-stone-700 border-stone-600 hover:border-amber-700 text-stone-300 hover:text-amber-300 transition-all cursor-pointer"
        title="Journal de partie — les actions de la fiche s'y inscrivent automatiquement"
      >
        📜 Journal
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Fond assombri */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          {/* Tiroir */}
          <div className="absolute inset-y-0 right-0 w-full sm:w-[26rem] bg-stone-900 border-l border-stone-700 shadow-2xl flex flex-col">
            {/* En-tête */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700 shrink-0">
              <div>
                <div className="text-amber-400 font-semibold">📜 Journal de partie</div>
                <div className="text-stone-500 text-xs">{nomPersonnage}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={charger}
                  disabled={isPending}
                  className="text-stone-500 hover:text-amber-400 transition-colors text-sm"
                  title="Rafraîchir"
                >↻</button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-stone-400 hover:text-white transition-colors text-lg leading-none px-1"
                  title="Fermer"
                >✕</button>
              </div>
            </div>

            {/* Marqueurs de combat (globaux, partagés par toute la table) */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-800 shrink-0">
              <span className="text-stone-600 text-xs uppercase tracking-wide">Combat :</span>
              <button
                onClick={() => round('debut')}
                disabled={isPending}
                className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 rounded px-2 py-0.5 transition-colors"
                title="Marque le début d'un combat (round 1) — visible sur toutes les fiches"
              >⚔ Combat !</button>
              <button
                onClick={() => round('suivant')}
                disabled={isPending}
                className="text-xs bg-amber-900/40 hover:bg-amber-800/60 text-amber-400 hover:text-amber-300 rounded px-2 py-0.5 transition-colors"
                title="Passe au round suivant"
              >▶ Round suivant</button>
              <button
                onClick={() => round('fin')}
                disabled={isPending}
                className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded px-2 py-0.5 transition-colors"
                title="Marque la fin du combat"
              >🕊 Fin</button>
            </div>

            {/* Chronologie */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {entrees === null ? (
                <div className="text-stone-500 text-sm italic mt-4 text-center">Chargement…</div>
              ) : jours.length === 0 ? (
                <div className="text-stone-500 text-sm mt-6 text-center leading-relaxed">
                  Le journal est vide.<br />
                  <span className="text-stone-600 text-xs">
                    Les actions de la fiche (PV, sorts, potions, attaques…)<br />s&apos;inscriront ici automatiquement.
                  </span>
                </div>
              ) : (
                jours.map(({ jour, items }) => (
                  <div key={jour} className="mb-5">
                    <div className="text-amber-600 text-xs uppercase tracking-wider font-semibold mb-2 sticky top-0 bg-stone-900 py-1">
                      {jour === journeeLudiqueCourante() ? `Aujourd'hui — ${dateLisible(jour)}` : dateLisible(jour)}
                    </div>
                    <div className="space-y-1">
                      {items.map(e => {
                        if (e.type === 'round') {
                          return (
                            <div key={e.id} className="flex items-center gap-2 py-1 group">
                              <div className="flex-1 h-px bg-amber-900/60" />
                              <span className="text-amber-500 text-xs font-semibold uppercase tracking-wide">{e.description}</span>
                              <div className="flex-1 h-px bg-amber-900/60" />
                              <button
                                onClick={() => supprimer(e.id)}
                                className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 text-xs transition-all"
                                title="Effacer ce marqueur"
                              >✕</button>
                            </div>
                          )
                        }
                        const { icone, couleur } = iconeEntree(e.type, e.valeur)
                        const estNoteMJ = e.type === 'note' && e.personnageId == null
                        return (
                          <div key={e.id} className={`flex items-start gap-2 text-sm group rounded px-1 py-0.5 hover:bg-stone-800/60 ${estNoteMJ ? 'bg-amber-950/30 border-l-2 border-amber-700/60' : ''}`}>
                            <span className="text-stone-600 text-xs font-mono mt-0.5 shrink-0">{heureQuebec(new Date(e.createdAt))}</span>
                            <span className={`shrink-0 ${couleur}`}>{icone}</span>
                            <span className={`flex-1 leading-snug whitespace-pre-wrap ${estNoteMJ ? 'text-amber-100/90 italic' : 'text-stone-300'}`}>{e.description}</span>
                            <button
                              onClick={() => supprimer(e.id)}
                              className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 text-xs transition-all shrink-0 mt-0.5"
                              title="Effacer cette entrée (n'annule pas l'action)"
                            >✕</button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pied */}
            <div className="px-4 py-2.5 border-t border-stone-700 shrink-0 flex items-center justify-between">
              <span className="text-stone-600 text-xs">Écrit automatiquement par la fiche</span>
              <Link
                href="/partie"
                className="text-xs text-amber-500 hover:text-amber-300 transition-colors"
                title="Journal fusionné de tous les personnages (vue du MJ)"
              >
                Vue de table (MJ) →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

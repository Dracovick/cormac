'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { distribuerXp } from '@/app/actions/journal'
import { xpPourNiveau } from '@/lib/dnd35/rules'

// Ajout d'XP depuis la fiche du joueur : quand le MJ annonce la récompense à voix
// haute, chacun l'inscrit lui-même. Passe par distribuerXp — même journalisation
// et même détection de seuil de niveau que la distribution de la vue du MJ.
export function AjouterXp({ personnageId, xp, niveauTotal }: { personnageId: number; xp: number; niveauTotal: number }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [montantStr, setMontantStr] = useState('')
  const [isPending, startTransition] = useTransition()

  const montant = parseInt(montantStr, 10)
  const valide = Number.isInteger(montant) && montant > 0 && montant <= 1_000_000
  const apres = valide ? xp + montant : null

  // Aperçu du 🎉 : plus haut seuil que cet ajout fait franchir (niveaux épiques
  // compris — la boucle s'arrête au premier seuil hors d'atteinte)
  let franchi: number | null = null
  if (apres != null) {
    for (let n = Math.max(niveauTotal + 1, 2); xpPourNiveau(n) <= apres; n++) {
      const seuil = xpPourNiveau(n)
      if (xp < seuil) franchi = n
    }
  }

  function confirmer() {
    if (!valide) return
    startTransition(async () => {
      await distribuerXp([{ personnageId, montant }])
      setOuvert(false)
      setMontantStr('')
      router.refresh()
    })
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="mt-2 text-xs bg-yellow-900/30 hover:bg-yellow-800/50 text-yellow-400 hover:text-yellow-300 rounded px-2 py-1 min-h-[28px] transition-colors"
        title="Ajouter les points d'expérience reçus — l'ajout s'inscrit au journal"
      >⭐ Ajouter de l&apos;XP</button>
    )
  }

  return (
    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
      <input
        type="number"
        min={1}
        inputMode="numeric"
        value={montantStr}
        onChange={e => setMontantStr(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') confirmer() }}
        placeholder="ex. 450"
        autoFocus
        className="w-24 bg-stone-950 border border-stone-700 rounded px-2 py-1 text-yellow-200 text-base sm:text-sm text-right font-mono placeholder:text-stone-600 focus:outline-none focus:border-yellow-600"
      />
      <button
        onClick={confirmer}
        disabled={isPending || !valide}
        className="text-xs bg-yellow-900/40 hover:bg-yellow-800/60 disabled:opacity-40 border border-yellow-800/50 text-yellow-300 rounded px-2.5 py-1 min-h-[28px] transition-colors"
      >{isPending ? 'Ajout…' : '⭐ Ajouter'}</button>
      <button
        onClick={() => { setOuvert(false); setMontantStr('') }}
        className="text-stone-500 hover:text-stone-300 text-sm px-1.5 min-h-[28px] transition-colors"
        title="Fermer sans ajouter"
      >✕</button>
      {apres != null && (
        <div className="w-full text-right text-xs text-stone-500 font-mono">
          {xp.toLocaleString('fr-FR')} → <span className="text-stone-300">{apres.toLocaleString('fr-FR')}</span>
          {franchi && (
            <span className="text-yellow-300 font-sans" title={`Le total franchit le seuil du niveau ${franchi} (${xpPourNiveau(franchi).toLocaleString('fr-FR')} XP)`}>
              {' '}🎉 niv. {franchi} !
            </span>
          )}
        </div>
      )}
    </div>
  )
}

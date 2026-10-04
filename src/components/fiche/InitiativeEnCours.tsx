'use client'

import { useEffect, useState } from 'react'
import { getCombatActif, type CombatActif } from '@/app/actions/combat'

// Bandeau d'initiative du joueur : quand le MJ mène un combat sur /partie et que
// ce personnage y participe, l'ordre du tour s'affiche ici en lecture seule.
// Interroge le serveur toutes les 7 s (onglet visible seulement) — rien sinon.
export function InitiativeEnCours({ personnageId }: { personnageId: number }) {
  const [combat, setCombat] = useState<CombatActif | null>(null)

  useEffect(() => {
    let vivant = true
    async function verifier() {
      if (document.visibilityState !== 'visible') return
      try {
        const c = await getCombatActif()
        if (vivant) setCombat(c)
      } catch {
        // hors ligne ou erreur passagère : on garde l'état précédent
      }
    }
    verifier()
    const t = setInterval(verifier, 7_000)
    return () => { vivant = false; clearInterval(t) }
  }, [personnageId])

  if (!combat) return null
  const n = combat.combattants.length
  const pos = combat.combattants.findIndex(c => c.personnageId === personnageId)
  if (pos < 0 || n === 0) return null

  const courant = combat.combattants[combat.tourIndex]
  const monTour = pos === combat.tourIndex
  const dans = (pos - combat.tourIndex + n) % n

  return (
    <div
      className={`sticky top-0 z-50 border-b px-4 py-2 text-sm flex flex-wrap items-center gap-x-3 gap-y-1 ${
        monTour
          ? 'bg-amber-950/95 border-amber-600/70 text-amber-200'
          : 'bg-stone-900/95 border-red-900/50 text-stone-300'
      }`}
    >
      <span className="text-red-400 font-semibold shrink-0">⚔ Round {combat.round}</span>
      {monTour ? (
        <span className="font-bold text-amber-300">🎲 C&apos;est ton tour !</span>
      ) : (
        <>
          <span>▶ au tour de <strong className="text-amber-300">{courant?.nom}</strong></span>
          <span className="text-stone-500">
            — ton tour {dans === 1 ? 'juste après' : `dans ${dans} tours`}
          </span>
        </>
      )}
    </div>
  )
}

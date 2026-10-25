'use client'

import { useState } from 'react'

/**
 * Deux actions distinctes, qui n'étaient qu'une.
 *
 * « Sauvegarder en PDF » appelait `window.print()` : la boîte de dialogue
 * s'ouvrait et il fallait encore choisir la destination « Enregistrer au format
 * PDF ». Le bouton annonçait un fichier et livrait un dialogue. Il télécharge
 * maintenant un vrai PDF, rendu par `/api/pdf` depuis cette même page — donc
 * identique à ce que l'imprimante sortirait.
 *
 * « Imprimer » reste là pour qui veut du papier tout de suite, sans passer par
 * un fichier intermédiaire.
 *
 * ⚠ `type="button"` sur les deux : sur la fiche vierge, ces boutons vivent à
 * l'intérieur du `<form method="get">` des réglages, où un bouton sans type
 * vaut `submit` et rechargerait la page.
 */
export function PrintButton({ nomFichier }: { nomFichier?: string }) {
  const [etat, setEtat] = useState<'repos' | 'travail' | 'erreur'>('repos')
  const [erreur, setErreur] = useState<string | null>(null)

  async function sauvegarder() {
    setEtat('travail')
    setErreur(null)
    try {
      // Les réglages de la fiche vierge voyagent dans l'adresse (formulaire GET) :
      // reprendre `pathname + search` tel quel garantit que le PDF porte
      // exactement ce qui est affiché à l'écran, pas l'état des menus non appliqués.
      const cible = window.location.pathname + window.location.search
      const url =
        `/api/pdf?cible=${encodeURIComponent(cible)}` +
        (nomFichier ? `&nom=${encodeURIComponent(nomFichier)}` : '')

      const reponse = await fetch(url)
      if (!reponse.ok) throw new Error((await reponse.text()) || `Erreur ${reponse.status}`)

      const blob = await reponse.blob()
      // Le serveur a déjà assaini le nom; on le relit dans l'en-tête plutôt que
      // d'en fabriquer un second qui pourrait en différer.
      const entete = reponse.headers.get('Content-Disposition') ?? ''
      const trouve = /filename="([^"]+)"/.exec(entete)
      const lien = document.createElement('a')
      lien.href = URL.createObjectURL(blob)
      lien.download = trouve?.[1] ?? 'fiche.pdf'
      document.body.appendChild(lien)
      lien.click()
      lien.remove()
      // Libérer l'objet tout de suite annulerait le téléchargement sur certains
      // navigateurs : on laisse le temps au clic de partir.
      setTimeout(() => URL.revokeObjectURL(lien.href), 60_000)
      setEtat('repos')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : String(err))
      setEtat('erreur')
    }
  }

  return (
    // `flexShrink: 0` : ces deux boutons vivent dans une barre `display:flex`.
    // Sans ça, la barre les comprime et chacun se coupe en deux lignes alors
    // qu'il reste de la place à côté — relevé sur la page d'impression d'une
    // fiche, où « Retour à la fiche » se brisait aussi.
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
      <button
        type="button"
        onClick={sauvegarder}
        disabled={etat === 'travail'}
        className="inline-flex items-center gap-1.5 bg-amber-900 hover:bg-amber-800 disabled:opacity-60 disabled:cursor-wait border border-amber-700 text-amber-100 text-sm px-3 py-2 rounded-lg transition-colors"
      >
        {etat === 'travail' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" />
          </svg>
        )}
        {etat === 'travail' ? 'Génération du PDF…' : 'Sauvegarder en PDF'}
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 bg-stone-700 hover:bg-stone-600 border border-stone-600 text-stone-200 text-sm px-3 py-2 rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
        </svg>
        Imprimer
      </button>

      {etat === 'erreur' && (
        <span style={{ color: '#fca5a5', fontSize: '12px', maxWidth: '320px' }}>
          Le PDF n&apos;a pas pu être produit — utilise « Imprimer ». ({erreur})
        </span>
      )}
    </span>
  )
}

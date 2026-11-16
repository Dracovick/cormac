'use client'

import { useState, useTransition } from 'react'
import { login } from '@/app/actions/auth'

/**
 * Le formulaire de connexion. Séparé de la page pour une seule raison :
 * la page doit lire `?suite=` côté SERVEUR.
 *
 * ⛔ Pas `useSearchParams()` ici : dans l'App Router, un composant client qui
 * le lit force la route sous `<Suspense>` et se fait prérendre sans paramètre.
 * La destination arrive donc en prop, lue par la page serveur.
 */
export function FormulaireConnexion({ suite }: { suite: string | null }) {
  const [error, setError] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const pw = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value
    setError(false)
    startTransition(async () => {
      // `login` termine par un `redirect()` vers la destination : en cas de
      // succès cette promesse ne rend donc rien ici, la navigation a lieu.
      const ok = await login(pw, suite)
      if (!ok) setError(true)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-stone-900/80 backdrop-blur border border-amber-900/40 rounded-xl p-8 shadow-2xl"
    >
      <label className="block text-stone-400 text-xs uppercase tracking-widest mb-2">
        Mot de passe
      </label>
      <input
        name="password"
        type="password"
        autoFocus
        required
        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-stone-100 text-base sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
        placeholder="···········"
      />

      {error && (
        <p className="mt-3 text-red-400 text-sm text-center">
          Mot de passe incorrect.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {isPending ? 'Vérification...' : 'Entrer'}
      </button>
    </form>
  )
}

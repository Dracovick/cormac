'use client'

import { useState, useTransition } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const pw = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value
    setError(false)
    startTransition(async () => {
      const ok = await login(pw)
      if (!ok) setError(true)
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#080608' }}
    >
      {/* Lueur ambiante */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(120,20,20,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="text-amber-600 text-5xl mb-4">⚔️</div>
          <h1 className="text-3xl font-bold text-amber-300 tracking-wide">Grimoire D&D</h1>
          <p className="text-stone-500 text-sm mt-2">3e édition · Accès restreint</p>
        </div>

        {/* Formulaire */}
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

        <p className="text-center text-stone-700 text-xs mt-6">
          Donjons &amp; Dragons 3e édition
        </p>
      </div>
    </div>
  )
}

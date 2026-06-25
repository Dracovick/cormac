import Link from 'next/link'
import { listCharacters } from '@/lib/queries/character'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const characters = await listCharacters()

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-amber-300 text-center mb-2">Grimoire D&D 3e édition</h1>
        <p className="text-stone-500 text-center mb-10 text-sm">D&D 3e édition (3.5) — Fiches de personnages</p>

        <div className="space-y-3">
          {characters.map((c) => (
            <Link
              key={c.id}
              href={`/personnage/${c.id}`}
              className="flex items-center justify-between bg-stone-900 border border-amber-900/40 rounded-lg p-5 hover:border-amber-500/60 hover:bg-stone-800 transition-all group"
            >
              <div>
                <div className="text-white text-xl font-bold group-hover:text-amber-300 transition-colors">{c.nom}</div>
                {c.surnom && <div className="text-stone-500 text-sm italic">{c.surnom}</div>}
                <div className="text-stone-400 text-sm mt-1">{c.race ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-semibold">{c.xp?.toLocaleString('fr-FR')} XP</div>
                <div className="text-amber-600 text-2xl group-hover:translate-x-1 transition-transform">→</div>
              </div>
            </Link>
          ))}
        </div>

        {characters.length === 0 && (
          <div className="text-center text-stone-600 py-12">
            <p className="text-lg">Aucun personnage trouvé.</p>
            <p className="text-sm mt-2">Lance le script de seed pour créer Cormac.</p>
          </div>
        )}
      </div>
    </div>
  )
}

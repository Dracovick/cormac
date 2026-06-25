import Link from 'next/link'
import { listCharacters } from '@/lib/queries/character'

export const dynamic = 'force-dynamic'

const DRAGON_IMG = 'https://img.magnific.com/premium-psd/majestic-red-dragon-perched-rock_1286917-2479.jpg?semt=ais_hybrid&w=740&q=80'

export default async function Home() {
  const characters = await listCharacters()

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: '#080608' }}>

      {/* Dragon gauche — original */}
      <div className="absolute left-0 bottom-0 w-[48%] h-[90vh] pointer-events-none select-none overflow-hidden">
        <img
          src={DRAGON_IMG}
          alt=""
          className="absolute bottom-0 left-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.85 }}
        />
        {/* Fondu bord intérieur (droite) */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, transparent 30%, #080608 90%)' }}
        />
        {/* Fondu haut */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, #080608 0%, transparent 25%)' }}
        />
      </div>

      {/* Dragon droit — miroir */}
      <div className="absolute right-0 bottom-0 w-[48%] h-[90vh] pointer-events-none select-none overflow-hidden">
        <img
          src={DRAGON_IMG}
          alt=""
          className="absolute bottom-0 right-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.85, transform: 'scaleX(-1)' }}
        />
        {/* Fondu bord intérieur (gauche) */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to left, transparent 30%, #080608 90%)' }}
        />
        {/* Fondu haut */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, #080608 0%, transparent 25%)' }}
        />
      </div>

      {/* Lueur rouge ambiante derrière chaque dragon */}
      <div
        className="absolute left-0 top-1/3 w-[40%] h-[60%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at left center, rgba(185,28,28,0.25) 0%, transparent 70%)' }}
      />
      <div
        className="absolute right-0 top-1/3 w-[40%] h-[60%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at right center, rgba(185,28,28,0.25) 0%, transparent 70%)' }}
      />

      {/* Contenu */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-amber-300 mb-2 tracking-wide">
              Grimoire D&D 3e édition
            </h1>
            <p className="text-stone-500 text-sm">Donjons & Dragons — Fiches de personnages</p>
            <div className="mt-5 h-px bg-gradient-to-r from-transparent via-amber-800/60 to-transparent" />
          </div>

          <div className="space-y-3">
            {characters.map((c) => (
              <Link
                key={c.id}
                href={`/personnage/${c.id}`}
                className="flex items-center justify-between bg-stone-900/80 backdrop-blur border border-amber-900/40 rounded-lg p-5 hover:border-amber-500/60 hover:bg-stone-800/80 transition-all group"
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
            </div>
          )}

          <Link
            href="/personnage/nouveau"
            className="mt-4 flex items-center justify-center gap-3 w-full bg-amber-900/30 hover:bg-amber-800/50 border border-amber-700/50 hover:border-amber-500 rounded-lg p-5 transition-all group"
          >
            <span className="text-amber-500 text-3xl group-hover:scale-110 transition-transform">⚔️</span>
            <span className="text-amber-300 font-semibold text-lg">Créer un nouveau personnage</span>
            <span className="text-amber-600 text-xl ml-auto group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

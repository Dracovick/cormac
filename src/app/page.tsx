import Link from 'next/link'
import { listCharacters } from '@/lib/queries/character'

export const dynamic = 'force-dynamic'

function DragonSilhouette() {
  return (
    <svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Corps */}
      <ellipse cx="160" cy="298" rx="82" ry="56" transform="rotate(-8 160 298)" fill="currentColor" />
      {/* Cou */}
      <path fill="currentColor" d="M 200,252 Q 230,204 257,162 Q 272,136 282,110 L 264,88 Q 247,118 230,148 Q 202,192 174,242 Z" />
      {/* Tête */}
      <path fill="currentColor" d="M 264,88 Q 278,68 298,58 Q 318,50 334,54 Q 348,60 350,72 Q 350,85 337,93 Q 323,101 308,103 Q 293,105 278,98 Q 267,92 264,88 Z" />
      {/* Corne */}
      <polygon fill="currentColor" points="303,50 313,28 321,52" />
      {/* Gueule ouverte */}
      <path fill="currentColor" d="M 308,103 Q 338,109 351,122 Q 343,136 326,131 Q 310,127 300,116 Z" />
      {/* Aile gauche */}
      <path fill="currentColor" d="M 145,252 Q 104,220 60,185 Q 20,154 -16,118 Q 4,148 28,172 Q 58,200 92,220 Q 120,234 138,246 Z" />
      {/* Aile droite */}
      <path fill="currentColor" d="M 210,246 Q 252,208 296,168 Q 344,128 396,98 Q 378,130 352,158 Q 318,188 280,210 Q 250,224 220,238 Z" />
      {/* Queue */}
      <path fill="currentColor" d="M 86,344 Q 60,360 46,390 Q 34,414 41,434 Q 52,446 64,436 Q 70,420 76,400 Q 86,374 98,354 Z" />
      {/* Patte avant droite */}
      <path fill="currentColor" d="M 182,346 L 198,350 L 208,404 L 220,408 L 218,392 L 206,388 L 200,348 L 184,344 Z" />
      {/* Griffes droite */}
      <path fill="currentColor" d="M 208,404 Q 215,418 207,424 L 203,416 Z" />
      <path fill="currentColor" d="M 218,404 Q 227,418 219,424 L 215,416 Z" />
      <path fill="currentColor" d="M 226,402 Q 235,414 229,420 L 223,412 Z" />
      {/* Patte avant gauche */}
      <path fill="currentColor" d="M 148,352 L 132,350 L 120,404 L 108,408 L 112,392 L 122,388 L 128,350 L 144,346 Z" />
      {/* Griffes gauche */}
      <path fill="currentColor" d="M 120,404 Q 112,418 120,424 L 124,416 Z" />
      <path fill="currentColor" d="M 110,404 Q 102,416 110,422 L 114,414 Z" />
      {/* Patte arrière droite */}
      <path fill="currentColor" d="M 168,350 L 184,350 L 190,398 L 202,402 L 200,386 L 188,382 L 184,348 L 166,348 Z" />
      {/* Patte arrière gauche */}
      <path fill="currentColor" d="M 140,350 L 124,348 L 112,396 L 100,400 L 104,384 L 114,380 L 120,346 L 138,348 Z" />
    </svg>
  )
}

export default async function Home() {
  const characters = await listCharacters()

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950">
      {/* Dégradé de fond */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #1c0800, #0c0a0e, #000000)' }}
      />

      {/* Lueur ambiante dorée (gauche) */}
      <div
        className="absolute top-1/4 left-0 w-1/3 h-2/3 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at left center, rgba(217,119,6,0.22) 0%, transparent 70%)' }}
      />
      {/* Lueur ambiante rouge (droite) */}
      <div
        className="absolute top-1/4 right-0 w-1/3 h-2/3 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at right center, rgba(185,28,28,0.22) 0%, transparent 70%)' }}
      />

      {/* Dragon or — gauche */}
      <div
        className="absolute left-0 bottom-0 w-[45vw] h-[85vh] pointer-events-none select-none"
        style={{
          color: '#d97706',
          opacity: 0.30,
          filter: 'drop-shadow(0 0 28px rgba(217,119,6,0.6))',
        }}
      >
        <DragonSilhouette />
      </div>

      {/* Dragon rouge — droite (miroir horizontal) */}
      <div
        className="absolute right-0 bottom-0 w-[45vw] h-[85vh] pointer-events-none select-none"
        style={{
          color: '#b91c1c',
          opacity: 0.30,
          filter: 'drop-shadow(0 0 28px rgba(185,28,28,0.6))',
          transform: 'scaleX(-1)',
        }}
      >
        <DragonSilhouette />
      </div>

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
        </div>
      </div>
    </div>
  )
}

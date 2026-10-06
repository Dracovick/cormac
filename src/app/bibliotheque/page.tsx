import Link from 'next/link'
import { getBibliothequeIndex } from '@/lib/queries/bibliotheque'
import { BibliothequeClient } from '@/components/bibliotheque/BibliothequeClient'

export const dynamic = 'force-dynamic'

export default async function Bibliotheque() {
  const index = await getBibliothequeIndex()

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 -mx-3 min-h-[44px] rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            ← Grimoire D&D 3e édition
          </Link>
          <h1 className="text-3xl font-bold text-amber-300 mt-4">📚 La Grande Bibliothèque</h1>
          <p className="text-stone-500 text-sm mt-1">
            Sorts, potions, objets magiques, armes, armures et dons — tout le savoir du Grimoire, en consultation libre.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <BibliothequeClient index={index} />
      </main>
    </div>
  )
}

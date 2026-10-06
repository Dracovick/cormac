import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFicheBibliotheque, type FicheBibliotheque, type RayonSlug } from '@/lib/queries/bibliotheque'

export const dynamic = 'force-dynamic'

const SLUGS: RayonSlug[] = ['sort', 'potion', 'objet', 'arme', 'armure', 'don']

const EN_TETE: Record<RayonSlug, { icone: string; rayon: string }> = {
  sort: { icone: '✨', rayon: 'Sorts' },
  potion: { icone: '🧪', rayon: 'Potions' },
  objet: { icone: '💍', rayon: 'Objets magiques' },
  arme: { icone: '⚔️', rayon: 'Armes' },
  armure: { icone: '🛡️', rayon: 'Armures' },
  don: { icone: '🎯', rayon: 'Dons' },
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="shrink-0 font-semibold text-stone-400 w-44">{label}</span>
      <span className="text-stone-200">{children}</span>
    </div>
  )
}

function Description({ texte }: { texte: string | null }) {
  if (!texte || texte.trim().length === 0) {
    return (
      <p className="text-stone-600 text-sm italic mt-4">
        La description de cette entrée n'a pas encore été relevée dans les livres — le moine copiste y viendra.
      </p>
    )
  }
  return <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line mt-4">{texte}</p>
}

function nomDe(fiche: FicheBibliotheque): string {
  switch (fiche.categorie) {
    case 'sort': return fiche.sort.nom
    case 'potion': return fiche.potion.nom
    case 'objet': return fiche.objet.nom
    case 'arme': return fiche.arme.nom
    case 'armure': return fiche.armure.nom
    case 'don': return fiche.don.nom
  }
}

function formatPoids(poids: string | null): string | null {
  if (poids === null) return null
  const n = Number(poids)
  if (!Number.isFinite(n) || n <= 0) return null
  return `${n % 1 === 0 ? n : n} kg`
}

function Contenu({ fiche }: { fiche: FicheBibliotheque }) {
  switch (fiche.categorie) {
    case 'sort':
      return (
        <>
          <div className="space-y-2">
            {fiche.sort.ecole && <Row label="École">{fiche.sort.ecole}</Row>}
            {fiche.niveaux && <Row label="Niveau">{fiche.niveaux}</Row>}
            {fiche.sort.composantes && <Row label="Composantes">{fiche.sort.composantes}</Row>}
            {fiche.sort.portee && <Row label="Portée">{fiche.sort.portee}</Row>}
            {fiche.sort.duree && <Row label="Durée">{fiche.sort.duree}</Row>}
            {fiche.sort.zoneEffet && <Row label="Zone d'effet / cible">{fiche.sort.zoneEffet}</Row>}
            {fiche.sort.jetDeSauvegarde && <Row label="Jet de sauvegarde">{fiche.sort.jetDeSauvegarde}</Row>}
            {fiche.sort.resistanceMagique && <Row label="Résistance à la magie">{fiche.sort.resistanceMagique}</Row>}
          </div>
          <Description texte={fiche.sort.description} />
          {fiche.potionsLiees.length > 0 && (
            <div className="mt-5 pt-4 border-t border-stone-800">
              <p className="text-stone-500 text-xs mb-2">En fiole dans la Bibliothèque :</p>
              {fiche.potionsLiees.map(p => (
                <Link key={p.id} href={`/bibliotheque/potion/${p.id}`} className="block text-amber-300 hover:text-amber-200 text-sm py-0.5">
                  🧪 {p.nom}
                </Link>
              ))}
            </div>
          )}
        </>
      )
    case 'potion':
      return (
        <>
          <div className="space-y-2">
            {fiche.potion.sortEffet && <Row label="Effet">{fiche.potion.sortEffet}</Row>}
            {fiche.potion.niveau !== null && <Row label="Niveau du sort">{fiche.potion.niveau}</Row>}
            {fiche.potion.chargesMax !== null && <Row label="Gorgées par fiole">{fiche.potion.chargesMax}</Row>}
          </div>
          <Description texte={fiche.potion.description} />
          {fiche.sortLie && (
            <div className="mt-5 pt-4 border-t border-stone-800">
              <p className="text-stone-500 text-xs mb-2">Le sort derrière la fiole :</p>
              <Link href={`/bibliotheque/sort/${fiche.sortLie.id}`} className="block text-amber-300 hover:text-amber-200 text-sm py-0.5">
                ✨ {fiche.sortLie.nom}
              </Link>
            </div>
          )}
        </>
      )
    case 'objet':
      return (
        <>
          <div className="space-y-2">
            {fiche.objet.type && <Row label="Type">{fiche.objet.type}</Row>}
            {fiche.objet.emplacement && <Row label="Emplacement">{fiche.objet.emplacement}</Row>}
            {fiche.objet.bonus !== null && <Row label="Bonus">+{fiche.objet.bonus}</Row>}
            {fiche.objet.auraMagique && <Row label="Aura magique">{fiche.objet.auraMagique}</Row>}
            {fiche.objet.niveauLanceur !== null && <Row label="Niveau de lanceur">{fiche.objet.niveauLanceur}</Row>}
            {fiche.objet.chargesMax !== null && <Row label="Charges">{fiche.objet.chargesMax}</Row>}
            {fiche.prixAffiche && <Row label="Prix">{fiche.prixAffiche}</Row>}
          </div>
          <Description texte={fiche.objet.description} />
        </>
      )
    case 'arme':
      return (
        <>
          <div className="space-y-2">
            {fiche.categorieArme && <Row label="Catégorie">{fiche.categorieArme}</Row>}
            {fiche.arme.degats && <Row label="Dégâts">{fiche.arme.degats}</Row>}
            <Row label="Critique">{fiche.critique}</Row>
            {fiche.arme.portee !== null && <Row label="Facteur de portée">{fiche.arme.portee} m</Row>}
            {fiche.arme.typeDegats && <Row label="Type de dégâts">{fiche.arme.typeDegats}</Row>}
            {fiche.arme.taille && <Row label="Taille">{fiche.arme.taille}</Row>}
            {formatPoids(fiche.arme.poids) && <Row label="Poids">{formatPoids(fiche.arme.poids)}</Row>}
            {fiche.prixAffiche && <Row label="Prix">{fiche.prixAffiche}</Row>}
          </div>
          <Description texte={fiche.arme.description} />
        </>
      )
    case 'armure':
      return (
        <>
          <div className="space-y-2">
            {fiche.armure.type && <Row label="Type">{fiche.armure.type}</Row>}
            {fiche.armure.bonusArmure !== null && <Row label="Bonus d'armure">+{fiche.armure.bonusArmure}</Row>}
            {fiche.armure.maxDex !== null && <Row label="Bonus de DEX max.">+{fiche.armure.maxDex}</Row>}
            {fiche.armure.malusCompetence !== null && fiche.armure.malusCompetence !== 0 && (
              <Row label="Malus d'armure">{fiche.armure.malusCompetence}</Row>
            )}
            {fiche.armure.risqueEchecMagique !== null && fiche.armure.risqueEchecMagique !== 0 && (
              <Row label="Échec des sorts profanes">{fiche.armure.risqueEchecMagique} %</Row>
            )}
            {fiche.armure.deplacement !== null && <Row label="Déplacement">{fiche.armure.deplacement} m</Row>}
            {formatPoids(fiche.armure.poids) && <Row label="Poids">{formatPoids(fiche.armure.poids)}</Row>}
            {fiche.prixAffiche && <Row label="Prix">{fiche.prixAffiche}</Row>}
          </div>
        </>
      )
    case 'don':
      return (
        <>
          <div className="space-y-2">
            {fiche.don.categorie && <Row label="Catégorie">{fiche.don.categorie}</Row>}
            {fiche.don.prerequis && <Row label="Prérequis">{fiche.don.prerequis}</Row>}
            {fiche.don.effetMecanique && <Row label="Effet mécanique">{fiche.don.effetMecanique}</Row>}
          </div>
          <Description texte={fiche.don.description} />
        </>
      )
  }
}

export default async function FichePage({ params }: { params: Promise<{ categorie: string; id: string }> }) {
  const { categorie, id } = await params
  if (!SLUGS.includes(categorie as RayonSlug)) notFound()
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) notFound()

  const fiche = await getFicheBibliotheque(categorie as RayonSlug, numId)
  if (!fiche) notFound()

  const { icone, rayon } = EN_TETE[fiche.categorie]

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 -mx-3 min-h-[44px] rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            ← La Grande Bibliothèque
          </Link>
          <p className="text-stone-500 text-xs mt-4">{icone} {rayon}</p>
          <h1 className="text-3xl font-bold text-amber-300 mt-1">{nomDe(fiche)}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6">
          <Contenu fiche={fiche} />
        </div>
      </main>
    </div>
  )
}

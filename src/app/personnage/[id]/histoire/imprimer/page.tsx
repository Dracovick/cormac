import { notFound } from 'next/navigation'
import { getHistoire } from '@/lib/queries/histoire'
import { HistoireImprimable } from '@/components/histoire/HistoireImprimable'

export const dynamic = 'force-dynamic'

/**
 * Le PDF de l'histoire, vu du joueur connecté.
 *
 * Le document lui-même vit dans `HistoireImprimable` : la page de partage
 * public sert exactement le même, et deux copies du JSX auraient divergé à la
 * première retouche.
 */
export default async function ImprimerHistoire({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ⚠ `Number('abc')` vaut NaN, et la requête partirait avec un `where id = NaN`.
  const numero = Number(id)
  if (!Number.isInteger(numero) || numero <= 0) notFound()

  const histoire = await getHistoire(numero)
  if (!histoire) notFound()

  return <HistoireImprimable histoire={histoire} retourHref={`/personnage/${histoire.id}/histoire`} />
}

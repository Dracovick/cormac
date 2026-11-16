import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getHistoireParJeton } from '@/lib/queries/histoire'
import { HistoireImprimable } from '@/components/histoire/HistoireImprimable'
import { cheminPartage, estJetonBienForme } from '@/lib/partage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Le PDF d'une histoire partagée.
 *
 * ⭐ Exactement le même document que celui du joueur connecté — même composant,
 * seule l'adresse de retour change. Celui à qui André donne le lien imprime la
 * même chose que lui.
 */
export default async function ImprimerHistoirePartagee({
  params,
}: {
  params: Promise<{ jeton: string }>
}) {
  const { jeton } = await params
  if (!estJetonBienForme(jeton)) notFound()

  const histoire = await getHistoireParJeton(jeton)
  if (!histoire) notFound()

  return <HistoireImprimable histoire={histoire} retourHref={cheminPartage(jeton)} />
}

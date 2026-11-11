import { notFound } from 'next/navigation'
import { getCharacter } from '@/lib/queries/character'
import { charDataToForm } from '@/lib/char-convert'
import { CharacterForm } from '@/components/creation/CharacterForm'
import { getPotionsCatalogue, getObjetsCatalogue } from '@/app/actions/character'

export const dynamic = 'force-dynamic'

export default async function ModifierPersonnage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, potionsCatalogue, objetsCatalogue] = await Promise.all([
    getCharacter(Number(id)),
    getPotionsCatalogue(),
    getObjetsCatalogue(),
  ])
  if (!data) notFound()

  const initialData = charDataToForm(data)

  return (
    <CharacterForm
      personnageId={Number(id)}
      initialData={initialData}
      potionsCatalogue={potionsCatalogue}
      objetsCatalogue={objetsCatalogue}
    />
  )
}

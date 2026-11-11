import { CharacterForm } from '@/components/creation/CharacterForm'
import { getPotionsCatalogue, getObjetsCatalogue } from '@/app/actions/character'

export const dynamic = 'force-dynamic'

export default async function NouveauPersonnage() {
  const [potionsCatalogue, objetsCatalogue] = await Promise.all([
    getPotionsCatalogue(),
    getObjetsCatalogue(),
  ])
  return <CharacterForm potionsCatalogue={potionsCatalogue} objetsCatalogue={objetsCatalogue} />
}

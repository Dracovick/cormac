import { CharacterForm } from '@/components/creation/CharacterForm'
import { getPotionsCatalogue } from '@/app/actions/character'

export const dynamic = 'force-dynamic'

export default async function NouveauPersonnage() {
  const potionsCatalogue = await getPotionsCatalogue()
  return <CharacterForm potionsCatalogue={potionsCatalogue} />
}

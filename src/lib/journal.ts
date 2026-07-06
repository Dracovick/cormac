import { getDb } from '@/db'
import * as schema from '@/db/schema'

// Types d'entrées du journal de partie
export type JournalType = 'pv' | 'sort' | 'potion' | 'charge' | 'effet' | 'attaque' | 'repos' | 'round' | 'note'

// Écrit une entrée dans le journal de partie. personnageId null = marqueur global de
// table (rounds de combat). Le journal ne doit JAMAIS faire échouer l'action de jeu
// qui le déclenche — les erreurs sont avalées.
export async function logJournal(
  personnageId: number | null,
  type: JournalType,
  description: string,
  valeur?: number | null
) {
  try {
    await getDb().insert(schema.characterJournal).values({
      personnageId,
      type,
      description,
      valeur: valeur ?? null,
    })
  } catch (err) {
    console.error('Entrée de journal non écrite :', err)
  }
}

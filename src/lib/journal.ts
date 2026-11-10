import { getDb } from '@/db'
import * as schema from '@/db/schema'

// Types d'entrées du journal de partie
export type JournalType = 'pv' | 'sort' | 'potion' | 'parchemin' | 'charge' | 'effet' | 'attaque' | 'repos' | 'round' | 'note' | 'bilan' | 'xp' | 'butin' | 'photo' | 'niveau'

// Nom du Maître de jeu tel qu'il s'est identifié dans la vue /partie. Normalisé ici
// plutôt qu'au point d'appel : toutes les actions du MJ passent par logJournal, donc
// une seule place décide de ce qui entre en base. Vide ou blanc ⇒ NULL, pas ''.
export function normaliserMj(mj?: string | null): string | null {
  const t = (mj ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
  return t || null
}

// Écrit une entrée dans le journal de partie. personnageId null = marqueur global de
// table (rounds de combat). `mj` signe les entrées posées depuis la vue du MJ — il
// reste NULL pour tout ce qui part d'une fiche de personnage. Le journal ne doit
// JAMAIS faire échouer l'action de jeu qui le déclenche — les erreurs sont avalées.
export async function logJournal(
  personnageId: number | null,
  type: JournalType,
  description: string,
  valeur?: number | null,
  mj?: string | null
) {
  try {
    await getDb().insert(schema.characterJournal).values({
      personnageId,
      type,
      description,
      valeur: valeur ?? null,
      mj: normaliserMj(mj),
    })
  } catch (err) {
    console.error('Entrée de journal non écrite :', err)
  }
}

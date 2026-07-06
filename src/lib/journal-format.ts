// Utilitaires d'affichage du journal de partie — code pur, utilisable côté client.

// Journée ludique : une soirée de jeu qui déborde après minuit appartient encore à la
// veille. La coupure est à 6 h du matin, heure du Québec.
export const TZ_QUEBEC = 'America/Toronto'
export const COUPURE_JOURNEE_H = 6

// Date (AAAA-MM-JJ) de la journée ludique d'un instant donné
export function journeeLudique(d: Date): string {
  return new Date(d.getTime() - COUPURE_JOURNEE_H * 3600_000)
    .toLocaleDateString('en-CA', { timeZone: TZ_QUEBEC })
}

// Journée ludique en cours
export function journeeLudiqueCourante(): string {
  return journeeLudique(new Date())
}

// Décalage UTC du Québec pour une date donnée (« -04:00 » l'été, « -05:00 » l'hiver)
export function decalageQuebec(dateStr: string): string {
  const probe = new Date(`${dateStr}T12:00:00Z`)
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: TZ_QUEBEC, timeZoneName: 'longOffset' })
    .formatToParts(probe)
    .find(p => p.type === 'timeZoneName')?.value ?? 'GMT-05:00'
  const off = tz.replace('GMT', '')
  return off || '-05:00'
}

// Heure locale du Québec (HH:MM) d'un instant
export function heureQuebec(d: Date): string {
  return d.toLocaleTimeString('fr-CA', { timeZone: TZ_QUEBEC, hour: '2-digit', minute: '2-digit' })
}

// « samedi 4 juillet 2026 » à partir d'une journée ludique AAAA-MM-JJ
export function dateLisible(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('fr-CA', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Journée ludique décalée de N jours (navigation ‹ › du journal du MJ)
export function jourDecale(dateStr: string, delta: number): string {
  return new Date(new Date(`${dateStr}T12:00:00Z`).getTime() + delta * 24 * 3600_000)
    .toISOString().slice(0, 10)
}

// Icône et couleur par type d'entrée
export function iconeEntree(type: string, valeur: number | null): { icone: string; couleur: string } {
  switch (type) {
    case 'pv':      return (valeur ?? 0) < 0
      ? { icone: '🩸', couleur: 'text-red-400' }
      : { icone: '✚', couleur: 'text-green-400' }
    case 'sort':    return { icone: '✨', couleur: 'text-purple-300' }
    case 'potion':  return { icone: '🧪', couleur: 'text-emerald-300' }
    case 'charge':  return { icone: '🔮', couleur: 'text-violet-300' }
    case 'effet':   return { icone: '◈', couleur: 'text-blue-300' }
    case 'attaque': return { icone: '⚔', couleur: 'text-amber-300' }
    case 'repos':   return { icone: '🌙', couleur: 'text-sky-300' }
    case 'round':   return { icone: '▶', couleur: 'text-amber-500' }
    default:        return { icone: '📝', couleur: 'text-stone-300' }
  }
}

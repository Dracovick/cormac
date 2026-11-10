// Signature d'une entrée du journal posée par un Maître de jeu. Rien ne s'affiche
// quand l'entrée n'est pas signée : les actions des joueurs (PV, sorts, potions,
// attaques) n'ont pas de MJ, et les entrées écrites avant le 2026-11-09 n'en avaient
// pas la possibilité. Une pastille « MJ inconnu » n'apprendrait rien et alourdirait
// chaque ligne d'une chronique de plusieurs mois.
export function PastilleMJ({ mj }: { mj: string | null }) {
  if (!mj) return null
  return (
    <span
      className="text-xs bg-amber-950/70 text-amber-300/90 border border-amber-800/50 rounded-full px-2 shrink-0 mt-px whitespace-nowrap"
      title={`Entrée du Maître de jeu ${mj}`}
    >
      🎩 {mj}
    </span>
  )
}

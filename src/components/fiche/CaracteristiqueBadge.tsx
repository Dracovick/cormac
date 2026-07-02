function modif(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

type Props = {
  label: string
  base: number
  magic: number
  sort?: number // bonus temporaire d'un sort actif (ex. Force de taureau +4)
}

export function CaracteristiqueBadge({ label, base, magic, sort = 0 }: Props) {
  const score = base + magic + sort
  const mod = modif(score)
  return (
    <div className={`flex flex-col items-center bg-stone-800 border rounded-lg p-3 min-w-[80px] ${sort !== 0 ? 'border-violet-600' : 'border-amber-900/50'}`}>
      <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">{label}</span>
      <span className={`text-3xl font-bold my-1 ${sort !== 0 ? 'text-violet-200' : 'text-white'}`}>{score}</span>
      <span className="text-amber-300 text-lg font-semibold">{mod}</span>
      {magic > 0 && (
        <span className="text-purple-400 text-xs mt-1">+{magic} mag.</span>
      )}
      {sort !== 0 && (
        <span className="text-violet-400 text-xs mt-1">{sort > 0 ? '+' : ''}{sort} sort ✨</span>
      )}
    </div>
  )
}

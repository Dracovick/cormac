function modif(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function total(base: number, magic: number) {
  return base + magic
}

type Props = {
  label: string
  base: number
  magic: number
}

export function CaracteristiqueBadge({ label, base, magic }: Props) {
  const score = total(base, magic)
  const mod = modif(score)
  return (
    <div className="flex flex-col items-center bg-stone-800 border border-amber-900/50 rounded-lg p-3 min-w-[80px]">
      <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">{label}</span>
      <span className="text-white text-3xl font-bold my-1">{score}</span>
      <span className="text-amber-300 text-lg font-semibold">{mod}</span>
      {magic > 0 && (
        <span className="text-purple-400 text-xs mt-1">+{magic} mag.</span>
      )}
    </div>
  )
}

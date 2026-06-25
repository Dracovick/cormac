type Props = { label: string; value: string | number; sub?: string }

export function StatBlock({ label, value, sub }: Props) {
  return (
    <div className="flex flex-col items-center bg-stone-800/60 rounded p-2 text-center">
      <span className="text-amber-500 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-white text-xl font-bold">{value}</span>
      {sub && <span className="text-stone-400 text-xs">{sub}</span>}
    </div>
  )
}

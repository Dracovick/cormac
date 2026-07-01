export function Section({ titre, children, className = '', action }: { titre: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={`bg-stone-900 border border-amber-900/40 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3 border-b border-amber-900/40 pb-2">
        <h2 className="text-amber-400 font-bold text-sm uppercase tracking-widest">{titre}</h2>
        {action && <div className="flex items-center gap-1.5">{action}</div>}
      </div>
      {children}
    </div>
  )
}

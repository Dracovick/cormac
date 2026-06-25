export function Section({ titre, children, className = '' }: { titre: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-stone-900 border border-amber-900/40 rounded-lg p-4 ${className}`}>
      <h2 className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3 border-b border-amber-900/40 pb-2">
        {titre}
      </h2>
      {children}
    </div>
  )
}

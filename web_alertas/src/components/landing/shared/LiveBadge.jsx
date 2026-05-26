export default function LiveBadge({ label = 'En vivo', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  )
}

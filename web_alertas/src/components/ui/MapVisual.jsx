import { motion } from 'framer-motion'

const pins = [
  { top: '22%', left: '38%', color: '#0f766e', label: 'Robo' },
  { top: '48%', left: '62%', color: '#52525b', label: 'Accidente' },
  { top: '68%', left: '28%', color: '#b45309', label: 'Incendio' },
]

export default function MapVisual({ className = '', showControls = false, compact = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#e4e4e7] ${className}`}
      style={{ minHeight: compact ? '100%' : undefined }}
    >
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-[8%] left-[5%] w-[28%] h-[35%] rounded-lg bg-[#d4d4d8]" />
        <div className="absolute top-[12%] right-[8%] w-[32%] h-[28%] rounded-lg bg-[#d4d4d8]" />
        <div className="absolute bottom-[10%] left-[12%] w-[40%] h-[30%] rounded-lg bg-[#d4d4d8]" />
      </div>

      <svg className="absolute inset-0 w-full h-full" aria-hidden>
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#fff" strokeWidth={compact ? 4 : 6} strokeLinecap="round" />
        <line x1="0" y1="62%" x2="100%" y2="62%" stroke="#fff" strokeWidth={compact ? 3 : 5} strokeLinecap="round" />
        <line x1="32%" y1="0" x2="32%" y2="100%" stroke="#fff" strokeWidth={compact ? 3 : 5} strokeLinecap="round" />
        <line x1="68%" y1="0" x2="68%" y2="100%" stroke="#fff" strokeWidth={compact ? 3 : 4} strokeLinecap="round" />
      </svg>

      <div
        className="absolute z-10"
        style={{ top: '52%', left: '48%', transform: 'translate(-50%, -50%)' }}
      >
        <span className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-teal-600/20 map-ring" />
        <span className="relative block w-3 h-3 rounded-full bg-teal-700 border-2 border-white shadow-soft" />
      </div>

      {pins.map((pin, i) => (
        <motion.div
          key={pin.label}
          className="absolute z-10 group"
          style={{ top: pin.top, left: pin.left }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
        >
          <span
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full opacity-25 map-ring"
            style={{ backgroundColor: pin.color }}
          />
          <span
            className="relative block w-2.5 h-2.5 rounded-full border-2 border-white shadow-soft"
            style={{ backgroundColor: pin.color }}
          />
          {!compact && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded text-[10px] font-medium text-white bg-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {pin.label}
            </span>
          )}
        </motion.div>
      ))}

      {showControls && (
        <div className="absolute bottom-3 right-3 z-20">
          <div className="card shadow-soft flex flex-col overflow-hidden text-zinc-600 text-sm font-medium">
            <button type="button" className="w-8 h-8 hover:bg-zinc-50 border-b border-zinc-100">+</button>
            <button type="button" className="w-8 h-8 hover:bg-zinc-50">−</button>
          </div>
        </div>
      )}
    </div>
  )
}

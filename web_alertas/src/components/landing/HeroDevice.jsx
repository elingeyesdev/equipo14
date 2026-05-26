import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

const pins = [
  { top: '28%', left: '38%', color: 'bg-blue-600', ring: 'ring-blue-600/25' },
  { top: '52%', left: '62%', color: 'bg-orange-500', ring: 'ring-orange-500/25' },
  { top: '68%', left: '28%', color: 'bg-zinc-400', ring: 'ring-zinc-400/25' },
]

const feed = [
  { title: 'Robo reportado', time: '1 min', dot: 'bg-blue-600' },
  { title: 'Accidente vial', time: '4 min', dot: 'bg-amber-500' },
]

export default function HeroDevice() {
  return (
    <div className="relative mx-auto w-full max-w-[400px] lg:max-w-none">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Dispositivo */}
        <div className="relative rounded-[2.5rem] bg-zinc-950 p-2 shadow-device">
          <div className="overflow-hidden rounded-[2.1rem] bg-white">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <span className="text-[13px] font-semibold text-zinc-800">9:41</span>
              <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-zinc-600">En vivo</span>
              </div>
            </div>

            <div className="mx-auto mb-3 h-5 w-[72px] rounded-full bg-zinc-950" />

            <div className="px-5 pb-2">
              <p className="text-[11px] font-medium text-zinc-400">Tu ciudad</p>
              <p className="text-lg font-bold tracking-tight text-zinc-900">Alertas</p>
            </div>

            {/* Mapa estilizado */}
            <div className="relative mx-4 mb-4 aspect-[4/5] max-h-[280px] overflow-hidden rounded-2xl bg-[#e8edf2]">
              <svg
                className="absolute inset-0 h-full w-full opacity-50"
                viewBox="0 0 320 400"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
              >
                <path
                  d="M0 120h320M0 200h320M0 280h320M80 0v400M160 0v400M240 0v400"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                <path
                  d="M40 80c40 20 80 10 120 40s80 30 120 10 40-20 40-20"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M20 300c60-30 100-10 140 20s100 40 160 10"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>

              {pins.map((pin, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 260, damping: 20 }}
                  className={`absolute h-3 w-3 rounded-full ${pin.color} ring-4 ${pin.ring}`}
                  style={{ top: pin.top, left: pin.left }}
                />
              ))}

              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 p-3 shadow-sm backdrop-blur-sm border border-white/80">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.5} />
                  <span className="text-[11px] font-semibold text-zinc-800">Centro · 3 alertas</span>
                </div>
              </div>
            </div>

            {/* Feed compacto */}
            <div className="space-y-2 px-4 pb-6">
              {feed.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900">{item.title}</p>
                  </div>
                  <span className="text-[11px] text-zinc-400">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Toast único */}
        <motion.div
          initial={{ opacity: 0, y: 12, x: 12 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="absolute -right-2 top-[18%] z-10 hidden sm:flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-premium-lg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
          </span>
          <div>
            <p className="text-xs font-semibold text-zinc-900">Nueva alerta</p>
            <p className="text-[11px] text-zinc-500">Av. Principal · ahora</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

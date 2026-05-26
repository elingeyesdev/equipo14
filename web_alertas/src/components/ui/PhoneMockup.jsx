import { motion } from 'framer-motion'
import { Bell, MapPin, Navigation } from 'lucide-react'
import MapVisual from './MapVisual'

const alerts = [
  { type: 'Robo reportado', meta: 'Hace 1 min · 120 m', icon: Bell },
  { type: 'Accidente vial', meta: 'Hace 4 min · 380 m', icon: MapPin },
  { type: 'Incendio cercano', meta: 'Hace 12 min · 890 m', icon: MapPin },
]

export default function PhoneMockup({ className = '' }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative mx-auto w-[300px] sm:w-[340px] lg:w-[360px]">
        <div className="rounded-[3rem] bg-zinc-900 p-3 shadow-phone">
          <div className="rounded-[2.5rem] bg-white overflow-hidden border-2 border-zinc-200">
            <div className="flex items-center justify-between px-6 pt-4 pb-2 text-sm font-semibold text-zinc-700">
              <span>9:41</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600 live-indicator" />
                <span className="text-xs text-teal-800 font-bold">En vivo</span>
              </div>
            </div>

            <div className="mx-auto w-28 h-6 bg-zinc-900 rounded-full mb-3" />

            <div className="px-5 flex items-center justify-between mb-3">
              <span className="text-base font-bold text-zinc-900">Alertas</span>
              <Navigation className="w-5 h-5 text-zinc-500" />
            </div>

            <div className="mx-4 h-[240px] lg:h-[260px] rounded-2xl overflow-hidden border border-zinc-200">
              <MapVisual className="h-full w-full" compact showControls />
            </div>

            <div className="px-4 pt-4 pb-5 space-y-2.5">
              {alerts.map((a) => (
                <div
                  key={a.type}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50"
                >
                  <div className="icon-box w-10 h-10 shrink-0">
                    <a.icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900 truncate">{a.type}</p>
                    <p className="text-xs text-muted-readable">{a.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

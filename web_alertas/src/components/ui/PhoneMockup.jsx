import { motion } from 'framer-motion'
import { Bell, Flame, MapPin, ShieldAlert, Car } from 'lucide-react'
import MapaInteractivo from '../MapaInteractivo'
import LiveBadge from '../landing/shared/LiveBadge'

const alerts = [
  { type: 'Robo reportado', meta: 'Hace 1 min · 120 m', icon: ShieldAlert, tone: 'bg-blue-50 text-blue-700' },
  { type: 'Accidente vial', meta: 'Hace 4 min · 380 m', icon: Car, tone: 'bg-amber-50 text-amber-700' },
  { type: 'Incendio cercano', meta: 'Hace 12 min · 890 m', icon: Flame, tone: 'bg-orange-50 text-orange-700' },
]

const stats = [
  { label: 'Activas', value: '24' },
  { label: 'Verificadas', value: '18' },
  { label: 'Zonas', value: '6' },
]

export default function PhoneMockup({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Halo suave */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-blue-100/60 via-white to-transparent blur-3xl"
        aria-hidden
      />

      {/* Mini dashboard flotante */}
      <motion.div
        initial={{ opacity: 0, x: -24, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel absolute -left-6 sm:-left-12 top-8 z-20 hidden sm:block w-[168px] rounded-2xl p-4 animate-float-subtle"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Panel urbano
        </p>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-[9px] font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alerta flotante */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -12 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel absolute -right-4 sm:-right-10 bottom-24 z-20 w-[190px] rounded-2xl p-3.5"
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
            <Bell className="h-4 w-4 text-orange-600" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">Nueva alerta</p>
            <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">
              Choque en Av. Principal · hace 2s
            </p>
          </div>
        </div>
      </motion.div>

      {/* Dispositivo */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-[min(100%,340px)] sm:w-[360px] lg:w-[380px]"
      >
        <div className="rounded-[2.75rem] bg-slate-900 p-[10px] shadow-phone ring-1 ring-slate-900/10">
          <div className="overflow-hidden rounded-[2.35rem] bg-white ring-1 ring-slate-200/80">
            <div className="flex items-center justify-between px-6 pt-3.5 pb-1 text-[13px] font-semibold text-slate-800">
              <span>9:41</span>
              <LiveBadge label="Live" className="!py-0.5 !px-2 !text-[10px]" />
            </div>

            <div className="mx-auto mb-2 h-6 w-24 rounded-full bg-slate-900" />

            <div className="flex items-center justify-between px-5 pb-3">
              <div>
                <p className="text-[10px] font-medium text-slate-400">Monitoreo</p>
                <p className="text-base font-bold text-slate-900 tracking-tight">Alertas</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <MapPin className="h-4 w-4 text-slate-600" strokeWidth={2} />
              </div>
            </div>

            <div className="relative mx-4 mb-3 h-[220px] sm:h-[240px] overflow-hidden rounded-2xl border border-slate-200/80 shadow-inner">
              <MapaInteractivo className="h-full w-full" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent" />
            </div>

            <div className="space-y-2 px-4 pb-5">
              {alerts.map((a, i) => (
                <motion.div
                  key={a.type}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.tone}`}>
                    <a.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900">{a.type}</p>
                    <p className="text-[11px] text-slate-500">{a.meta}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

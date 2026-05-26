import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Car, Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

/* ─── Data ─── */
const CATEGORIES = {
  robo:       { label: 'Robo',             color: '#ef4444', bg: 'rgba(239,68,68,0.15)',    icon: Flame,         text: 'text-red-500'    },
  accidente:  { label: 'Accidente vial',   color: '#f97316', bg: 'rgba(249,115,22,0.15)',   icon: Car,           text: 'text-orange-500' },
  emergencia: { label: 'Emergencia médica',color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',   icon: Activity,      text: 'text-violet-500' },
  trafico:    { label: 'Tráfico',          color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',   icon: AlertTriangle, text: 'text-blue-500'   },
}

const PINS_INITIAL = [
  { id: 1,  cat: 'robo',       x: 22,  y: 35, label: 'Av. Cañoto',      time: 2  },
  { id: 2,  cat: 'accidente',  x: 55,  y: 55, label: 'Calle Junín',     time: 4  },
  { id: 3,  cat: 'emergencia', x: 75,  y: 28, label: 'Av. Roca',        time: 6  },
  { id: 4,  cat: 'trafico',    x: 40,  y: 72, label: '4to anillo',      time: 9  },
  { id: 5,  cat: 'robo',       x: 82,  y: 65, label: 'Mercado Los Pozos',time: 12 },
  { id: 6,  cat: 'accidente',  x: 14,  y: 60, label: 'Av. Santos Dumont',time: 15 },
  { id: 7,  cat: 'trafico',    x: 62,  y: 18, label: '2do anillo',      time: 18 },
  { id: 8,  cat: 'emergencia', x: 32,  y: 45, label: 'Parque Urbano',   time: 20 },
]

const HEATS = [
  { x: 22, y: 35, r: 80,  color: '#ef4444', op: 0.18 },
  { x: 55, y: 55, r: 65,  color: '#f97316', op: 0.15 },
  { x: 75, y: 28, r: 55,  color: '#8b5cf6', op: 0.14 },
  { x: 40, y: 72, r: 70,  color: '#3b82f6', op: 0.13 },
  { x: 82, y: 65, r: 50,  color: '#ef4444', op: 0.12 },
]

const STREETS = {
  h: [18, 38, 58, 78],
  v: [15, 32, 52, 68, 84],
}

/* ─── Map Pin SVG ─── */
function MapPin({ color, size = 22 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 20 24" fill="none">
      <path d="M10 0C5.03 0 1 4.03 1 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z" fill={color} />
      <circle cx="10" cy="9" r="3.5" fill="white" opacity="0.85" />
    </svg>
  )
}

/* ─── Legend ─── */
function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {Object.entries(CATEGORIES).map(([key, c]) => {
        const Icon = c.icon
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-sm" style={{ background: c.bg }}>
              <Icon className="h-2.5 w-2.5" style={{ color: c.color }} strokeWidth={2.5} />
            </span>
            <span className="text-[11px] font-medium text-[var(--body)]">{c.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Live Ticker ─── */
function LiveTicker({ pins }) {
  const items = pins.map(p => {
    const cat = CATEGORIES[p.cat]
    return `${cat.label} · ${p.label} · hace ${p.time} min`
  })
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden flex items-center gap-2">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">En vivo</span>
      <div className="relative overflow-hidden flex-1">
        <div className="flex gap-6 animate-ticker whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="text-[11px] text-[var(--body)] shrink-0">
              <span className="text-[var(--muted)] mr-2">·</span>{item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function PremiumMap() {
  const [pins, setPins] = useState(PINS_INITIAL)
  const [selectedPin, setSelectedPin] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [pulse, setPulse] = useState(false)
  const idRef = useRef(100)

  // Simulate real-time: add/update a pin every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      const catKeys = Object.keys(CATEGORIES)
      const areas = ['Av. Alemana','Equipetrol','Urbarí','Las Palmas','Plan 3000','Villa 1ro de Mayo','Hamacas']
      const newPin = {
        id: idRef.current++,
        cat: catKeys[Math.floor(Math.random() * catKeys.length)],
        x: 8 + Math.random() * 84,
        y: 8 + Math.random() * 84,
        label: areas[Math.floor(Math.random() * areas.length)],
        time: 1,
      }
      setPins(prev => {
        const updated = prev.map(p => ({ ...p, time: p.time + 1 }))
        return [newPin, ...updated].slice(0, 12)
      })
      setLastUpdated(new Date())
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const recentPins = pins.slice(0, 4)

  return (
    <section id="mapa-live" className="snap-section bg-[var(--surface)] section-pad relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, var(--accent), transparent 70%)' }}
        aria-hidden />

      <div className="container-main relative z-10">
        <SectionHeader
          eyebrow="Mapa en tiempo real"
          title="Alertas activas en tu ciudad."
          description="Visualización en vivo de incidentes reportados por la comunidad. Actualización automática cada pocos segundos."
          className="mb-10"
        />

        <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
          {/* ─── MAP ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="admin-card overflow-hidden"
          >
            {/* Map toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-hover)]">
              <div className="flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${pulse ? 'bg-emerald-400' : 'bg-emerald-500'} transition-colors`} />
                <span className="text-[11px] font-semibold text-[var(--ink)]">Santa Cruz de la Sierra</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[var(--muted)]">
                  Actualizado: {lastUpdated.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <RefreshCw className={`h-3 w-3 text-[var(--muted)] ${pulse ? 'animate-spin' : ''}`} />
              </div>
            </div>

            {/* Map canvas */}
            <div className="map-sim-container h-[400px] lg:h-[460px]">
              {/* Dark map background */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                {/* Base */}
                <rect width="100" height="100" fill="#0f1623"/>
                {/* Street grid H */}
                {STREETS.h.map(y => (
                  <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#1e2d45" strokeWidth="0.6"/>
                ))}
                {/* Street grid V */}
                {STREETS.v.map(x => (
                  <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#1e2d45" strokeWidth="0.6"/>
                ))}
                {/* Diagonal avenue */}
                <line x1="0" y1="25" x2="60" y2="85" stroke="#1e2d45" strokeWidth="0.8"/>
                <line x1="40" y1="0" x2="100" y2="70" stroke="#1e2d45" strokeWidth="0.8"/>
                {/* City blocks */}
                {[
                  [16,20,14,16],[33,20,17,16],[52,20,14,16],[70,20,12,16],
                  [16,40,14,16],[33,40,17,16],[70,40,12,16],
                  [16,60,14,16],[52,60,14,16],[70,60,12,16],
                ].map(([x,y,w,h],i) => (
                  <rect key={i} x={x} y={y} width={w} height={h} rx="0.5" fill="#152032" opacity="0.9"/>
                ))}
                {/* Main avenue label */}
                <text x="2" y="17" fontSize="1.8" fill="#3b5578" fontFamily="system-ui">Av. Cañoto</text>
                <text x="2" y="37" fontSize="1.8" fill="#3b5578" fontFamily="system-ui">Av. Cristo Redentor</text>
              </svg>

              {/* Heatmap circles */}
              {HEATS.map((h, i) => (
                <div key={i}
                  className="map-heat-circle animate-glow-pulse"
                  style={{
                    top: `${h.y}%`, left: `${h.x}%`,
                    width: h.r, height: h.r,
                    background: `radial-gradient(circle, ${h.color} 0%, transparent 70%)`,
                    opacity: h.op,
                    animationDelay: `${i * 0.8}s`,
                  }}
                />
              ))}

              {/* Radar rings on first pin */}
              <div className="absolute" style={{top:'35%',left:'22%',transform:'translate(-50%,-50%)'}}>
                {[1,2,3].map(r => (
                  <span key={r} className="absolute inset-0 rounded-full border border-red-500/40 animate-radar-ping"
                    style={{ animationDelay: `${r * 0.6}s`, width: 40, height: 40, marginLeft: -20, marginTop: -20 }} />
                ))}
              </div>

              {/* Pins */}
              <AnimatePresence>
                {pins.map((pin) => {
                  const cat = CATEGORIES[pin.cat]
                  return (
                    <motion.div
                      key={pin.id}
                      className="map-sim-pin"
                      style={{ top: `${pin.y}%`, left: `${pin.x}%` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      onClick={() => setSelectedPin(selectedPin?.id === pin.id ? null : pin)}
                    >
                      <MapPin color={cat.color} size={20} />
                      {selectedPin?.id === pin.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="map-float-card"
                          style={{ bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                            <span className="font-semibold text-[var(--ink)] text-[11px]">{cat.label}</span>
                          </div>
                          <p className="text-[10px] text-[var(--muted)]">{pin.label}</p>
                          <p className="text-[10px] text-[var(--muted)]">hace {pin.time} min</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Bottom legend bar */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#0f1623] to-transparent">
                <div className="flex items-center justify-between">
                  <Legend />
                  <span className="text-[10px] text-[#3b5578]">{pins.length} alertas</span>
                </div>
              </div>
            </div>

            {/* Ticker */}
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-hover)]">
              <LiveTicker pins={recentPins} />
            </div>
          </motion.div>

          {/* ─── SIDEBAR ─── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            {/* Stats */}
            <div className="admin-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Resumen activo</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORIES).map(([key, cat]) => {
                  const count = pins.filter(p => p.cat === key).length
                  const Icon = cat.icon
                  return (
                    <div key={key} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: cat.bg }}>
                      <Icon className="h-4 w-4 shrink-0" style={{ color: cat.color }} strokeWidth={2} />
                      <div>
                        <p className="text-base font-bold leading-none" style={{ color: cat.color }}>{count}</p>
                        <p className="text-[10px] text-[var(--body)] mt-0.5">{cat.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent alerts list */}
            <div className="admin-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Alertas recientes</p>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {recentPins.map(pin => {
                    const cat = CATEGORIES[pin.cat]
                    const Icon = cat.icon
                    return (
                      <motion.div
                        key={pin.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2.5"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: cat.bg }}>
                          <Icon className="h-3 w-3" style={{ color: cat.color }} strokeWidth={2.5} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-[var(--ink)] truncate">{cat.label}</p>
                          <p className="text-[10px] text-[var(--muted)] truncate">{pin.label}</p>
                        </div>
                        <span className="text-[10px] text-[var(--muted)] shrink-0">{pin.time}m</span>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* CTA to real map */}
            <div className="admin-card p-4 text-center">
              <p className="text-[12px] font-medium text-[var(--body)] mb-3">
                Accede al mapa completo con tu cuenta
              </p>
              <a href="/login" className="btn-primary !h-9 !text-[13px] w-full justify-center">
                Ver mapa completo →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

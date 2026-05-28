import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Users, ShieldCheck, Clock, Star, MapPin } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]

const kpis = [
  {
    icon: Users,
    value: 12000,
    suffix: '+',
    display: '12.000+',
    label: 'Usuarios activos',
    desc: 'Ciudadanos que reportan cada día',
    gradient: 'linear-gradient(135deg, #2563eb, #06b6d4)',
    glow: 'rgba(37,99,235,0.2)',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    icon: ShieldCheck,
    value: 8500,
    suffix: '+',
    display: '8.500+',
    label: 'Reportes verificados',
    desc: 'Validados por la comunidad',
    gradient: 'linear-gradient(135deg, #10b981, #06d6a0)',
    glow: 'rgba(16,185,129,0.2)',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    icon: Clock,
    value: 24,
    suffix: '/7',
    display: '24/7',
    label: 'Monitoreo continuo',
    desc: 'Sin interrupciones, siempre activo',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    glow: 'rgba(139,92,246,0.2)',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    icon: Star,
    value: 98,
    suffix: '%',
    display: '98%',
    label: 'Satisfacción',
    desc: 'Valoración de usuarios activos',
    gradient: 'linear-gradient(135deg, #f97316, #fbbf24)',
    glow: 'rgba(249,115,22,0.2)',
    bg: 'rgba(249,115,22,0.08)',
  },
  {
    icon: MapPin,
    value: 50,
    suffix: '+',
    display: '50+',
    label: 'Barrios conectados',
    desc: 'Y creciendo cada semana',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    glow: 'rgba(236,72,153,0.2)',
    bg: 'rgba(236,72,153,0.08)',
  },
]

function AnimatedValue({ target, suffix, duration = 1.4 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start
    const run = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / (duration * 1000), 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(run)
    }
    requestAnimationFrame(run)
  }, [inView, target, duration])

  const fmt = (n) => {
    if (target >= 1000) return `${(n / 1000).toFixed(n >= target ? 0 : 1)}k`
    return String(n)
  }

  return <span ref={ref} className="stat-counter">{fmt(val)}{suffix}</span>
}

export default function KPISection() {
  return (
    <section className="bg-[var(--elevated)] relative overflow-hidden py-16 lg:py-20">
      {/* Top/bottom dividers */}
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden />

      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="eyebrow mb-3">Impacto real</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            Números que hablan por sí solos.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.45, ease }}
                className="group relative card-premium shimmer-overlay p-6 text-center cursor-default min-h-[175px] flex flex-col justify-between"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-[1rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${kpi.glow}, transparent 70%)` }}
                />
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[1rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: kpi.gradient }} />

                <div className="relative z-10 flex flex-col items-center justify-between h-full">
                  <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: kpi.gradient }}>
                    <Icon className="h-5.5 w-5.5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
                      <AnimatedValue target={kpi.value} suffix={kpi.suffix} />
                    </p>
                    <p className="mt-2 text-[13.5px] font-bold text-[var(--ink)]">{kpi.label}</p>
                    <p className="mt-1.5 text-[11.5px] text-[var(--muted)] leading-relaxed block">{kpi.desc}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 section-divider" aria-hidden />
    </section>
  )
}

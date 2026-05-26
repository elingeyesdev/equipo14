import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Reportes totales', value: '12k+', numEnd: 12, suffix: 'k+',  color: 'text-[var(--accent)]' },
  { label: 'Verificados',      value: '98%',  numEnd: 98, suffix: '%',   color: 'text-emerald-500'     },
  { label: 'Zonas activas',    value: '50+',  numEnd: 50, suffix: '+',   color: 'text-violet-500'      },
  { label: 'Latencia avg',     value: '<1s',  numEnd: 1,  suffix: 's', prefix: '<', color: 'text-orange-500' },
]

function Counter({ end, suffix, prefix = '', duration = 1.4 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [cur, setCur] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start
    const run = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCur(Math.floor(eased * end))
      if (p < 1) requestAnimationFrame(run)
    }
    requestAnimationFrame(run)
  }, [inView, end, duration])

  return <span ref={ref} className="stat-counter">{prefix}{cur}{suffix}</span>
}

export default function PremiumStats() {
  return (
    <section className="bg-[var(--elevated)] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden />

      <div className="container-main py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-8 py-10 lg:px-12 lg:py-12"
        >
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }} aria-hidden />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left copy */}
            <div className="max-w-xs">
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-semibold">
                <TrendingUp className="h-3 w-3" />
                Impacto real
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                Red ciudadana en crecimiento.
              </h2>
              <p className="mt-1.5 text-[13px] text-[var(--body)]">
                Métricas completas disponibles tras{' '}
                <Link to="/login" className="text-[var(--accent)] font-semibold hover:underline">
                  iniciar sesión
                </Link>.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-10">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="text-center lg:text-left"
                >
                  <p className={`text-3xl font-bold tracking-tight ${s.color}`}>
                    <Counter end={s.numEnd} suffix={s.suffix} prefix={s.prefix || ''} />
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-[var(--muted)]">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 section-divider" aria-hidden />
    </section>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Reportes', value: '12k+' },
  { label: 'Verificados', value: '98%' },
  { label: 'Zonas', value: '50+' },
  { label: 'Latencia', value: '<1s' },
]

export default function PremiumStats() {
  return (
    <section className="snap-section bg-[var(--elevated)] section-pad !py-20 border-t border-[var(--border)]">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="admin-card px-8 py-10 lg:px-12 lg:py-12"
        >
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-sm">
              <p className="eyebrow mb-3">Impacto</p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                Red ciudadana en crecimiento.
              </h2>
              <p className="mt-2 text-sm text-[var(--body)]">
                Métricas en vivo disponibles tras{' '}
                <Link to="/login" className="text-[var(--accent)] font-semibold hover:underline">
                  iniciar sesión
                </Link>
                .
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <p className="text-2xl font-bold tabular-nums text-[var(--ink)] tracking-tight">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--muted)]">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

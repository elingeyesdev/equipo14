import { motion } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import PageContainer from './ui/PageContainer'
import { FadeUp } from './ui/Animate'
import { useReports } from '../hooks/useReports'
import { useStats } from '../hooks/useStats'

export default function Stats() {
  const { reports, loading } = useReports()
  const { total, verified, verifiedPct, zones, today, byType } = useStats(reports)

  const typeNames = Object.keys(byType)
  const maxCount = Math.max(...Object.values(byType), 1)

  const stats = [
    {
      value: loading ? '...' : `${total}`,
      label: 'Alertas procesadas',
      sub: 'Total acumulado en la base de datos',
    },
    {
      value: loading ? '...' : `${today}`,
      label: 'Alertas hoy',
      sub: 'Reportes creados en el día actual',
    },
    {
      value: loading ? '...' : verifiedPct,
      label: 'Verificación',
      sub: 'Reportes confirmados por autoridades',
    },
    {
      value: loading ? '...' : `${zones}`,
      label: 'Zonas cubiertas',
      sub: 'Zonas distintas con actividad registrada',
    },
  ]

  const highlights = [
    { label: 'Reportes verificados', value: loading ? '...' : `${verified}` },
    { label: 'Zonas activas', value: loading ? '...' : `${zones}` },
    { label: 'Total reportes', value: loading ? '...' : `${total}` },
  ]

  return (
    <PageContainer>
      <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
        <div>
          <SectionHeader
            label="Métricas"
            title="Impacto medible en la comunidad"
            description="Datos reales extraídos de la base de datos en tiempo real."
          />

          <div className="grid grid-cols-2 gap-5 lg:gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="card p-6 lg:p-7"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <p className="stat-value">{s.value}</p>
                <p className="text-base lg:text-lg font-semibold text-zinc-900 mt-2">{s.label}</p>
                <p className="text-sm text-muted-readable mt-1">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {highlights.map((h) => (
              <div key={h.label} className="text-center p-4 rounded-xl bg-teal-50 border border-teal-100">
                <p className="text-xl font-bold text-teal-800">{h.value}</p>
                <p className="text-xs text-zinc-800 font-medium mt-1 leading-snug">{h.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-readable mt-4">* Datos en tiempo real desde la base de datos.</p>
        </div>

        <FadeUp>
          <div className="card p-7 lg:p-8 shadow-elevated">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-zinc-100">
              <div>
                <p className="text-lg font-bold text-zinc-900">Actividad por tipo de alerta</p>
                <p className="text-base text-muted-readable mt-1">
                  {loading ? 'Cargando...' : `${total} reportes totales · base de datos`}
                </p>
              </div>
              <span className="text-sm font-semibold text-teal-900 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg">
                {loading ? '...' : 'Operativo'}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : typeNames.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-readable">
                Sin datos disponibles
              </div>
            ) : (
              <div className="space-y-3">
                {typeNames.map((name, idx) => {
                  const count = byType[name]
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                      <div className="flex justify-between text-sm font-medium text-zinc-800 mb-1">
                        <span>{name}</span>
                        <span className="text-teal-700 font-bold">{count}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-zinc-200 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-teal-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.2 + idx * 0.05, duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-zinc-100">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">{loading ? '...' : total}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Verificados</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">{loading ? '...' : verified}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Hoy</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">{loading ? '...' : today}</p>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </PageContainer>
  )
}

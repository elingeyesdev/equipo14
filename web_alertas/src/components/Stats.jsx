import { motion } from 'framer-motion'
import IncidentFilterBar from './filters/IncidentFilterBar'
import { useReportFilters } from '../context/ReportFilterContext'
import { useStats } from '../hooks/useStats'

export default function Stats() {
  const { filteredReports, loading } = useReportFilters()
  const { total, verified, verifiedPct, zones, today, byType } = useStats(filteredReports)

  const typeNames = Object.keys(byType)
  const maxCount = Math.max(...Object.values(byType), 1)

  const statCards = [
    { value: loading ? '…' : total, label: 'Alertas filtradas', sub: 'Según filtros activos' },
    { value: loading ? '…' : today, label: 'Alertas hoy', sub: 'En el conjunto actual' },
    { value: loading ? '…' : verifiedPct, label: 'Verificación', sub: 'Confirmadas por autoridad' },
    { value: loading ? '…' : zones, label: 'Zonas cubiertas', sub: 'Con actividad registrada' },
  ]

  const highlights = [
    { label: 'Verificados', value: loading ? '…' : verified },
    { label: 'Zonas activas', value: loading ? '…' : zones },
    { label: 'Total filtrado', value: loading ? '…' : total },
  ]

  return (
    <>
      <div className="dashboard-section">
        <IncidentFilterBar />
      </div>

      <div className="metrics-grid">
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Métricas
            </p>
            <h2 className="dashboard-title">Impacto medible en la comunidad</h2>
            <p className="dashboard-description mt-2">
              Estadísticas dinámicas según tus filtros activos.
            </p>
          </div>

          <div className="metrics-stat-grid">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                className="card stat-card p-5 sm:p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04 }}
              >
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
                <span className="stat-sub">{s.sub}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            {highlights.map((h) => (
              <div key={h.label} className="highlight-pill">
                <strong>{h.value}</strong>
                <span>{h.label}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-[var(--muted)] mt-5">
            Los datos se actualizan al cambiar los filtros.
          </p>
        </section>

        <section className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6 pb-5 border-b border-[var(--border)]">
            <div>
              <h3 className="text-lg font-bold text-[var(--ink)]">Actividad por tipo</h3>
              <p className="text-sm text-[var(--body)] mt-1">
                {loading ? 'Cargando…' : `${total} reportes en vista`}
              </p>
            </div>
            <span className="text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--border)] px-3 py-1.5 rounded-lg">
              Filtrado
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-8 w-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : typeNames.length === 0 ? (
            <p className="text-center text-[var(--muted)] py-16">Sin datos para los filtros seleccionados</p>
          ) : (
            <div className="space-y-4">
              {typeNames.map((name, idx) => {
                const count = byType[name]
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm font-medium text-[var(--ink)] mb-1.5">
                      <span className="pr-4 truncate">{name}</span>
                      <span className="text-[var(--accent)] font-bold shrink-0">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[var(--accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.1 + idx * 0.04, duration: 0.45 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 pt-6 border-t border-[var(--border)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Total</p>
              <p className="text-lg font-bold text-[var(--ink)] mt-1">{loading ? '…' : total}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Verificados</p>
              <p className="text-lg font-bold text-[var(--ink)] mt-1">{loading ? '…' : verified}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Hoy</p>
              <p className="text-lg font-bold text-[var(--ink)] mt-1">{loading ? '…' : today}</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

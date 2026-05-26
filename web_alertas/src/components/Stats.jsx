import { motion } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import PageContainer from './ui/PageContainer'
import { FadeUp } from './ui/Animate'

const stats = [
  { value: '50K+', label: 'Alertas procesadas', sub: 'Desde el lanzamiento en 12 ciudades' },
  { value: '12K+', label: 'Usuarios activos', sub: 'Vecinos registrados y verificados' },
  { value: '<30s', label: 'Latencia media', sub: 'Del reporte a la notificación push' },
  { value: '99.9%', label: 'Uptime del sistema', sub: 'Canales WebSocket monitoreados 24/7' },
]

const bars = [42, 58, 48, 72, 85, 78, 65, 92, 70, 88, 55, 80]

const highlights = [
  { label: 'Reportes verificados', value: '98.4%' },
  { label: 'Zonas cubiertas', value: '47' },
  { label: 'Incidentes evitados*', value: '2.1K' },
]

export default function Stats() {
  return (
    <PageContainer>
      <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
        <div>
          <SectionHeader
            label="Métricas"
            title="Impacto medible en la comunidad"
            description="Datos reales de una plataforma construida para velocidad, confiabilidad y escala urbana."
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
          <p className="text-sm text-muted-readable mt-4">* Estimado según encuestas a usuarios activos.</p>
        </div>

        <FadeUp>
          <div className="card p-7 lg:p-8 shadow-elevated">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-zinc-100">
              <div>
                <p className="text-lg font-bold text-zinc-900">Actividad de alertas</p>
                <p className="text-base text-muted-readable mt-1">Últimas 24 horas · todos los nodos</p>
              </div>
              <span className="text-sm font-semibold text-teal-900 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg">
                Operativo
              </span>
            </div>

            <div className="flex items-end gap-2 h-48 lg:h-52">
              {bars.map((h, idx) => (
                <motion.div
                  key={idx}
                  className="flex-1 rounded-md bg-zinc-200 hover:bg-teal-600 transition-colors"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.15 + idx * 0.03, duration: 0.4 }}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-zinc-100">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Carga</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">384 req/s</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Push OK</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">99.98%</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Verificación</p>
                <p className="text-lg font-bold text-zinc-900 mt-1">98.4%</p>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </PageContainer>
  )
}

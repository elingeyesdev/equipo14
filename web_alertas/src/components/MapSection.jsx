import { motion } from 'framer-motion'
import { Activity, Clock, Layers, MapPin, Navigation, ZoomIn } from 'lucide-react'
import SectionHeader from './ui/SectionHeader'
import PageContainer from './ui/PageContainer'
import MapVisual from './ui/MapVisual'
import { FadeUp } from './ui/Animate'

const incidents = [
  { type: 'Robo reportado', location: 'Av. Libertador & Calle 14', time: '1 min', status: 'Verificado', severity: 'Alta' },
  { type: 'Accidente de tránsito', location: 'Autopista Central Km 4', time: '3 min', status: 'En curso', severity: 'Media' },
  { type: 'Incendio en sector', location: 'Residencial Norte', time: '8 min', status: 'Verificado', severity: 'Alta' },
  { type: 'Cierre vial temporal', location: 'Calle 10 entre Av. 2 y 4', time: '15 min', status: 'Informativo', severity: 'Baja' },
]

const mapFeatures = [
  { icon: Layers, title: 'Capas de incidentes', desc: 'Filtra por tipo, severidad y tiempo.' },
  { icon: Navigation, title: 'Tu ubicación', desc: 'Centrado automático con precisión GPS.' },
  { icon: ZoomIn, title: 'Zoom inteligente', desc: 'Agrupa alertas cercanas al alejar.' },
]

export default function MapSection() {
  return (
    <PageContainer>
      <SectionHeader
        label="Mapa en vivo"
        title="Centro de monitoreo urbano"
        description="Visualiza incidentes activos con precisión geográfica. Interfaz inspirada en las mejores apps de movilidad — clara, rápida y accionable."
      />

      <div className="grid sm:grid-cols-3 gap-4 lg:gap-5 mb-8 lg:mb-10">
        {mapFeatures.map((f) => (
          <div key={f.title} className="card p-6 flex items-start gap-4">
            <div className="icon-box shrink-0">
              <f.icon className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900">{f.title}</h3>
              <p className="text-sm text-body mt-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <FadeUp>
        <div className="grid lg:grid-cols-12 gap-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:p-5 shadow-soft">
          <div className="lg:col-span-8 relative min-h-[360px] lg:min-h-[520px]">
            <MapVisual className="absolute inset-0 h-full w-full rounded-xl" showControls />

            <div className="absolute top-5 left-5 z-20 label-pill label-pill-accent shadow-soft text-base">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 live-indicator" />
              4 incidentes activos en tu zona
            </div>

            <div className="absolute bottom-5 left-5 z-20 card px-4 py-3 shadow-soft flex items-center gap-3">
              <MapPin className="w-5 h-5 text-teal-700" strokeWidth={2} />
              <div>
                <p className="text-sm font-bold text-zinc-900">Zona segura</p>
                <p className="text-sm text-muted-readable">Conexión estable · GPS activo</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col card min-h-[360px]">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-teal-50/60">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Alertas recientes
              </h3>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-900 bg-teal-100 px-3 py-1 rounded-lg">
                <Activity className="w-4 h-4" strokeWidth={2} />
                En vivo
              </span>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto no-scrollbar max-h-[400px] lg:max-h-none">
              {incidents.map((inc, i) => (
                <motion.div
                  key={inc.type}
                  className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-teal-300 transition-colors"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-zinc-900">{inc.type}</p>
                      <p className="text-sm text-muted-readable truncate mt-1">{inc.location}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg">
                      {inc.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm text-zinc-700">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" strokeWidth={2} />
                      {inc.time}
                    </span>
                    <span className="font-medium">Severidad: {inc.severity}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-5 border-t border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="font-medium text-zinc-800">Cobertura en tu zona</span>
                <span className="font-bold text-teal-800 text-base">2.4 km²</span>
              </div>
              <div className="h-2.5 rounded-full bg-zinc-200 overflow-hidden">
                <div className="h-full w-[78%] rounded-full bg-teal-600" />
              </div>
              <p className="text-sm text-muted-readable mt-2">1.240 vecinos conectados en este radio</p>
            </div>
          </div>
        </div>
      </FadeUp>
    </PageContainer>
  )
}

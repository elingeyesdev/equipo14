import { motion } from 'framer-motion'
import { FileText, Map, Users, Bell, History, BarChart2, ArrowRight } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

const ease = [0.22, 1, 0.36, 1]

const features = [
  {
    icon: FileText,
    title: 'Reporte instantáneo',
    desc: 'Crea alertas en segundos. Foto, categoría, ubicación automática. Sin complicaciones.',
    gradient: 'linear-gradient(135deg, #2563eb, #06b6d4)',
    glow: 'rgba(37,99,235,0.18)',
    tag: 'iOS · Android',
    size: 'large',
  },
  {
    icon: Map,
    title: 'Mapa en tiempo real',
    desc: 'Visualización inteligente con clusters, heatmaps y alertas activas por zona.',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    glow: 'rgba(139,92,246,0.18)',
    tag: 'Mapbox',
    size: 'large',
  },
  {
    icon: Users,
    title: 'Verificación comunitaria',
    desc: 'La comunidad valida cada reporte. Información confiable, no rumores.',
    gradient: 'linear-gradient(135deg, #10b981, #06d6a0)',
    glow: 'rgba(16,185,129,0.18)',
    tag: 'Comunidad',
    size: 'normal',
  },
  {
    icon: Bell,
    title: 'Notificaciones inteligentes',
    desc: 'Alertas relevantes según tu zona y preferencias. Zero spam.',
    gradient: 'linear-gradient(135deg, #f97316, #fbbf24)',
    glow: 'rgba(249,115,22,0.18)',
    tag: 'Push',
    size: 'normal',
  },
  {
    icon: History,
    title: 'Historial urbano',
    desc: 'Accede a eventos pasados y patrones de incidentes en tu barrio.',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    glow: 'rgba(236,72,153,0.18)',
    tag: 'Analytics',
    size: 'normal',
  },
  {
    icon: BarChart2,
    title: 'Analítica ciudadana',
    desc: 'Tendencias, zonas de riesgo y datos para decisiones más inteligentes.',
    gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
    glow: 'rgba(14,165,233,0.18)',
    tag: 'Dashboard',
    size: 'normal',
  },
]

export default function PremiumBenefits() {
  return (
    <section id="beneficios" className="snap-section bg-[var(--surface)] section-pad relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-25 pointer-events-none" aria-hidden />

      <div className="container-main relative z-10">
        <SectionHeader
          eyebrow="Plataforma completa"
          title="Todo en una sola app."
          description="Seis herramientas diseñadas con precisión para que ciudadanos, organizaciones y autoridades actúen más rápido."
          className="mb-14"
        />

        {/* 2 large + 4 small grid */}
        <div className="grid gap-8">
          <div className="grid sm:grid-cols-2 gap-8">
            {features.filter(f => f.size === 'large').map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.article
                  key={feat.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease }}
                  className="group relative card-premium shimmer-overlay p-7 lg:p-8 overflow-hidden cursor-default"
                >
                  {/* Hover glow bg */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[1rem]"
                    style={{ background: `radial-gradient(circle at 30% 0%, ${feat.glow}, transparent 65%)` }} />
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[1rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: feat.gradient }} />

                  <div className="relative z-10">
                    <div className="mb-5 flex items-start justify-between">
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: feat.gradient }}>
                        <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                        {/* Icon glow */}
                        <div className="absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                          style={{ background: feat.gradient }} />
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--muted)]">{feat.tag}</span>
                    </div>
                    <h3 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">{feat.title}</h3>
                    <p className="mt-2.5 text-[14px] text-[var(--body)] leading-relaxed">{feat.desc}</p>
                    <div className="mt-5 flex items-center gap-1.5 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color: feat.gradient.includes('2563eb') ? '#2563eb' : feat.gradient.includes('8b5cf6') ? '#8b5cf6' : '#10b981' }}>
                      Ver más <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.filter(f => f.size === 'normal').map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.article
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: 0.16 + i * 0.07, ease }}
                  className="group relative card-premium shimmer-overlay p-5 overflow-hidden cursor-default"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[1rem]"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${feat.glow}, transparent 70%)` }} />
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[1rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: feat.gradient }} />

                  <div className="relative z-10">
                    <div className="mb-4 relative flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: feat.gradient }}>
                      <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-[14px] font-bold text-[var(--ink)] tracking-tight">{feat.title}</h3>
                    <p className="mt-1.5 text-[12px] text-[var(--body)] leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

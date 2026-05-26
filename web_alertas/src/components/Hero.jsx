import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Activity, Bell, ShieldCheck, TrendingUp } from 'lucide-react'
import { FadeUp } from './ui/Animate'
import PhoneMockup from './ui/PhoneMockup'
import PageContainer from './ui/PageContainer'

const metrics = [
  { label: 'Alertas hoy', value: '847', icon: Bell },
  { label: 'Tiempo medio', value: '< 30s', icon: Activity },
  { label: 'Verificación', value: '98%', icon: ShieldCheck },
]

export default function Hero() {
  return (
    <div className="page-screen mesh-subtle bg-[var(--surface)] w-full">
      <PageContainer>
        <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
          <div className="lg:pr-4 xl:pr-8">
            <FadeUp>
              <div className="label-pill label-pill-accent mb-8">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 live-indicator" />
                Seguridad ciudadana en tiempo real
              </div>
            </FadeUp>

            <FadeUp delay={0.05}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold text-zinc-900 leading-[1.05] tracking-tight max-w-2xl">
                La seguridad de tu ciudad,{' '}
                <span className="text-teal-700">al instante.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="mt-6 text-lg lg:text-xl text-body leading-relaxed max-w-xl">
                Reporta robos, accidentes e incendios. Recibe alertas en tu zona y visualiza
                incidentes en un mapa en vivo — diseñado para comunidades que se protegen juntas.
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="/descarga" className="btn-accent rounded-lg px-7 py-3.5 text-base">
                  Descargar app
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/mapa" className="btn-secondary rounded-lg px-7 py-3.5 text-base">
                  Ver mapa en vivo
                </Link>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="mt-12 pt-8 border-t border-zinc-200 grid grid-cols-3 gap-6 lg:gap-10">
                {[
                  { k: 'Flutter', v: 'App nativa iOS & Android' },
                  { k: 'Laravel', v: 'API + WebSockets' },
                  { k: 'PostGIS', v: 'Geocercas dinámicas' },
                ].map((item) => (
                  <div key={item.k}>
                    <p className="text-base lg:text-lg font-bold text-zinc-900">{item.k}</p>
                    <p className="text-sm text-muted-readable mt-1">{item.v}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          <div className="relative flex justify-center lg:justify-end min-h-[480px] lg:min-h-[560px]">
            <PhoneMockup />

            <motion.div
              className="absolute left-0 xl:-left-6 top-4 hidden sm:block w-[260px] card p-5 shadow-elevated"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  Panel en vivo
                </span>
                <span className="text-xs font-semibold text-teal-800 flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-teal-600 live-indicator" />
                  Activo
                </span>
              </div>
              <div className="space-y-3">
                {metrics.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-sm">
                    <span className="text-body flex items-center gap-2 font-medium">
                      <m.icon className="w-4 h-4 text-teal-700" strokeWidth={2} />
                      {m.label}
                    </span>
                    <span className="font-bold text-zinc-900 text-base tabular-nums">{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="absolute right-0 xl:right-4 bottom-16 hidden md:flex items-center gap-3 card px-4 py-3 shadow-elevated"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="icon-box icon-box-lg">
                <TrendingUp className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">+24% reportes</p>
                <p className="text-sm text-muted-readable">vs. semana anterior</p>
              </div>
            </motion.div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

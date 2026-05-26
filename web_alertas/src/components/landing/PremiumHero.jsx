import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import HeroDevice from './HeroDevice'

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export default function PremiumHero() {
  return (
    <section id="inicio" className="snap-section relative overflow-hidden bg-[var(--surface)]">
      <div className="hero-glow hero-glow-a" aria-hidden />
      <div className="hero-glow hero-glow-b" aria-hidden />

      <div className="container-main relative z-10 section-pad pt-28 lg:pt-32">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-[540px]">
            <motion.p
              {...fade}
              transition={{ duration: 0.5 }}
              className="eyebrow mb-5"
            >
              Seguridad ciudadana · Tiempo real
            </motion.p>

            <motion.h1
              {...fade}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-zinc-950"
            >
              Tu ciudad,{' '}
              <span className="text-gradient">siempre informada.</span>
            </motion.h1>

            <motion.p
              {...fade}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-6 text-[1.0625rem] leading-[1.75] text-zinc-500 max-w-[480px]"
            >
              Reporta incidentes, visualiza alertas en el mapa y recibe notificaciones al instante.
              Diseñado para comunidades que necesitan respuesta rápida y confiable.
            </motion.p>

            <motion.div
              {...fade}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link to="/descarga" className="btn-primary group">
                Comenzar gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/mapa" className="btn-secondary">
                Ver mapa en vivo
              </Link>
            </motion.div>

            <motion.div
              {...fade}
              transition={{ duration: 0.55, delay: 0.28 }}
              className="mt-12 flex items-center gap-8 border-t border-zinc-200/80 pt-8"
            >
              {[
                { value: '12k+', label: 'reportes' },
                { value: '98%', label: 'verificados' },
                { value: '<1s', label: 'latencia' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold tracking-tight text-zinc-900">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-400">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroDevice />
          </div>
        </div>
      </div>
    </section>
  )
}

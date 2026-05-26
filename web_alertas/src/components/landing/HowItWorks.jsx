import { motion } from 'framer-motion'
import { Smartphone, MessageSquarePlus, CheckCircle2, Radio } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

const ease = [0.22, 1, 0.36, 1]

const steps = [
  {
    number: '01',
    icon: Smartphone,
    title: 'Reporta',
    desc: 'Abre la app, selecciona la categoría y envía la alerta con foto y ubicación automática. En segundos.',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.10)',
    gradient: 'linear-gradient(135deg,#2563eb,#06b6d4)',
  },
  {
    number: '02',
    icon: MessageSquarePlus,
    title: 'La comunidad verifica',
    desc: 'Otros usuarios confirman o desmienten. El sistema pondera la confiabilidad automáticamente.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
    gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  },
  {
    number: '03',
    icon: CheckCircle2,
    title: 'El mapa se actualiza',
    desc: 'Los reportes verificados aparecen en el mapa en tiempo real. Visible para toda la ciudad.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.10)',
    gradient: 'linear-gradient(135deg,#10b981,#06d6a0)',
  },
  {
    number: '04',
    icon: Radio,
    title: 'Todos reciben la alerta',
    desc: 'Notificaciones push a ciudadanos de la zona. Respuesta colectiva rápida e inteligente.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    gradient: 'linear-gradient(135deg,#f97316,#fbbf24)',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="snap-section bg-[var(--elevated)] section-pad relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden />
      <div className="absolute inset-0 grid-dots opacity-20 pointer-events-none" aria-hidden />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] opacity-[0.04] pointer-events-none rounded-full"
        style={{ background: 'radial-gradient(ellipse, #2563eb, transparent 70%)' }} aria-hidden />

      <div className="container-main relative z-10">
        <SectionHeader
          eyebrow="Cómo funciona"
          title="Del reporte al impacto en minutos."
          description="Un flujo diseñado para que cualquier ciudadano pueda contribuir a la seguridad de su barrio en cuatro pasos simples."
          className="mb-16"
        />

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-start gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="flex items-start flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.12, duration: 0.55, ease }}
                  className="group flex-1 flex flex-col items-center text-center px-4"
                >
                  {/* Step number */}
                  <span className="text-[10px] font-bold tracking-[0.14em] text-[var(--muted)] mb-4 uppercase">{step.number}</span>

                  {/* Icon circle */}
                  <div className="relative mb-5">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                      style={{ background: step.gradient, boxShadow: `0 8px 24px ${step.color}30` }}>
                      <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>
                    {/* Pulse ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{ border: `2px solid ${step.color}` }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.75 }}
                    />
                  </div>

                  <h3 className="text-[16px] font-bold text-[var(--ink)] tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-[13px] text-[var(--body)] leading-relaxed max-w-[180px]">{step.desc}</p>
                </motion.div>

                {/* Connector */}
                {i < steps.length - 1 && (
                  <div className="flex items-center pt-12 shrink-0 w-8">
                    <div className="w-full h-px relative overflow-hidden" style={{ background: 'var(--border-strong)' }}>
                      <motion.div
                        className="absolute top-0 left-0 h-full"
                        style={{ width: '30%', background: `linear-gradient(90deg, transparent, ${steps[i].color}, transparent)` }}
                        animate={{ left: ['-30%', '130%'] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'linear' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45, ease }}
                className="flex items-start gap-4"
              >
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: step.gradient }}>
                    <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-6 bg-[var(--border-strong)]" />
                  )}
                </div>
                <div className="pt-1">
                  <span className="text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">{step.number}</span>
                  <h3 className="text-[15px] font-bold text-[var(--ink)] mt-0.5">{step.title}</h3>
                  <p className="mt-1 text-[13px] text-[var(--body)] leading-relaxed">{step.desc}</p>
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

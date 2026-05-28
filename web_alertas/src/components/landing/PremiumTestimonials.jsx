import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

const ease = [0.22, 1, 0.36, 1]

const testimonials = [
  {
    quote: 'Alertas transformó la forma en que coordinamos con la comunidad. Antes tardábamos horas en saber qué pasaba. Ahora es instantáneo y verificado.',
    name: 'Ing. Roberto Montero',
    role: 'Director de Seguridad',
    org: 'Municipio SCZ',
    initials: 'RM',
    gradient: 'linear-gradient(135deg, #2563eb, #06b6d4)',
    stars: 5,
  },
  {
    quote: 'Como vecina del barrio Equipetrol, esta app me da tranquilidad real. Los reportes llegan rápido y la comunidad responde. Es exactamente lo que necesitábamos.',
    name: 'María Flores',
    role: 'Presidenta Junta Vecinal',
    org: 'Vecinos Unidos',
    initials: 'MF',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    stars: 5,
  },
  {
    quote: 'Los datos que genera Alertas son invaluables para nuestra analítica urbana. Calidad de datos superior a cualquier otra fuente que hemos probado.',
    name: 'Dr. Carlos Gutiérrez',
    role: 'Investigador Urbano',
    org: 'TechBolivia',
    initials: 'CG',
    gradient: 'linear-gradient(135deg, #10b981, #06d6a0)',
    stars: 5,
  },
]

export default function PremiumTestimonials() {
  return (
    <section id="testimonios" className="snap-section bg-[var(--elevated)] section-pad relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden />

      {/* Background glow */}
      <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} aria-hidden />

      <div className="container-main relative z-10">
        <SectionHeader
          eyebrow="Testimonios"
          title="Lo que dice nuestra comunidad."
          description="Personas reales, resultados reales. La plataforma que ciudadanos y organizaciones ya confían."
          className="mb-14"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, duration: 0.5, ease }}
              className="group relative card-premium shimmer-overlay flex flex-col p-8 lg:p-9 overflow-hidden min-h-[300px]"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[1rem] opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: t.gradient }} />

              {/* Quote bg */}
              <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none">
                <Quote className="h-24 w-24 text-[var(--ink)]" strokeWidth={1} />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" strokeWidth={0} />
                ))}
              </div>

              <p className="text-[15.5px] text-[var(--body)] leading-relaxed flex-1 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </p>

              <footer className="mt-6 pt-5 border-t border-[var(--border)] flex items-center gap-3.5">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
                  style={{ background: t.gradient }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[var(--ink)] tracking-tight">{t.name}</p>
                  <p className="text-[11.5px] text-[var(--muted)] mt-0.5">{t.role} · <span className="font-semibold text-[var(--body)]">{t.org}</span></p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 section-divider" aria-hidden />
    </section>
  )
}

import { motion } from 'framer-motion'
import SectionHeader from './shared/SectionHeader'

const testimonials = [
  {
    quote:
      'Recibí la alerta de un accidente antes de llegar. Evité una zona congestionada sin perder tiempo.',
    name: 'María G.',
    role: 'Conductora',
  },
  {
    quote:
      'Reportar incendios y robos es directo. La app se siente seria y confiable, no como un prototipo.',
    name: 'Carlos R.',
    role: 'Vecino verificado',
  },
  {
    quote:
      'El mapa en vivo nos ayuda a coordinar con datos reales. Interfaz clara y profesional.',
    name: 'Ana L.',
    role: 'Coordinación comunitaria',
  },
]

export default function PremiumTestimonials() {
  return (
    <section id="testimonios" className="snap-section bg-[var(--surface)] section-pad">
      <div className="container-main">
        <SectionHeader
          eyebrow="Comunidad"
          title="Confianza construida en la calle."
          description="Ciudadanos y organizaciones que ya dependen de Alertas cada día."
          className="mb-12"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="card-premium flex flex-col p-6"
            >
              <p className="text-[15px] text-zinc-600 leading-[1.7] flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-5 pt-4 border-t border-zinc-100">
                <p className="text-sm font-semibold text-zinc-950">{t.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{t.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Database, Radio, Server, Smartphone } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

const stack = [
  { icon: Smartphone, name: 'Flutter App', desc: 'Cliente móvil nativo' },
  { icon: Server, name: 'Laravel API', desc: 'Core de negocio y auth' },
  { icon: Radio, name: 'WebSockets', desc: 'Distribución en tiempo real' },
  { icon: Database, name: 'PostgreSQL', desc: 'Persistencia geoespacial' },
]

export default function PremiumTech() {
  return (
    <section id="tecnologia" className="snap-section bg-[var(--elevated)] section-pad border-y border-[var(--border)]">
      <div className="container-main max-w-3xl">
        <SectionHeader
          eyebrow="Arquitectura"
          title="Infraestructura que escala contigo."
          description="Flujo de datos claro desde el dispositivo hasta la base de datos."
          className="mb-14"
        />

        <div className="space-y-0">
          {stack.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              <div className="flex items-center gap-5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-5 py-4 transition-colors hover:bg-white hover:border-zinc-200 hover:shadow-premium">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white border border-zinc-200/80">
                  <item.icon className="h-5 w-5 text-zinc-700" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">{item.name}</h3>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </div>
              </div>
              {i < stack.length - 1 && (
                <div className="flex justify-center py-1" aria-hidden>
                  <div className="h-6 w-px bg-zinc-200" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

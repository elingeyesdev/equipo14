import { motion } from 'framer-motion'
import { BellRing, MapPinned, ShieldCheck, Zap } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

const features = [
  {
    icon: Zap,
    title: 'Alertas instantáneas',
    desc: 'WebSockets de baja latencia para entregar cada incidente en el momento exacto.',
  },
  {
    icon: ShieldCheck,
    title: 'Red verificada',
    desc: 'Validación comunitaria que reduce reportes falsos y mejora la confianza.',
  },
  {
    icon: MapPinned,
    title: 'Mapa en vivo',
    desc: 'Visualización urbana con geofencing y pins precisos en tiempo real.',
  },
  {
    icon: BellRing,
    title: 'Notificaciones críticas',
    desc: 'Push prioritario en móvil para emergencias que no pueden esperar.',
  },
]

export default function PremiumBenefits() {
  return (
    <section id="beneficios" className="snap-section bg-[var(--elevated)] section-pad">
      <div className="container-main">
        <SectionHeader
          eyebrow="Producto"
          title="Todo lo esencial para proteger tu entorno."
          description="Herramientas de monitoreo urbano con la claridad y el rigor de un producto SaaS enterprise."
          className="mb-14 lg:mb-16"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feat, i) => (
            <motion.article
              key={feat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="card-premium group p-6 lg:p-7"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
                <feat.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-[17px] font-bold text-zinc-950 tracking-tight">{feat.title}</h3>
              <p className="mt-2 text-[15px] text-zinc-500 leading-relaxed">{feat.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

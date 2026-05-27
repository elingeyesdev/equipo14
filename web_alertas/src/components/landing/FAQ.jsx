import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

const ease = [0.22, 1, 0.36, 1]

const faqs = [
  {
    q: '¿Alertas es completamente gratuito?',
    a: 'Sí. La aplicación es gratuita para todos los ciudadanos. Puedes reportar, ver el mapa y recibir notificaciones sin ningún costo. Las funciones avanzadas para organizaciones y municipios tienen planes especiales.',
  },
  {
    q: '¿Cómo se verifica que un reporte sea verdadero?',
    a: 'Utilizamos un sistema de validación comunitaria: cuando varios usuarios independientes confirman el mismo incidente, el sistema lo marca como "Verificado". Además, el algoritmo detecta patrones de spam y reportes duplicados automáticamente.',
  },
  {
    q: '¿Mis datos personales están seguros?',
    a: 'Absolutamente. Los reportes son anónimos por defecto. No compartimos tu información con terceros. Toda la comunicación usa cifrado TLS y cumplimos con estándares internacionales de privacidad de datos.',
  },
  {
    q: '¿En qué ciudades está disponible?',
    a: 'Actualmente operamos en Santa Cruz de la Sierra con más de 50 barrios conectados. La expansión a otras ciudades bolivianas está planificada para el próximo trimestre. ¿Tu ciudad no está? Contáctanos.',
  },
  {
    q: '¿Puedo reportar incidentes sin conexión?',
    a: 'Sí. La app guarda los reportes como borradores cuando estás sin conexión y los envía automáticamente cuando recuperas señal. No perderás ningún reporte importante.',
  },
  {
    q: '¿Cómo se integra con autoridades y municipios?',
    a: 'Ofrecemos un panel de administración web con acceso por roles. Las autoridades tienen vista completa del mapa, analítica avanzada, exportación de datos y capacidad de responder reportes directamente en la plataforma.',
  },
  {
    q: '¿Qué categorías de alertas soporta la app?',
    a: 'Actualmente soportamos: Robo/Hurto, Accidente vial, Emergencia médica, Tráfico, Incendio, Persona sospechosa, Corte de servicio, y Otros. Continuamente añadimos categorías según la demanda de la comunidad.',
  },
]

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className={`text-[15px] font-semibold leading-snug transition-colors duration-200 ${isOpen ? 'text-[var(--accent)]' : 'text-[var(--ink)] group-hover:text-[var(--accent)]'}`}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease }}
          className="shrink-0 mt-0.5"
        >
          <ChevronDown className={`h-5 w-5 transition-colors ${isOpen ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} strokeWidth={2} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            style={{ overflow: 'hidden' }}
          >
            <p className="pb-5 text-[14px] text-[var(--body)] leading-[1.8] max-w-2xl">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section id="faq" className="bg-[var(--surface)] py-20 lg:py-24 relative overflow-hidden">
      <div className="container-main max-w-3xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Preguntas frecuentes."
          description="Todo lo que necesitas saber antes de empezar."
          className="mb-12"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="admin-card px-6 lg:px-8"
        >
          {faqs.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

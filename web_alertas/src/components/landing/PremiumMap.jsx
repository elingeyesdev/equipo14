import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, MapPin } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

export default function PremiumMap() {
  return (
    <section id="mapa-live" className="snap-section bg-[var(--surface)] section-pad">
      <div className="container-main">
        <SectionHeader
          align="left"
          eyebrow="Mapa en tiempo real"
          title="Centro de comando urbano."
          description="Inicia sesión para ver alertas agrupadas por zona en el mapa interactivo."
          className="!max-w-lg mb-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="admin-card overflow-hidden"
        >
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 lg:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[var(--border)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] mb-5">
                <Lock className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight">
                Acceso con tu cuenta
              </h3>
              <p className="mt-3 text-[var(--body)] leading-relaxed text-sm">
                El mapa y las zonas activas están disponibles después del inicio de sesión.
                Las cuentas de autoridad acceden además al panel admin y exportación de reportes.
              </p>
              <Link to="/login" className="btn-primary mt-6 w-fit group">
                Iniciar sesión
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="relative h-[280px] lg:h-[320px] bg-[var(--surface-hover)] flex items-center justify-center">
              <div className="text-center px-6">
                <MapPin className="h-10 w-10 text-[var(--muted)] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-[var(--ink)]">Vista previa del mapa</p>
                <p className="text-xs text-[var(--muted)] mt-1">Santa Cruz y zonas de alerta</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

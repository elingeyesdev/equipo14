import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function PremiumCTA() {
  return (
    <footer className="snap-section bg-zinc-950 text-white min-h-[45vh] flex items-center">
      <div className="container-main py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white max-w-md mx-auto leading-[1.1]">
            Tu ciudad más segura empieza hoy.
          </h2>
          <p className="mt-4 text-zinc-400 text-base max-w-sm mx-auto leading-relaxed">
            Únete a la red de alertas ciudadanas. Gratis y listo para usar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/descarga" className="btn-accent group">
              Descargar aplicación
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/mapa"
              className="inline-flex h-11 items-center justify-center rounded-[0.625rem] border border-zinc-700 px-5 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Ver mapa en vivo
            </Link>
          </div>
          <p className="mt-14 text-xs text-zinc-600">
            © {new Date().getFullYear()} Alertas. Todos los derechos reservados.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { CTA_PATH, NAV_ITEMS } from '../config/navigation'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-base font-semibold text-zinc-900">Alertas</span>
            </Link>
            <p className="text-base text-body max-w-[260px] leading-relaxed">
              Plataforma de seguridad ciudadana y monitoreo urbano en tiempo real.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-4">Secciones</h4>
            <ul className="space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-base text-body hover:text-teal-800 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={CTA_PATH} className="text-base text-body hover:text-teal-800 transition-colors">
                  Descargar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-4">Legal</h4>
            <ul className="space-y-3">
              {['Privacidad', 'Términos', 'Contacto'].map((item) => (
                <li key={item}>
                  <span className="text-base text-muted-readable">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row justify-between gap-4 text-base text-muted-readable">
          <p>© {new Date().getFullYear()} Alertas. Todos los derechos reservados.</p>
          <p className="text-teal-800 font-semibold">Hecho para ciudades más seguras.</p>
        </div>
      </div>
    </footer>
  )
}

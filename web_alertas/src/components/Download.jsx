import { Link } from 'react-router-dom'
import { ArrowRight, Check, MapPin, ShieldCheck } from 'lucide-react'
import PageContainer from './ui/PageContainer'
import { FadeUp } from './ui/Animate'

const features = [
  'Reportes ilimitados en tu zona',
  'Mapa en vivo sin costo',
  'Notificaciones push instantáneas',
  'Modo offline para borradores',
  'Privacidad de ubicación protegida',
  'Soporte comunitario 24/7',
]

export default function DownloadSection() {
  return (
    <PageContainer>
      <div className="rounded-3xl border border-zinc-700 bg-zinc-800/80 p-10 lg:p-14">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <FadeUp>
            <div className="label-pill label-pill-light mb-6 text-base">
              Disponible en iOS y Android
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight">
              Descarga Alertas y protege tu comunidad
            </h2>
            <p className="mt-5 text-lg lg:text-xl text-zinc-300 leading-relaxed max-w-lg">
              Únete a más de 12.000 ciudadanos que reportan y previenen incidentes urbanos en tiempo real. Gratis, sin publicidad intrusiva.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#app-store"
                className="inline-flex items-center gap-4 px-6 py-4 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.05-1.77-.76-3.29-.76s-1.94.73-3.21.72c-1.21.05-2.2-1.32-3.04-2.53-1.71-2.47-3.02-7-1.26-10.08.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.19 3.81.02 3.02 2.62 4.03 2.66 4.04-.03.07-.44 1.44-1.3 2.83M15.97 4.17c.65-.8 1.07-1.9.95-3.17-1.04.04-2.3.6-3.05 1.38-.68.66-1.28 1.76-1.13 3.01 1.05.08 2.05-.51 2.23-1.22z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-zinc-500">Descargar en</p>
                  <p className="text-base font-bold">App Store</p>
                </div>
              </a>
              <a
                href="#google-play"
                className="btn-accent rounded-xl px-6 py-4 gap-4"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M3 20.5V3.5L16.55 12 3 20.5M17.87 11.33L19.5 12.15 17.87 12.97 16.82 12.44 17.87 11.33M3 3.15L17.15 10.22 16 11.37 3 3.15M3 20.85L16 12.63 17.15 13.78 3 20.85Z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs opacity-90">Disponible en</p>
                  <p className="text-base font-bold">Google Play</p>
                </div>
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-700 p-8 lg:p-9">
              <h3 className="text-xl font-semibold text-white mb-6">Incluye en la app</h3>
              <ul className="space-y-4">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-base text-zinc-200">
                    <Check className="w-5 h-5 text-teal-400 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-zinc-700 flex flex-wrap gap-6 text-sm text-zinc-300">
                <span className="inline-flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-5 h-5 text-teal-400" strokeWidth={2} />
                  Privacidad protegida
                </span>
                <span className="inline-flex items-center gap-2 font-medium">
                  <MapPin className="w-5 h-5 text-zinc-400" strokeWidth={2} />
                  Geo automática
                </span>
              </div>

              <Link
                to="/mapa"
                className="mt-8 group inline-flex items-center gap-2 text-teal-400 font-semibold text-base hover:text-teal-300 transition-colors"
              >
                Ver mapa en vivo antes de descargar
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </PageContainer>
  )
}

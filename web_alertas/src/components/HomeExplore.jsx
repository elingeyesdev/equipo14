import { Link } from 'react-router-dom'
import { ArrowRight, Bell, Map, Radio, Shield } from 'lucide-react'
import PageContainer from './ui/PageContainer'
import { FadeUp } from './ui/Animate'

const exploreLinks = [
  {
    to: '/producto',
    icon: Shield,
    title: 'Producto',
    desc: 'Alertas instantáneas, geocercas y red comunitaria verificada.',
  },
  {
    to: '/como-funciona',
    icon: Radio,
    title: 'Cómo funciona',
    desc: 'Del reporte a la notificación push en menos de 30 segundos.',
  },
  {
    to: '/mapa',
    icon: Map,
    title: 'Mapa en vivo',
    desc: 'Monitorea incidentes urbanos con precisión geográfica.',
  },
  {
    to: '/metricas',
    icon: Bell,
    title: 'Métricas',
    desc: 'Impacto real: usuarios, latencia y disponibilidad del sistema.',
  },
]

export default function HomeExplore() {
  return (
    <section className="w-full bg-white border-t border-zinc-200 py-16 lg:py-24">
      <PageContainer>
        <FadeUp>
          <h2 className="text-2xl lg:text-3xl font-semibold text-zinc-900 tracking-tight">
            Explora la plataforma
          </h2>
          <p className="mt-3 text-lg text-body max-w-2xl">
            Cada sección tiene su propia pantalla con información detallada sobre Alertas.
          </p>
        </FadeUp>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {exploreLinks.map((item, i) => (
            <FadeUp key={item.to} delay={0.05 * i}>
              <Link
                to={item.to}
                className="card-interactive p-6 lg:p-7 h-full flex flex-col group"
              >
                <div className="icon-box icon-box-lg mb-5">
                  <item.icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{item.title}</h3>
                <p className="text-base text-body flex-1">{item.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 group-hover:gap-2.5 transition-all">
                  Ver más
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </PageContainer>
    </section>
  )
}

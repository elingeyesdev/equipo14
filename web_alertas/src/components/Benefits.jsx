import { Bell, Car, Flame, MapPin, Radio, Shield, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeader from './ui/SectionHeader'
import PageContainer from './ui/PageContainer'
import { FadeUp, Stagger, StaggerItem } from './ui/Animate'

const benefits = [
  {
    icon: Bell,
    title: 'Alertas instantáneas',
    description:
      'Broadcasting por WebSockets a todos los dispositivos en tu geocerca. El 98% de las alertas llegan en menos de 30 segundos desde el reporte.',
    bullets: ['Push nativo iOS y Android', 'Priorización por severidad', 'Historial de alertas en la app'],
  },
  {
    icon: Users,
    title: 'Red comunitaria',
    description:
      'Vecinos verifican y corroboran incidentes. La información colectiva reduce falsas alarmas y mejora la confianza en cada reporte.',
    bullets: ['Votación de veracidad', 'Perfiles de vecinos verificados', 'Rankings de colaboración'],
  },
  {
    icon: MapPin,
    title: 'Geocercas inteligentes',
    description:
      'Solo recibes notificaciones relevantes según tu ubicación, velocidad y trayecto. PostGIS calcula radios dinámicos en milisegundos.',
    bullets: ['Radio ajustable por usuario', 'Modo trayecto activo', 'Zonas seguras personalizadas'],
  },
  {
    icon: Radio,
    title: 'Infraestructura sólida',
    description:
      'Flutter, Laravel, Redis y PostgreSQL — stack probado para alta concurrencia y disponibilidad continua del servicio.',
    bullets: ['99.9% uptime garantizado', 'Colas asíncronas Redis', 'Escalado horizontal'],
  },
]

const incidentTypes = [
  { icon: Shield, label: 'Robos y hurto' },
  { icon: Car, label: 'Accidentes y choques' },
  { icon: Flame, label: 'Incendios' },
  { icon: Bell, label: 'Emergencias urbanas' },
]

export default function Benefits() {
  return (
    <PageContainer>
      <SectionHeader
        label="Producto"
        title="Prevención urbana, diseñada para escalar"
        description="Cuatro pilares que convierten reportes ciudadanos en inteligencia accionable. Alertas no es solo una app — es una red de seguridad colaborativa."
      />

      <Stagger className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {benefits.map((b) => (
          <StaggerItem key={b.title}>
            <article className="card-interactive p-8 lg:p-9 h-full flex flex-col border-l-4 border-l-teal-600">
              <div className="icon-box icon-box-lg mb-5">
                <b.icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-zinc-900 mb-3">{b.title}</h3>
              <p className="text-base lg:text-lg text-body leading-relaxed">{b.description}</p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {b.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-base text-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2.5 shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="section-divider" />

      <FadeUp>
        <h3 className="text-2xl lg:text-3xl font-semibold text-zinc-900 mb-3">
          Tipos de incidentes que puedes reportar
        </h3>
        <p className="text-lg text-body max-w-3xl mb-8">
          Categorías predefinidas con iconografía clara para que cualquier vecino pueda reportar en segundos, sin formularios largos.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {incidentTypes.map((t) => (
            <div key={t.label} className="card p-6 lg:p-7 text-center">
              <div className="icon-box icon-box-lg mx-auto mb-4">
                <t.icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <p className="text-base font-semibold text-zinc-900">{t.label}</p>
            </div>
          ))}
        </div>
      </FadeUp>

      <FadeUp delay={0.1} className="mt-12 card p-8 lg:p-10 bg-teal-50 border-teal-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h3 className="text-xl lg:text-2xl font-semibold text-zinc-900">
            ¿Listo para proteger tu barrio?
          </h3>
          <p className="mt-2 text-base lg:text-lg text-body max-w-xl">
            Descarga la app y únete a más de 12.000 vecinos que ya reportan y previenen incidentes.
          </p>
        </div>
        <Link to="/descarga" className="btn-accent rounded-lg px-8 py-3.5 shrink-0 self-start lg:self-center">
          Descargar gratis
        </Link>
      </FadeUp>
    </PageContainer>
  )
}

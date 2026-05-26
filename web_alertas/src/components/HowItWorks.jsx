import { AlertCircle, CheckCircle2, Radio, Share2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeader from './ui/SectionHeader'
import PageContainer from './ui/PageContainer'
import { FadeUp, Stagger, StaggerItem } from './ui/Animate'

const steps = [
  {
    step: '01',
    icon: AlertCircle,
    title: 'Reporta el incidente',
    description: 'Abre la app, selecciona categoría y confirma. Toma menos de 15 segundos en promedio.',
    details: ['Robo, accidente, incendio o choque', 'Foto opcional como evidencia', 'Reporte anónimo disponible'],
  },
  {
    step: '02',
    icon: Share2,
    title: 'Geolocalización precisa',
    description: 'El GPS fija coordenadas exactas. PostGIS valida que el punto esté en zona urbana activa.',
    details: ['Precisión menor a 10 metros', 'Corrección manual del pin', 'Dirección aproximada automática'],
  },
  {
    step: '03',
    icon: Radio,
    title: 'Difusión WebSocket',
    description: 'Laravel encola el evento y Reverb lo transmite a todos los canales de la geocerca afectada.',
    details: ['Procesamiento asíncrono', 'Sin bloqueo del servidor', 'Reintentos automáticos'],
  },
  {
    step: '04',
    icon: ShieldCheck,
    title: 'Alerta comunitaria',
    description: 'Vecinos reciben push instantáneo. Pueden confirmar, evitar la zona o contactar autoridades.',
    details: ['Notificación push + in-app', 'Mapa actualizado en vivo', 'Estado: verificado / en curso'],
  },
]

const guarantees = [
  'Cifrado TLS en tránsito y reposo',
  'Moderación comunitaria de reportes',
  'Sin venta de datos de ubicación',
  'Cumplimiento de privacidad local',
]

export default function HowItWorks() {
  return (
    <PageContainer>
      <SectionHeader
        label="Flujo"
        title="De reporte a notificación en cuatro pasos"
        description="Un pipeline optimizado para velocidad extrema, sin comprometer la precisión geográfica ni la privacidad del usuario."
      />

      <Stagger className="grid sm:grid-cols-2 gap-6 lg:gap-8 xl:gap-10">
          {steps.map((s) => (
            <StaggerItem key={s.step}>
              <article className="card p-8 lg:p-9 h-full bg-white relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="icon-box icon-box-lg">
                    <s.icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <span className="text-3xl font-bold text-zinc-200 tabular-nums">{s.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">{s.title}</h3>
                <p className="text-base lg:text-lg text-body leading-relaxed mb-5">{s.description}</p>
                <ul className="space-y-2">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-base text-zinc-800">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" strokeWidth={2} />
                      {d}
                    </li>
                  ))}
                </ul>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

      <div className="section-divider" />

      <FadeUp>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h3 className="text-2xl lg:text-3xl font-semibold text-zinc-900 mb-4">
              Seguridad y confianza en cada paso
            </h3>
            <p className="text-lg text-body leading-relaxed">
              Diseñamos Alertas para que la información sensible de ubicación esté protegida y solo se comparta con quienes necesitan saberlo en el momento justo.
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {guarantees.map((g) => (
              <li key={g} className="card p-5 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
                <span className="text-base font-medium text-zinc-900">{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </FadeUp>

      <FadeUp delay={0.1} className="mt-12 text-center">
        <Link to="/mapa" className="btn-secondary rounded-lg px-8 py-3.5 text-base inline-flex">
          Ver el mapa en acción
        </Link>
      </FadeUp>
    </PageContainer>
  )
}

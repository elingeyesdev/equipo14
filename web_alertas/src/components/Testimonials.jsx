import SectionHeader from './ui/SectionHeader'
import PageContainer from './ui/PageContainer'
import { FadeUp, Stagger, StaggerItem } from './ui/Animate'

const reviews = [
  {
    name: 'Carlos Mendoza',
    role: 'Líder vecinal · Barrio Norte',
    text: 'Desde que implementamos Alertas en nuestra junta, la organización y prevención mejoraron notablemente. Las notificaciones push llegan al instante y los vecinos confían en la información.',
    initials: 'CM',
  },
  {
    name: 'Sofía Valenzuela',
    role: 'Comerciante · Centro',
    text: 'Recibí una alerta de un siniestro vial a dos cuadras y pude cerrar el local a tiempo. La geolocalización es sumamente precisa y la app es muy fácil de usar.',
    initials: 'SV',
  },
  {
    name: 'Diego Rincón',
    role: 'Conductor de reparto',
    text: 'Es mi herramienta diaria para evitar zonas con accidentes o robos. El mapa en vivo me ahorra tiempo y me hace sentir más seguro en la ruta.',
    initials: 'DR',
  },
  {
    name: 'María López',
    role: 'Madre de familia',
    text: 'Me tranquiliza saber qué pasa cerca del colegio de mis hijos. Reportar un incidente toma segundos y la comunidad responde rápido.',
    initials: 'ML',
  },
  {
    name: 'Andrés Vega',
    role: 'Guardia de seguridad',
    text: 'Coordino con otros vigilantes usando las alertas verificadas. Reducimos el tiempo de respuesta ante emergencias en un 40%.',
    initials: 'AV',
  },
  {
    name: 'Laura Paredes',
    role: 'Estudiante universitaria',
    text: 'Caminar de noche era estresante. Ahora recibo avisos de zonas a evitar y puedo compartir mi ubicación con amigos cuando lo necesito.',
    initials: 'LP',
  },
]

export default function Testimonials() {
  return (
    <PageContainer>
      <SectionHeader
        label="Comunidad"
        title="Respaldado por ciudadanos reales"
        description="Miles de vecinos, comerciantes y conductores usan Alertas cada día para proteger su entorno urbano."
      />

      <FadeUp className="card p-8 lg:p-10 bg-teal-50 border-teal-200 mb-10 lg:mb-12 text-center max-w-4xl mx-auto">
        <p className="text-2xl lg:text-3xl font-semibold text-zinc-900 leading-snug">
          &ldquo;La información correcta, en el momento correcto, salva trayectos y vidas.&rdquo;
        </p>
        <p className="mt-4 text-base text-body">— Equipo Alertas</p>
      </FadeUp>

      <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
        {reviews.map((r) => (
          <StaggerItem key={r.name}>
            <article className="card-interactive p-7 lg:p-8 h-full flex flex-col">
              <p className="text-base lg:text-lg text-body leading-relaxed flex-1">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-4 mt-6 pt-5 border-t border-zinc-100">
                <div className="w-12 h-12 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-sm font-bold text-teal-900">
                  {r.initials}
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-900">{r.name}</p>
                  <p className="text-sm text-muted-readable">{r.role}</p>
                </div>
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </PageContainer>
  )
}

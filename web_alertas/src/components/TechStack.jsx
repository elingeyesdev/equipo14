import { ArrowRight, Database, Lock, Radio, Server, Smartphone, Zap } from 'lucide-react'
import SectionHeader from './ui/SectionHeader'
import PageContainer from './ui/PageContainer'
import { FadeUp, Stagger, StaggerItem } from './ui/Animate'

const stack = [
  {
    icon: Smartphone,
    layer: 'Cliente',
    name: 'Flutter App',
    tech: 'Dart · iOS & Android',
    desc: 'Código nativo de alto rendimiento. Geolocalización en background, gestión de estados optimizada y UI fluida a 60fps.',
  },
  {
    icon: Server,
    layer: 'API',
    name: 'Laravel API',
    tech: 'REST · Sanctum · Redis',
    desc: 'Arquitectura limpia con Repository pattern. Middleware de seguridad, rate limiting estricto y colas asíncronas.',
  },
  {
    icon: Radio,
    layer: 'Tiempo real',
    name: 'WebSockets',
    tech: 'Laravel Reverb',
    desc: 'Broadcasting instantáneo de alertas a geocercas activas. Eventos procesados sin bloquear el hilo principal.',
  },
  {
    icon: Database,
    layer: 'Datos',
    name: 'PostgreSQL',
    tech: 'PostGIS',
    desc: 'Almacenamiento espacial estructurado. Consultas geográficas optimizadas bajo miles de peticiones concurrentes.',
  },
]

const security = [
  { icon: Lock, title: 'Autenticación Sanctum', desc: 'Tokens seguros por dispositivo.' },
  { icon: Zap, title: 'Rate limiting', desc: 'Protección contra abuso de API.' },
  { icon: Database, title: 'Backups diarios', desc: 'Recuperación ante desastres.' },
]

export default function TechStack() {
  return (
    <PageContainer>
      <SectionHeader
        label="Arquitectura"
        title="Stack diseñado para confiabilidad"
        description="De la app móvil a la base de datos geoespacial — infraestructura enterprise que escala con tu ciudad."
        dark
      />

      <Stagger className="grid sm:grid-cols-2 gap-6 lg:gap-8 relative">
        {stack.map((item, i) => (
          <StaggerItem key={item.name} className="relative">
            <article className="p-8 lg:p-9 h-full rounded-2xl bg-zinc-800 border border-zinc-600 hover:border-zinc-500 transition-colors">
              <div className="w-14 h-14 rounded-xl mb-5 flex items-center justify-center bg-teal-500/15 border border-teal-400/30 text-teal-300">
                <item.icon className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-bold text-zinc-300 uppercase tracking-wide mb-2">{item.layer}</p>
              <h3 className="text-2xl font-semibold text-white mb-1">{item.name}</h3>
              <p className="text-base font-medium text-teal-300">{item.tech}</p>
              <p className="text-base text-zinc-200 mt-4 leading-relaxed">{item.desc}</p>
            </article>

            {i < stack.length - 1 && i % 2 === 0 && (
              <div className="hidden lg:flex absolute top-1/2 -right-4 z-10 w-8 h-8 rounded-full bg-zinc-700 border border-zinc-500 items-center justify-center">
                <ArrowRight className="w-4 h-4 text-zinc-200" strokeWidth={1.5} />
              </div>
            )}
          </StaggerItem>
        ))}
      </Stagger>

      <div className="section-divider border-zinc-600" />

      <FadeUp>
        <h3 className="text-2xl lg:text-3xl font-semibold text-white mb-6">Seguridad y rendimiento</h3>
        <div className="grid sm:grid-cols-3 gap-5">
          {security.map((s) => (
            <div key={s.title} className="rounded-xl bg-zinc-800 border border-zinc-600 p-6 lg:p-7">
              <s.icon className="w-7 h-7 text-teal-300 mb-4" strokeWidth={1.75} />
              <h4 className="text-lg font-semibold text-white">{s.title}</h4>
              <p className="text-base text-zinc-200 mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </FadeUp>
    </PageContainer>
  )
}

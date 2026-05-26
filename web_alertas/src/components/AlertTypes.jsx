import { motion } from 'framer-motion'
import { ShieldAlert, Briefcase, Flame, Car, Siren, AlertTriangle } from 'lucide-react'

const alertTypes = [
  {
    id: 'alerta-robo',
    icon: <ShieldAlert className="w-8 h-8" />,
    label: 'Robos',
    description: 'Robo a mano armada, asalto, sustracción violenta',
    color: 'text-red-400',
    bg: 'from-red-900/30 to-red-950/10',
    border: 'border-red-500/20',
    hoverBorder: 'hover:border-red-500/60',
    glow: 'rgba(239,68,68,0.2)',
    badge: 'bg-red-500/20 text-red-300',
    count: '3.2K reportes',
  },
  {
    id: 'alerta-hurto',
    icon: <Briefcase className="w-8 h-8" />,
    label: 'Hurtos',
    description: 'Carterismo, sustracción sin violencia, robo de celular',
    color: 'text-orange-400',
    bg: 'from-orange-900/30 to-orange-950/10',
    border: 'border-orange-500/20',
    hoverBorder: 'hover:border-orange-500/60',
    glow: 'rgba(249,115,22,0.2)',
    badge: 'bg-orange-500/20 text-orange-300',
    count: '5.1K reportes',
  },
  {
    id: 'alerta-incendio',
    icon: <Flame className="w-8 h-8" />,
    label: 'Incendios',
    description: 'Incendio vehicular, estructural, forestal o industrial',
    color: 'text-amber-400',
    bg: 'from-amber-900/30 to-amber-950/10',
    border: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-500/60',
    glow: 'rgba(245,158,11,0.2)',
    badge: 'bg-amber-500/20 text-amber-300',
    count: '820 reportes',
  },
  {
    id: 'alerta-accidente',
    icon: <Car className="w-8 h-8" />,
    label: 'Accidentes',
    description: 'Accidentes de tránsito con lesionados o daños materiales',
    color: 'text-yellow-400',
    bg: 'from-yellow-900/30 to-yellow-950/10',
    border: 'border-yellow-500/20',
    hoverBorder: 'hover:border-yellow-500/60',
    glow: 'rgba(234,179,8,0.2)',
    badge: 'bg-yellow-500/20 text-yellow-300',
    count: '2.4K reportes',
  },
  {
    id: 'alerta-choque',
    icon: <AlertTriangle className="w-8 h-8" />,
    label: 'Choques',
    description: 'Colisiones vehiculares, atropellos, choque con infraestructura',
    color: 'text-lime-400',
    bg: 'from-lime-900/30 to-lime-950/10',
    border: 'border-lime-500/20',
    hoverBorder: 'hover:border-lime-500/60',
    glow: 'rgba(132,204,22,0.2)',
    badge: 'bg-lime-500/20 text-lime-300',
    count: '1.8K reportes',
  },
  {
    id: 'alerta-emergencia',
    icon: <Siren className="w-8 h-8" />,
    label: 'Emergencias Urbanas',
    description: 'Derrumbes, explosiones, corte de suministros, disturbios',
    color: 'text-purple-400',
    bg: 'from-purple-900/30 to-purple-950/10',
    border: 'border-purple-500/20',
    hoverBorder: 'hover:border-purple-500/60',
    glow: 'rgba(168,85,247,0.2)',
    badge: 'bg-purple-500/20 text-purple-300',
    count: '960 reportes',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}
const item = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5 } },
}

export default function AlertTypes() {
  return (
    <section id="alertas" className="relative py-28 bg-[#0d1117] overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5 border border-red-500/20">
            <span className="w-2 h-2 bg-red-500 rounded-full live-dot" />
            <span className="text-xs font-medium text-red-300 uppercase tracking-widest">Tipos de alertas activas</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-5">
            Reporta cualquier{' '}
            <span className="gradient-text">emergencia</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Categoriza y reporta incidentes de forma rápida para que la información
            llegue a las personas correctas en el momento correcto.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {alertTypes.map(type => (
            <motion.div
              key={type.id}
              id={type.id}
              variants={item}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-2xl p-6 border ${type.border} ${type.hoverBorder} bg-gradient-to-br ${type.bg} cursor-default group transition-all duration-300 overflow-hidden`}
              style={{ '--glow': type.glow }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                style={{ boxShadow: `inset 0 0 40px ${type.glow}` }}
              />

              <div className="flex items-start justify-between mb-5">
                <div className={`${type.color} group-hover:scale-110 transition-transform duration-300`}>
                  {type.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${type.badge}`}>
                  {type.count}
                </span>
              </div>

              <h3 className={`text-xl font-bold mb-2 ${type.color}`}>{type.label}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{type.description}</p>

              {/* Bottom bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${type.bg} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

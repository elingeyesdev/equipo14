import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, Shield, MapPin, Check } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]

const trusts = [
  'Sin tarjeta de crédito',
  'Gratis para ciudadanos',
  'iOS & Android',
  'Privacidad garantizada',
]

export default function PremiumCTA() {
  return (
    <footer id="descarga-cta" className="snap-section cta-gradient-mesh text-white min-h-[60vh] flex items-center relative overflow-hidden">
      {/* Grid texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" aria-hidden>
        <defs>
          <pattern id="cta-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cta-grid)"/>
      </svg>

      {/* Animated orbs */}
      {[
        { size:350, top:'10%',  left:'5%',  color:'rgba(37,99,235,0.18)',  del:0   },
        { size:280, top:'50%',  left:'70%', color:'rgba(124,58,237,0.14)', del:2   },
        { size:220, top:'72%',  left:'28%', color:'rgba(236,72,153,0.10)', del:3.5 },
        { size:180, top:'20%',  left:'60%', color:'rgba(16,185,129,0.08)', del:1.5 },
      ].map((orb,i)=>(
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ width:orb.size, height:orb.size, top:orb.top, left:orb.left,
            background:`radial-gradient(circle,${orb.color},transparent 70%)` }}
          animate={{ scale:[1,1.3,1], opacity:[0.5,0.9,0.5] }}
          transition={{ duration:6, repeat:Infinity, delay:orb.del, ease:'easeInOut' }}
          aria-hidden
        />
      ))}

      <div className="container-main py-24 text-center relative z-10">
        <motion.div
          initial={{ opacity:0, y:24 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          transition={{ duration:0.7, ease }}
        >
          {/* Badge */}
          <motion.div
            initial={{ scale:0, rotate:-10 }}
            whileInView={{ scale:1, rotate:0 }}
            viewport={{ once:true }}
            transition={{ type:'spring', stiffness:220, damping:16, delay:0.1 }}
            className="mx-auto mb-8 flex h-18 w-18 items-center justify-center rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10"
            style={{ width:72, height:72 }}
          >
            <Shield className="h-9 w-9 text-white/90" strokeWidth={1.5}/>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-[-0.04em] text-white max-w-2xl mx-auto leading-[1.05]">
            Descarga Alertas
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              y comienza gratis hoy.
            </span>
          </h2>

          <p className="mt-6 text-zinc-400 text-[1.0625rem] max-w-lg mx-auto leading-relaxed">
            Únete a más de 12.000 ciudadanos que ya protegen su ciudad.
            Sin costos, sin publicidad, sin compromisos.
          </p>

          {/* Trust items */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {trusts.map(t=>(
              <span key={t} className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400">
                <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5}/>
                {t}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/descarga"
              className="group inline-flex items-center justify-center gap-2.5 h-14 px-8 rounded-xl font-bold text-[15px] text-zinc-900 bg-white hover:bg-zinc-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Download className="h-5 w-5"/>
              Descargar app gratis
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-xl border border-white/12 font-semibold text-[15px] text-zinc-300 hover:bg-white/6 hover:text-white hover:border-white/20 transition-all duration-300"
            >
              <MapPin className="h-4 w-4"/>
              Ver mapa en vivo
            </Link>
          </div>

          <p className="mt-16 text-[11px] text-zinc-700">
            © {new Date().getFullYear()} Alertas · Seguridad ciudadana en tiempo real
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

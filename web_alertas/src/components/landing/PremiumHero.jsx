import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Car, Activity, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]
const spring = { type: 'spring', stiffness: 260, damping: 22 }

const NOTIFICATIONS = [
  { id: 1, icon: Flame,         color: '#ef4444', bg: 'rgba(239,68,68,0.14)',   title: 'Robo reportado',     sub: 'Av. Cañoto · hace 1 min' },
  { id: 2, icon: Activity,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.14)',  title: 'Emergencia médica',  sub: 'Parque Urbano · hace 30s' },
  { id: 3, icon: Car,           color: '#f97316', bg: 'rgba(249,115,22,0.14)',  title: 'Accidente vial',     sub: 'Calle Junín · hace 3 min' },
  { id: 4, icon: AlertTriangle, color: '#3b82f6', bg: 'rgba(59,130,246,0.14)', title: 'Tráfico intenso',    sub: '4to anillo · hace 5 min'  },
]

const PINS = [
  { id: 1, x: '28%', y: '32%', color: '#ef4444' },
  { id: 2, x: '58%', y: '54%', color: '#f97316' },
  { id: 3, x: '72%', y: '28%', color: '#8b5cf6' },
  { id: 4, x: '42%', y: '68%', color: '#3b82f6' },
]

const HEATS = [
  { x: '28%', y: '32%', size: 80, color: '#ef4444', op: 0.22 },
  { x: '58%', y: '54%', size: 65, color: '#f97316', op: 0.18 },
  { x: '72%', y: '28%', size: 55, color: '#8b5cf6', op: 0.16 },
]

const PARTICLES = [
  { size: 5, x: '6%',  y: '12%', color: 'rgba(59,130,246,0.4)',  dur: 7,  del: 0   },
  { size: 3, x: '90%', y: '20%', color: 'rgba(139,92,246,0.35)', dur: 9,  del: 1.5 },
  { size: 6, x: '10%', y: '70%', color: 'rgba(236,72,153,0.25)', dur: 8,  del: 3   },
  { size: 4, x: '82%', y: '78%', color: 'rgba(59,130,246,0.3)',  dur: 11, del: 2   },
  { size: 3, x: '48%', y: '88%', color: 'rgba(139,92,246,0.25)', dur: 10, del: 4   },
  { size: 5, x: '95%', y: '48%', color: 'rgba(236,72,153,0.2)',  dur: 6,  del: 1   },
]

function Counter({ target, suffix = '', prefix = '', duration = 1.3 }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let start
    const run = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / (duration * 1000), 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(run)
    }
    requestAnimationFrame(run)
  }, [started, target, duration])

  return <span ref={ref}>{prefix}{val}{suffix}</span>
}

function PushFloatCard({ notif, style, delay }) {
  const Icon = notif.icon
  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay, duration: 0.55, ease }}
      style={style}
      className="absolute z-20 flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/75 dark:bg-zinc-900/80 backdrop-blur-xl px-3 py-2.5 shadow-2xl"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: notif.bg }}>
        <Icon className="h-4 w-4" style={{ color: notif.color }} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-zinc-900 leading-tight">{notif.title}</p>
        <p className="text-[10px] text-zinc-500">{notif.sub}</p>
      </div>
    </motion.div>
  )
}

function PhoneMockup() {
  const [visibleNotif, setVisibleNotif] = useState(NOTIFICATIONS[0])
  const [alertCount, setAlertCount] = useState(247)
  const [idx, setIdx] = useState(1)

  useEffect(() => {
    const t = setInterval(() => {
      setVisibleNotif(NOTIFICATIONS[idx % NOTIFICATIONS.length])
      setIdx(i => i + 1)
      setAlertCount(c => c + Math.floor(Math.random() * 2))
    }, 3200)
    return () => clearInterval(t)
  }, [idx])

  return (
    <motion.div
      initial={{ opacity: 0, x: 70, scale: 0.88, rotateY: -10 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
      transition={{ delay: 0.5, duration: 1.0, ease }}
      className="relative select-none"
      style={{ perspective: 1400 }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ rotateX: 4, rotateZ: -2 }}
        className="relative"
      >
        {/* Phone shell */}
        <div style={{
          width: 258, height: 526,
          borderRadius: 46,
          background: 'linear-gradient(145deg, #1c1c1e 0%, #2a2a2c 35%, #1c1c1e 100%)',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.09),
            0 50px 100px -20px rgba(0,0,0,0.65),
            0 25px 50px -15px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.13),
            inset 0 -1px 0 rgba(0,0,0,0.35)
          `,
          position: 'relative',
        }}>
          {/* Buttons */}
          {[{l:true,t:96,h:32},{l:true,t:140,h:56},{l:true,t:208,h:56},{r:true,t:140,h:80}].map((b,i) => (
            <div key={i} style={{
              position:'absolute', borderRadius:3,
              width:3, height:b.h, backgroundColor:'#2c2c2e',
              ...(b.l ? {left:-3} : {right:-3}), top:b.t,
            }} />
          ))}

          {/* Screen */}
          <div style={{ position:'absolute', inset:6, borderRadius:40, overflow:'hidden', background:'#0f1623' }}>
            {/* Dynamic Island */}
            <div style={{
              position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
              width:88, height:28, borderRadius:14, background:'#000', zIndex:30,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <span style={{position:'relative',display:'flex',width:8,height:8}}>
                <span style={{
                  position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e',
                  animation:'ping 1.5s ease-in-out infinite', opacity:0.5,
                }} />
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e' }} />
              </span>
              <span style={{fontSize:8,fontWeight:700,color:'rgba(255,255,255,0.85)',letterSpacing:'0.02em'}}>En vivo</span>
            </div>

            {/* Map SVG */}
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 258 526" preserveAspectRatio="xMidYMid slice">
              <rect width="258" height="526" fill="#0f1623"/>
              {[100,170,250,330,410].map(y=><line key={y} x1="0" y1={y} x2="258" y2={y} stroke="#1e2d45" strokeWidth="0.8"/>)}
              {[55,110,180,225].map(x=><line key={x} x1={x} y1="0" x2={x} y2="526" stroke="#1e2d45" strokeWidth="0.8"/>)}
              <line x1="0" y1="180" x2="258" y2="420" stroke="#1e2d45" strokeWidth="1.2"/>
              {[[10,108,40,56],[60,108,45,56],[120,108,52,56],[10,178,40,66],[60,178,45,66],[120,178,52,66],[10,258,40,64],[60,258,45,64],[120,258,52,64],[10,338,40,60],[120,338,52,60],[185,338,62,60]].map(([x,y,w,h],i)=>(
                <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="#152032" opacity="0.85"/>
              ))}
              <text x="4" y="96" fontSize="5" fill="#2d4060" fontFamily="system-ui">Av. Cañoto</text>
              <text x="4" y="166" fontSize="5" fill="#2d4060" fontFamily="system-ui">2do anillo</text>
            </svg>

            {/* Heatmaps */}
            {HEATS.map((h,i) => (
              <motion.div key={i}
                style={{ position:'absolute', left:h.x, top:h.y, width:h.size, height:h.size,
                  transform:'translate(-50%,-50%)', borderRadius:'50%',
                  background:`radial-gradient(circle,${h.color} 0%,transparent 70%)`, opacity:h.op }}
                animate={{ opacity:[h.op,h.op*1.7,h.op] }}
                transition={{ duration:3, repeat:Infinity, delay:i*0.9 }}
              />
            ))}

            {/* Radar */}
            <div style={{position:'absolute',left:'28%',top:'32%',transform:'translate(-50%,-50%)'}}>
              {[1,2].map(r=>(
                <motion.span key={r}
                  style={{position:'absolute',width:36,height:36,top:-18,left:-18,borderRadius:'50%',border:'1.5px solid rgba(239,68,68,0.6)'}}
                  animate={{scale:[1,3.2],opacity:[0.7,0]}}
                  transition={{duration:2.2,repeat:Infinity,delay:r*0.8}}
                />
              ))}
            </div>

            {/* Pins */}
            {PINS.map((p,i) => (
              <motion.div key={p.id}
                style={{position:'absolute',left:p.x,top:p.y,transform:'translate(-50%,-100%)'}}
                initial={{scale:0,opacity:0}}
                animate={{scale:1,opacity:1}}
                transition={{delay:0.8+i*0.12,...spring}}
              >
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill={p.color}/>
                  <circle cx="8" cy="8" r="3" fill="white" opacity="0.85"/>
                </svg>
              </motion.div>
            ))}

            {/* Stats bar */}
            <motion.div
              initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{delay:1.0,duration:0.4}}
              style={{position:'absolute',top:0,left:0,right:0,zIndex:20,padding:'44px 12px 8px',
                background:'linear-gradient(to bottom,rgba(15,22,35,0.97) 60%,transparent)',
                display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}
            >
              {[
                {label:'Alertas',value:String(alertCount),color:'#ffffff'},
                {label:'Verificadas',value:'98%',color:'#4ade80'},
                {label:'Latencia',value:'<1s',color:'#a78bfa'},
              ].map(s=>(
                <div key={s.label} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{fontSize:8,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.label}</span>
                  <span style={{fontSize:14,fontWeight:800,color:s.color,lineHeight:1.2,fontVariantNumeric:'tabular-nums'}}>{s.value}</span>
                </div>
              ))}
            </motion.div>

            {/* Push notification */}
            <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:20,padding:'0 8px 20px',
              background:'linear-gradient(to top,rgba(15,22,35,0.97) 60%,transparent)'}}>
              <AnimatePresence mode="popLayout">
                {[visibleNotif].map(n => {
                  const Icon = n.icon
                  return (
                    <motion.div key={n.id}
                      layout
                      initial={{opacity:0,y:12,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.97}}
                      transition={{duration:0.35,ease}}
                      style={{display:'flex',alignItems:'center',gap:10,borderRadius:12,border:'1px solid rgba(255,255,255,0.10)',
                        background:'rgba(255,255,255,0.07)',backdropFilter:'blur(8px)',padding:'8px 10px',marginBottom:8}}
                    >
                      <span style={{width:28,height:28,borderRadius:8,background:n.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Icon size={14} color={n.color} strokeWidth={2}/>
                      </span>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:11,fontWeight:700,color:'#fff',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.title}</p>
                        <p style={{fontSize:9,color:'rgba(255,255,255,0.45)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.sub}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{width:80,height:4,borderRadius:2,background:'rgba(255,255,255,0.18)'}}/>
              </div>
            </div>
          </div>

          {/* Glass reflection */}
          <div style={{
            position:'absolute',inset:0,borderRadius:46,pointerEvents:'none',
            background:'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%,rgba(255,255,255,0.03) 100%)',
          }}/>
        </div>

        {/* Floating cards */}
        <PushFloatCard notif={NOTIFICATIONS[0]} delay={1.3} style={{top:'16%',right:-148,width:196}}/>
        <PushFloatCard notif={NOTIFICATIONS[1]} delay={1.5} style={{top:'50%',right:-138,width:184}}/>
        <PushFloatCard notif={NOTIFICATIONS[2]} delay={1.7} style={{top:'33%',left:-134,width:180}}/>
      </motion.div>

      {/* Glow behind */}
      <div style={{
        position:'absolute',inset:0,zIndex:-1,borderRadius:'50%',
        background:'linear-gradient(135deg,#2563eb,#7c3aed)',
        filter:'blur(60px)',opacity:0.22,transform:'scale(0.7) translateY(8%)',
        animation:'glow-pulse 4s ease-in-out infinite',
      }}/>
    </motion.div>
  )
}

const words = [
  { text: 'Conoce lo que ocurre', gradient: false },
  { text: 'en tu ciudad,', gradient: false },
  { text: 'antes que nadie.', gradient: true },
]

export default function PremiumHero() {
  return (
    <section id="inicio" className="snap-section hero-premium-bg relative overflow-hidden" style={{minHeight:'100vh'}}>
      <div className="absolute inset-0 grid-dots opacity-30 pointer-events-none" aria-hidden/>

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div className="absolute top-[-18%] right-[-8%] w-[700px] h-[700px] rounded-full animate-glow-pulse"
          style={{background:'radial-gradient(circle,rgba(37,99,235,0.10),transparent 70%)'}}
          initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1.2}}/>
        <motion.div className="absolute bottom-[-12%] left-[-6%] w-[500px] h-[500px] rounded-full animate-glow-pulse"
          style={{background:'radial-gradient(circle,rgba(124,58,237,0.08),transparent 70%)',animationDelay:'2s'}}
          initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1.2,delay:0.4}}/>
      </div>

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {PARTICLES.map((p,i)=>(
          <motion.span key={i} className="absolute rounded-full"
            style={{width:p.size,height:p.size,left:p.x,top:p.y,background:p.color}}
            animate={{y:[0,-18,6,-10,0],x:[0,5,-3,7,0],opacity:[0.4,0.8,0.4]}}
            transition={{duration:p.dur,repeat:Infinity,delay:p.del,ease:'easeInOut'}}
          />
        ))}
      </div>

      <div className="container-main relative z-10 pt-28 lg:pt-32 section-pad">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] lg:gap-14">

          {/* Left */}
          <div className="max-w-[580px]">
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.04,duration:0.45,ease}}
              className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--elevated)] text-[11px] font-semibold text-[var(--accent)] shadow-sm"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"/>
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500"/>
              </span>
              Seguridad ciudadana · Tiempo real
            </motion.div>

            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] font-extrabold leading-[1.0] tracking-[-0.045em]">
              {words.map((w,wi)=>(
                <motion.span key={wi} className={`block ${w.gradient ? 'text-gradient' : 'text-[var(--ink)]'}`}
                  initial={{opacity:0,y:22,filter:'blur(8px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}}
                  transition={{delay:0.18+wi*0.11,duration:0.6,ease}}
                >
                  {w.text}
                </motion.span>
              ))}
            </h1>

            <motion.p initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.52,duration:0.5,ease}}
              className="mt-6 text-[1.0625rem] leading-[1.85] text-[var(--body)] max-w-[470px]"
            >
              La plataforma de inteligencia urbana que conecta ciudadanos, organizaciones y autoridades.
              Reporta incidentes, visualiza el mapa en vivo y actúa más rápido.
            </motion.p>

            <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.62,duration:0.5,ease}}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/descarga" className="btn-primary group !h-12 !px-7 text-[14px]">
                Comenzar gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
              </Link>
              <Link to="/login" className="btn-secondary !h-12 !px-6 text-[14px]">Ver mapa en vivo</Link>
            </motion.div>

            <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.72,duration:0.5,ease}}
              className="mt-10 flex items-center gap-8 pt-8 border-t border-[var(--border)]"
            >
              {[
                {target:12,suffix:'k+',label:'usuarios activos',color:'text-[var(--accent)]'},
                {target:98,suffix:'%', label:'reportes verificados',color:'text-emerald-500'},
                {target:50,suffix:'+', label:'barrios conectados',color:'text-violet-500'},
              ].map(s=>(
                <div key={s.label}>
                  <p className={`text-2xl font-bold tracking-tight stat-counter ${s.color}`}>
                    <Counter target={s.target} suffix={s.suffix} duration={1.4}/>
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Phone */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup/>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 section-divider" aria-hidden/>
    </section>
  )
}

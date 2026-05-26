import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Server, Radio, Database, CheckCircle2 } from 'lucide-react'
import SectionHeader from './shared/SectionHeader'

const NODES = [
  {
    id: 'app',
    icon: Smartphone,
    name: 'Flutter App',
    desc: 'Cliente móvil',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    metrics: ['iOS & Android', 'Offline mode'],
  },
  {
    id: 'api',
    icon: Server,
    name: 'Laravel API',
    desc: 'Backend & auth',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    metrics: ['REST + Auth', 'Roles & permisos'],
  },
  {
    id: 'ws',
    icon: Radio,
    name: 'WebSockets',
    desc: 'Tiempo real',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    metrics: ['Baja latencia', 'Push broadcast'],
  },
  {
    id: 'db',
    icon: Database,
    name: 'PostgreSQL',
    desc: 'Persistencia',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    metrics: ['Geoespacial', 'PostGIS'],
  },
]

const FLOW_STATS = [
  { label: 'Latencia promedio', value: '48ms', color: 'text-emerald-500' },
  { label: 'Eventos / seg',     value: '340',  color: 'text-[var(--accent)]' },
  { label: 'Uptime',            value: '99.9%',color: 'text-violet-500' },
]

function AnimatedEdge({ index, active }) {
  return (
    <div className="flex-1 flex items-center justify-center px-1 min-w-0">
      <div className="relative w-full max-w-[80px] h-px bg-[var(--border-strong)] overflow-visible">
        {/* Flowing dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full"
          style={{ background: NODES[index].color }}
          animate={active ? { left: ['0%', '100%'] } : {}}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'linear',
            delay: index * 0.4,
          }}
        />
        {/* Arrow head */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0"
          style={{
            borderTop: '3px solid transparent',
            borderBottom: '3px solid transparent',
            borderLeft: `5px solid var(--border-strong)`,
          }}
        />
      </div>
    </div>
  )
}

export default function PremiumTech() {
  const [active, setActive] = useState(true)
  const [packetIdx, setPacketIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setPacketIdx(i => (i + 1) % NODES.length)
    }, 1200)
    return () => clearInterval(t)
  }, [])

  return (
    <section id="tecnologia" className="snap-section bg-[var(--elevated)] section-pad relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden />

      <div className="container-main relative z-10">
        <SectionHeader
          eyebrow="Arquitectura"
          title="Infraestructura que escala contigo."
          description="Flujo de datos desde el dispositivo hasta la base de datos. Alta disponibilidad y latencia mínima."
          className="mb-14"
        />

        {/* ── Flow diagram ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="admin-card p-6 lg:p-8 mb-6"
        >
          {/* Status bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-[var(--ink)]">Sistema operativo</span>
            </div>
            <div className="flex items-center gap-4">
              {FLOW_STATS.map(s => (
                <div key={s.label} className="text-center hidden sm:block">
                  <p className={`text-[13px] font-bold stat-counter ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-[var(--muted)] uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
              <button
                onClick={() => setActive(a => !a)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--surface-hover)] text-[var(--muted)]'}`}
              >
                {active ? '● Activo' : '○ Pausado'}
              </button>
            </div>
          </div>

          {/* Nodes + edges */}
          <div className="flex items-start gap-1">
            {NODES.map((node, i) => {
              const Icon = node.icon
              const isActive = active && packetIdx === i
              return (
                <div key={node.id} className="flex items-center flex-1 min-w-0">
                  {/* Node */}
                  <motion.div
                    className="flex-1 flex flex-col items-center gap-2"
                    animate={isActive ? { y: [0, -3, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Icon box */}
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-300"
                      style={{
                        background: isActive ? node.bg : 'var(--surface-hover)',
                        borderColor: isActive ? node.color : 'var(--border-strong)',
                        boxShadow: isActive ? `0 0 20px ${node.color}30` : 'none',
                      }}
                    >
                      <Icon className="h-6 w-6" style={{ color: node.color }} strokeWidth={1.5} />
                      {/* Active indicator */}
                      {isActive && (
                        <motion.span
                          className="absolute -top-1 -right-1 h-3 w-3 rounded-full"
                          style={{ background: node.color }}
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-bold text-[var(--ink)] leading-tight">{node.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{node.desc}</p>
                    </div>
                    {/* Metrics pills */}
                    <div className="flex flex-col gap-1 items-center">
                      {node.metrics.map(m => (
                        <span key={m} className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background: node.bg, color: node.color }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Edge (not after last node) */}
                  {i < NODES.length - 1 && <AnimatedEdge index={i} active={active} />}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Packet trace ── */}
        <div className="grid sm:grid-cols-3 gap-3">
          {FLOW_STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="admin-card p-4 text-center"
            >
              <p className={`text-2xl font-bold stat-counter ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-[var(--muted)] mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 section-divider" aria-hidden />
    </section>
  )
}

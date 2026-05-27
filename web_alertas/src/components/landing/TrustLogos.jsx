import { motion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

/* Fictitious logos using text + icon combos — elegant monochromatic */
const logos = [
  { name: 'Municipio SCZ', abbr: 'GMSC', icon: '🏛️' },
  { name: 'Seg. Ciudadana', abbr: 'SC',   icon: '🛡️' },
  { name: 'Vecinos Unidos', abbr: 'VU',   icon: '🤝' },
  { name: 'Cruz Roja', abbr: 'CRB',   icon: '➕' },
  { name: 'TechBolivia', abbr: 'TB',   icon: '⚡' },
  { name: 'ONG CiudadViva', abbr: 'CV',   icon: '🌱' },
]

export default function TrustLogos() {
  return (
    <section className="bg-[var(--surface)] py-12 relative overflow-hidden">
      <div className="container-main">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] mb-8"
        >
          Con la confianza de comunidades y organizaciones
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4, ease }}
              className="group flex items-center gap-2.5 px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--elevated)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-300 cursor-default"
            >
              <span className="text-[18px] grayscale opacity-60 group-hover:opacity-80 transition-opacity">{logo.icon}</span>
              <div>
                <span className="text-[11px] font-bold tracking-wide text-[var(--ink)] opacity-50 group-hover:opacity-70 transition-opacity block leading-none">
                  {logo.abbr}
                </span>
                <span className="text-[10px] text-[var(--muted)] block leading-tight mt-0.5">{logo.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

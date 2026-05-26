import { motion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

/** Animación al montar — evita opacity:0 dentro de scroll-snap */
export function FadeUp({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

export function FadeIn({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, className = '', stagger = 0.08, delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay, staggerChildren: stagger }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
      }}
    >
      {children}
    </motion.div>
  )
}
